/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  WorkoutPlan,
  WorkoutLogSession,
  MealLogItem,
  BodyweightEntry,
  PlayerProfile,
  PlanProposal,
} from './types/gym';
import {
  EMPTY_PROFILE,
  EMPTY_PLAN,
  EMPTY_WORKOUTS,
  EMPTY_MEALS,
  EMPTY_WEIGHTS,
  EMPTY_PROPOSALS,
  STORAGE_KEYS,
  loadStoredData,
  saveStoredData,
  purgeLegacyMockData,
  clearAllUserData,
} from './utils/storage';

import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Header } from './components/Header';
import { AuthView } from './components/AuthView';
import { RulesModal } from './components/RulesModal';
import { ProfileModal } from './components/ProfileModal';
import { PlanOrganizerView } from './components/PlanOrganizerView';
import { WorkoutLoggerView } from './components/WorkoutLoggerView';
import { MealAnalyzerView } from './components/MealAnalyzerView';
import { MachineExerciseGuideView } from './components/MachineExerciseGuideView';
import { ProgressAnalyticsView } from './components/ProgressAnalyticsView';
import { CoachChatView } from './components/CoachChatView';
import { AboutUsView } from './components/AboutUsView';
import { SettingsView } from './components/SettingsView';
import { AdminSetupView } from './components/AdminSetupView';
import { ShieldCheck, Dumbbell } from 'lucide-react';

