import React from 'react';
import {
  Dumbbell,
  Utensils,
  Activity,
  BookOpen,
  TrendingUp,
  Bot,
  ShieldCheck,
  Flame,
  Beef,
  Wheat,
  Droplet,
  Info,
  Settings,
  User,
} from 'lucide-react';
import { PlayerProfile, MealLogItem } from '../types/gym';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: PlayerProfile;
  todayMeals: MealLogItem[];
  onOpenRules: () => void;
  onOpenProfile: () => void;
  pendingProposalsCount: number;
  userEmail?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  profile,
  todayMeals,
  onOpenRules,
  onOpenProfile,
  pendingProposalsCount,
  userEmail,
}) => {
  // Calculate consumed totals
  const totalCalories = todayMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
  const totalProtein = todayMeals.reduce((acc, m) => acc + (m.proteinG || 0), 0);
  const totalCarbs = todayMeals.reduce((acc, m) => acc + (m.carbsG || 0), 0);
  const totalFat = todayMeals.reduce((acc, m) => acc + (m.fatG || 0), 0);

  const calPercent = profile.dailyCalorieTarget > 0
    ? Math.min(100, Math.round((totalCalories / profile.dailyCalorieTarget) * 100))
    : 0;
  const proPercent = profile.dailyProteinTarget > 0
    ? Math.min(100, Math.round((totalProtein / profile.dailyProteinTarget) * 100))
    : 0;

  const displayName = profile.name || userEmail?.split('@')[0] || 'اللاعب';
  const weightText = profile.currentWeightKg > 0 ? ` (${profile.currentWeightKg} كجم)` : '';

  const navItems = [
    { id: 'plan', label: 'خطة التمرين', icon: BookOpen, badge: pendingProposalsCount > 0 ? `${pendingProposalsCount} اقتراح` : null },
    { id: 'logger', label: 'تسجيل الأداء', icon: Activity },
    { id: 'meals', label: 'تحليل الوجبات', icon: Utensils },
    { id: 'machines', label: 'فهم التمارين والأجهزة', icon: Dumbbell },
    { id: 'progress', label: 'تطور الأداء والوزن', icon: TrendingUp },
    { id: 'coach', label: 'مساعد Ode Gym', icon: Bot, isAura: true },
    { id: 'about', label: 'معلومات عنا', icon: Info },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0b0e17]/95 backdrop-blur-xl border-b border-white/10 transition-all">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div
          onClick={() => setActiveTab('plan')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Dumbbell className="w-6 h-6 transform -rotate-12" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-75" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-wide text-white">
                Ode Gym <span className="text-emerald-400">AI</span>
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                المحرك الذكي الرسمي
              </span>
            </div>
            <p className="text-xs text-slate-400">
              دقة عالية • عدم اختراع • بدون تشخيص طبي • موافقة اللاعب أولاً
            </p>
          </div>
        </div>

        {/* Quick Macros Dashboard Bar */}
        <div className="hidden lg:flex items-center gap-3 bg-[#131926] px-4 py-2 rounded-2xl border border-white/5">
          {/* Calories */}
          <div className="flex items-center gap-2 pr-2 border-l border-white/10 pl-3">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">سعرات اليوم</div>
              <div className="text-xs font-bold text-white font-mono">
                {totalCalories}{' '}
                {profile.dailyCalorieTarget > 0 && (
                  <span className="text-slate-400 font-normal">/ {profile.dailyCalorieTarget}</span>
                )}
              </div>
            </div>
            {profile.dailyCalorieTarget > 0 && (
              <div className="w-10 bg-slate-800 h-1.5 rounded-full overflow-hidden mr-1">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: `${calPercent}%` }} />
              </div>
            )}
          </div>

          {/* Protein */}
          <div className="flex items-center gap-2 pr-2 border-l border-white/10 pl-3">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Beef className="w-4 h-4" />
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">بروتين</div>
              <div className="text-xs font-bold text-emerald-400 font-mono">
                {totalProtein}g{' '}
                {profile.dailyProteinTarget > 0 && (
                  <span className="text-slate-400 font-normal">/ {profile.dailyProteinTarget}g</span>
                )}
              </div>
            </div>
            {profile.dailyProteinTarget > 0 && (
              <div className="w-10 bg-slate-800 h-1.5 rounded-full overflow-hidden mr-1">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${proPercent}%` }} />
              </div>
            )}
          </div>

          {/* Carbs */}
          <div className="flex items-center gap-1.5 pl-3 border-l border-white/10">
            <Wheat className="w-3.5 h-3.5 text-cyan-400" />
            <div className="text-xs font-mono">
              <span className="text-cyan-400 font-semibold">{totalCarbs}g</span>
              <span className="text-slate-500 text-[10px]"> كربوهيدرات</span>
            </div>
          </div>

          {/* Fats */}
          <div className="flex items-center gap-1.5 pl-1">
            <Droplet className="w-3.5 h-3.5 text-rose-400" />
            <div className="text-xs font-mono">
              <span className="text-rose-400 font-semibold">{totalFat}g</span>
              <span className="text-slate-500 text-[10px]"> دهون</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenRules}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-emerald-400 text-xs font-medium border border-emerald-500/20 transition-all hover:border-emerald-500/40 cursor-pointer"
            title="عرض الـ 20 قاعدة الذهبية الصارمة"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">دستور القواعد</span>
          </button>

          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-medium border border-emerald-500/30 transition-all cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <span>{displayName}{weightText}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex items-center gap-1 overflow-x-auto py-2 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-md shadow-emerald-950/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
                {item.isAura && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