export default function App() {
  // Purge any old legacy mock data from initial builds
  useEffect(() => {
    purgeLegacyMockData();
  }, []);

  // Supabase Auth Session State
  const [user, setUser] = useState<any | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/admin/setup' || hash === '#/admin/setup' || hash === '#admin') {
        return 'admin';
      }
    }
    return 'plan';
  });

  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // Sync tab with URL history
  useEffect(() => {
    if (activeTab === 'admin') {
      if (window.location.pathname !== '/admin/setup') {
        window.history.replaceState(null, '', '/admin/setup');
      }
    } else {
      if (window.location.pathname === '/admin/setup') {
        window.history.replaceState(null, '', '/');
      }
    }
  }, [activeTab]);

  // Core Persistent State
  const [profile, setProfile] = useState<PlayerProfile>(() =>
    loadStoredData(STORAGE_KEYS.PROFILE, EMPTY_PROFILE)
  );

  const [plan, setPlan] = useState<WorkoutPlan>(() =>
    loadStoredData(STORAGE_KEYS.PLAN, EMPTY_PLAN)
  );

  const [workouts, setWorkouts] = useState<WorkoutLogSession[]>(() =>
    loadStoredData(STORAGE_KEYS.WORKOUTS, EMPTY_WORKOUTS)
  );

  const [todayMeals, setTodayMeals] = useState<MealLogItem[]>(() =>
    loadStoredData(STORAGE_KEYS.MEALS, EMPTY_MEALS)
  );

  const [weights, setWeights] = useState<BodyweightEntry[]>(() =>
    loadStoredData(STORAGE_KEYS.WEIGHTS, EMPTY_WEIGHTS)
  );

  const [proposals, setProposals] = useState<PlanProposal[]>(() =>
    loadStoredData(STORAGE_KEYS.PROPOSALS, EMPTY_PROPOSALS)
  );

  // Check Supabase session on mount
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          setUser(session.user);
          await loadUserDataFromSupabase(session.user);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (isMounted) setLoadingAuth(false);
      }
    }

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await loadUserDataFromSupabase(session.user);
      } else {
        setUser(null);
      }
      setLoadingAuth(false);
    });

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Fetch user data from Supabase tables
  const loadUserDataFromSupabase = async (currentUser: any) => {
    if (!currentUser?.id) return;

    try {
      // 1. Profile
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (profileRow) {
        setProfile({
          name: profileRow.full_name || currentUser.user_metadata?.full_name || '',
          age: profileRow.age || 0,
          heightCm: profileRow.height_cm || 0,
          currentWeightKg: profileRow.current_weight_kg || 0,
          targetWeightKg: profileRow.target_weight_kg || 0,
          goal: (profileRow.goal as any) || 'muscle_gain',
          experienceLevel: (profileRow.experience_level as any) || 'intermediate',
          dailyCalorieTarget: profileRow.daily_calories || 0,
          dailyProteinTarget: profileRow.daily_protein || 0,
          dailyCarbsTarget: profileRow.daily_carbs || 0,
          dailyFatTarget: profileRow.daily_fat || 0,
          splitType: profileRow.split_type || '',
        });
      } else {
        // Initialize profile row if not existing
        const initialName = currentUser.user_metadata?.full_name || '';
        if (initialName) {
          setProfile((prev) => ({ ...prev, name: initialName }));
        }
      }

      // 2. Active Workout Plan
      const { data: planRows } = await supabase
        .from('workout_plans')
        .select(`
          id, title, description, updated_at,
          workout_days (
            id, day_name, focus_muscles,
            planned_exercises (
              id, exercise_name_ar, exercise_name_en, target_muscle,
              sets, target_reps, rest_secs, equipment_type, notes
            )
          )
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (planRows && planRows.length > 0) {
        const p = planRows[0];
        const days = (p.workout_days || []).map((d: any) => ({
          id: d.id,
          dayName: d.day_name,
          focusMuscles: d.focus_muscles || [],
          exercises: (d.planned_exercises || []).map((e: any) => ({
            id: e.id,
            nameAr: e.exercise_name_ar,
            nameEn: e.exercise_name_en,
            targetMuscle: e.target_muscle,
            sets: e.sets,
            targetReps: e.target_reps,
            restSecs: e.rest_secs,
            equipmentType: e.equipment_type,
            notes: e.notes,
          })),
        }));

        setPlan({
          id: p.id,
          title: p.title,
          description: p.description || '',
          lastUpdated: p.updated_at ? p.updated_at.split('T')[0] : '',
          days,
        });
      }

      // 3. Bodyweight measurements
      const { data: measurementRows } = await supabase
        .from('body_measurements')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('measurement_date', { ascending: true });

      if (measurementRows && measurementRows.length > 0) {
        const weightEntries: BodyweightEntry[] = measurementRows
          .filter((m: any) => m.weight_kg !== null)
          .map((m: any) => ({
            id: m.id,
            date: m.measurement_date,
            weightKg: m.weight_kg,
            note: m.notes,
          }));
        setWeights(weightEntries);
        if (weightEntries.length > 0) {
          const latestWeight = weightEntries[weightEntries.length - 1].weightKg;
          setProfile((prev) => ({ ...prev, currentWeightKg: latestWeight }));
        }
      }
    } catch (err) {
      console.error('Error loading user data from Supabase:', err);
    }
  };

  // Sync to local storage for instant responsiveness
  useEffect(() => {
    saveStoredData(STORAGE_KEYS.PROFILE, profile);
  }, [profile]);

  useEffect(() => {
    saveStoredData(STORAGE_KEYS.PLAN, plan);
  }, [plan]);

  useEffect(() => {
    saveStoredData(STORAGE_KEYS.WORKOUTS, workouts);
  }, [workouts]);

  useEffect(() => {
    saveStoredData(STORAGE_KEYS.MEALS, todayMeals);
  }, [todayMeals]);

  useEffect(() => {
    saveStoredData(STORAGE_KEYS.WEIGHTS, weights);
  }, [weights]);

  useEffect(() => {
    saveStoredData(STORAGE_KEYS.PROPOSALS, proposals);
  }, [proposals]);

  // Handlers
  const handleUpdateProposal = (id: string, status: 'approved' | 'rejected') => {
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );
  };

  const handleApproveProposal = (proposal: PlanProposal) => {
    setProposals((prev) => {
      const exists = prev.some((p) => p.id === proposal.id);
      if (exists) {
        return prev.map((p) => (p.id === proposal.id ? { ...p, status: 'approved' } : p));
      }
      return [...prev, { ...proposal, status: 'approved' }];
    });
  };

  const handleSaveWorkoutSession = async (session: WorkoutLogSession) => {
    setWorkouts((prev) => [session, ...prev]);

    // Persist to Supabase if authenticated
    if (user?.id) {
      try {
        await supabase.from('workout_sessions').insert({
          id: session.id,
          user_id: user.id,
          session_date: session.date,
          session_title: session.sessionTitle,
          duration_minutes: session.durationMinutes,
          total_volume_kg: session.totalVolumeKg,
          notes: session.notes,
        });
      } catch (err) {
        console.error('Failed to sync workout session to Supabase:', err);
      }
    }
  };

  const handleAddMeal = async (meal: MealLogItem) => {
    setTodayMeals((prev) => [meal, ...prev]);

    // Persist to Supabase if authenticated
    if (user?.id) {
      try {
        await supabase.from('meals').insert({
          id: meal.id,
          user_id: user.id,
          meal_date: meal.date,
          meal_time: meal.time,
          meal_type: meal.mealType,
          meal_name: meal.name,
          calories: meal.calories,
          protein_g: meal.proteinG,
          carbs_g: meal.carbsG,
          fat_g: meal.fatG,
          is_estimated: meal.isEstimated,
        });
      } catch (err) {
        console.error('Failed to sync meal to Supabase:', err);
      }
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    setTodayMeals((prev) => prev.filter((m) => m.id !== mealId));

    if (user?.id) {
      try {
        await supabase.from('meals').delete().eq('id', mealId).eq('user_id', user.id);
      } catch (err) {
        console.error('Failed to delete meal in Supabase:', err);
      }
    }
  };

  const handleAddWeight = async (entry: BodyweightEntry) => {
    setWeights((prev) => [...prev, entry]);
    setProfile((prev) => ({ ...prev, currentWeightKg: entry.weightKg }));

    // Persist to Supabase if authenticated
    if (user?.id) {
      try {
        await supabase.from('body_measurements').insert({
          id: entry.id,
          user_id: user.id,
          measurement_date: entry.date,
          weight_kg: entry.weightKg,
          notes: entry.note,
        });
      } catch (err) {
        console.error('Failed to sync weight to Supabase:', err);
      }
    }
  };

  const handleUpdatePlan = async (newPlan: WorkoutPlan) => {
    setPlan(newPlan);

    // Persist to Supabase if authenticated
    if (user?.id && newPlan.title) {
      try {
        await supabase.from('workout_plans').upsert({
          id: newPlan.id || undefined,
          user_id: user.id,
          title: newPlan.title,
          description: newPlan.description,
          is_active: true,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Failed to sync plan to Supabase:', err);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
    setUser(null);
    setProfile(EMPTY_PROFILE);
    setPlan(EMPTY_PLAN);
    setWorkouts(EMPTY_WORKOUTS);
    setTodayMeals(EMPTY_MEALS);
    setWeights(EMPTY_WEIGHTS);
    setProposals(EMPTY_PROPOSALS);
    clearAllUserData();
  };

  // Loading state while checking Supabase session
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col items-center justify-center font-['Cairo',sans-serif]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-xl shadow-emerald-500/25 animate-pulse">
            <Dumbbell className="w-7 h-7 transform -rotate-12" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-base font-bold text-white">Ode Gym AI</h2>
            <p className="text-xs text-slate-400">جاري فحص الجلسة والاتصال الآمن...</p>
          </div>
        </div>
      </div>
    );
  }

  // Page protection: Unauthenticated users MUST sign in or sign up first
  if (!user) {
    return (
      <AuthView
        onAuthSuccess={async (newUser) => {
          setUser(newUser);
          await loadUserDataFromSupabase(newUser);
        }}
      />
    );
  }

  const pendingProposalsCount = proposals.filter((p) => p.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#090b10] text-slate-100 flex flex-col font-['Cairo',sans-serif]">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        todayMeals={todayMeals}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        pendingProposalsCount={pendingProposalsCount}
        userEmail={user?.email}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        {activeTab === 'plan' && (
          <PlanOrganizerView
            plan={plan}
            onUpdatePlan={handleUpdatePlan}
            proposals={proposals}
            onUpdateProposal={handleUpdateProposal}
            profile={profile}
            onRequestAiAdvice={() => setActiveTab('coach')}
          />
        )}

        {activeTab === 'logger' && (
          <WorkoutLoggerView
            plan={plan}
            workouts={workouts}
            onSaveWorkout={handleSaveWorkoutSession}
          />
        )}

        {activeTab === 'meals' && (
          <MealAnalyzerView
            todayMeals={todayMeals}
            onAddMeal={handleAddMeal}
            onDeleteMeal={handleDeleteMeal}
            profile={profile}
          />
        )}

        {activeTab === 'machines' && <MachineExerciseGuideView />}

        {activeTab === 'progress' && (
          <ProgressAnalyticsView
            workouts={workouts}
            weights={weights}
            profile={profile}
            onAddWeight={handleAddWeight}
            onApproveProposal={handleApproveProposal}
          />
        )}

        {activeTab === 'coach' && (
          <CoachChatView
            plan={plan}
            workouts={workouts}
            todayMeals={todayMeals}
            weights={weights}
            profile={profile}
            onApproveProposal={handleApproveProposal}
          />
        )}

        {activeTab === 'about' && (
          <AboutUsView
            onBackToApp={() => setActiveTab('plan')}
            onOpenRules={() => setIsRulesOpen(true)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            profile={profile}
            onSaveProfile={setProfile}
            onSignOut={handleSignOut}
            onNavigateToAbout={() => setActiveTab('about')}
            onOpenRules={() => setIsRulesOpen(true)}
            userEmail={user?.email}
          />
        )}

        {activeTab === 'admin' && <AdminSetupView />}
      </main>

      {/* Rules Modal */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        onSaveProfile={setProfile}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 py-6 bg-[#07090e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white">Ode Gym AI</span>
            <span>• المحرك الذكي الرسمي لكمال الأجسام واللياقة</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setActiveTab('about')}
              className="text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              معلومات عنا
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => setIsRulesOpen(true)}
              className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ميثاق الـ 20 قاعدة الذهبية</span>
            </button>
            <span className="text-slate-600">|</span>
            <span className="text-slate-500">مطور التطبيق: Oday Qutqut</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
