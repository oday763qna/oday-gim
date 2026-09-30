import React, { useState } from 'react';
import { PlayerProfile } from '../types/gym';
import { supabase } from '../lib/supabase';
import {
  User,
  Mail,
  Lock,
  LogOut,
  Sliders,
  Globe,
  Moon,
  Info,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Flame,
  Beef,
  Wheat,
  Droplet,
} from 'lucide-react';

interface SettingsViewProps {
  profile: PlayerProfile;
  onSaveProfile: (profile: PlayerProfile) => void;
  onSignOut: () => void;
  onNavigateToAbout: () => void;
  onOpenRules: () => void;
  userEmail?: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onSaveProfile,
  onSignOut,
  onNavigateToAbout,
  onOpenRules,
  userEmail,
}) => {
  // Account Form
  const [name, setName] = useState(profile.name || '');
  const [currentWeight, setCurrentWeight] = useState(profile.currentWeightKg?.toString() || '');
  const [targetWeight, setTargetWeight] = useState(profile.targetWeightKg?.toString() || '');
  const [caloriesTarget, setCaloriesTarget] = useState(profile.dailyCalorieTarget?.toString() || '');
  const [proteinTarget, setProteinTarget] = useState(profile.dailyProteinTarget?.toString() || '');
  const [carbsTarget, setCarbsTarget] = useState(profile.dailyCarbsTarget?.toString() || '');
  const [fatTarget, setFatTarget] = useState(profile.dailyFatTarget?.toString() || '');

  // Password Change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Profile Save
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSavedMsg, setProfileSavedMsg] = useState<string | null>(null);

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSavedMsg(null);

    const updatedProfile: PlayerProfile = {
      ...profile,
      name: name.trim(),
      currentWeightKg: parseFloat(currentWeight) || 0,
      targetWeightKg: parseFloat(targetWeight) || 0,
      dailyCalorieTarget: parseInt(caloriesTarget) || 0,
      dailyProteinTarget: parseInt(proteinTarget) || 0,
      dailyCarbsTarget: parseInt(carbsTarget) || 0,
      dailyFatTarget: parseInt(fatTarget) || 0,
    };

    onSaveProfile(updatedProfile);

    // Also persist to Supabase if session active
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (userId) {
        await supabase.from('profiles').upsert({
          id: userId,
          full_name: name.trim(),
          current_weight_kg: parseFloat(currentWeight) || null,
          target_weight_kg: parseFloat(targetWeight) || null,
          daily_calories: parseInt(caloriesTarget) || null,
          daily_protein: parseInt(proteinTarget) || null,
          daily_carbs: parseInt(carbsTarget) || null,
          daily_fat: parseInt(fatTarget) || null,
          updated_at: new Date().toISOString(),
        });
      }
      setProfileSavedMsg('تم حفظ التغييرات بنجاح.');
      setTimeout(() => setProfileSavedMsg(null), 3000);
    } catch (err) {
      console.error('Failed to sync profile to Supabase:', err);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError('يجب أن تكون كلمة المرور 6 خانات على الأقل.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('كلمتا المرور غير متطابقتين.');
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      setPasswordSuccess('تم تحديث كلمة المرور بنجاح.');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err: any) {
      setPasswordError(err.message || 'فشل تحديث كلمة المرور.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-fade-in text-slate-100">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <Sliders className="w-4 h-4" />
            <span>تفضيلات الحساب والتطبيق</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">الإعدادات</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            إدارة حسابك الشخصي، أهدافك الرياضية، وخيارات التطبيق
          </p>
        </div>

        <button
          onClick={onSignOut}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/20 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>

      {/* Section 1: Account Settings */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2.5 border-b border-white/10 pb-3">
          <User className="w-5 h-5 text-emerald-400" />
          <span>بيانات الحساب</span>
        </h2>

        {profileSavedMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{profileSavedMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveAccount} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                الاسم المعروض
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="اسم اللاعب"
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                البريد الإلكتروني (المسجل)
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={userEmail || 'غير محدد'}
                  dir="ltr"
                  className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-2.5 pl-10 text-sm text-slate-400 cursor-not-allowed"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Targets & Body Metrics */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
              <span>الأهداف والقياسات الأساسية:</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">الوزن الحالي (كجم)</label>
                <input
                  type="number"
                  step="0.1"
                  value={currentWeight}
                  onChange={(e) => setCurrentWeight(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-white text-center font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">الوزن المستهدف (كجم)</label>
                <input
                  type="number"
                  step="0.1"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-white text-center font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">هدف السعرات اليومي</label>
                <input
                  type="number"
                  value={caloriesTarget}
                  onChange={(e) => setCaloriesTarget(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-amber-400 text-center font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">هدف البروتين (جم)</label>
                <input
                  type="number"
                  value={proteinTarget}
                  onChange={(e) => setProteinTarget(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-emerald-400 text-center font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={profileSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{profileSaving ? 'جاري الحفظ...' : 'حفظ البيانات'}</span>
            </button>
          </div>
        </form>

        {/* Change Password Sub-card */}
        <div className="pt-6 border-t border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>تغيير كلمة المرور</span>
          </h3>

          {passwordSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  كلمة المرور الجديدة
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  تأكيد كلمة المرور الجديدة
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={passwordLoading}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
              >
                {passwordLoading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Section 2: App Preferences */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2.5 border-b border-white/10 pb-3">
          <Globe className="w-5 h-5 text-emerald-400" />
          <span>تفضيلات التطبيق</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-bold text-white">اللغة (Language)</div>
              <div className="text-xs text-slate-400">لغة واجهة التطبيق الأساسية</div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              العربية (RTL)
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-bold text-white">المظهر (Theme)</div>
              <div className="text-xs text-slate-400">النمط البصري للمنصة</div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg bg-slate-800 text-slate-300 border border-white/10">
              <Moon className="w-3.5 h-3.5 text-emerald-400" />
              <span>الوضع الرياضي الداكن</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: App Information */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2.5 border-b border-white/10 pb-3">
          <Info className="w-5 h-5 text-emerald-400" />
          <span>معلومات التطبيق والدستور</span>
        </h2>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/60 border border-white/5">
          <div>
            <div className="text-sm font-bold text-white">معلومات عنا ومطور التطبيق</div>
            <div className="text-xs text-slate-400 mt-0.5">
              تعرف على رؤية Ode Gym AI، المطور Oday Qutqut، وقنوات التواصل المباشر.
            </div>
          </div>
          <button
            onClick={onNavigateToAbout}
            className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            صفحة معلومات عنا
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/60 border border-white/5">
          <div>
            <div className="text-sm font-bold text-white">ميثاق الـ 20 قاعدة الصارمة</div>
            <div className="text-xs text-slate-400 mt-0.5">
              القواعد الذهبية لضمان سلامتك وعدم اختراع المعلومات.
            </div>
          </div>
          <button
            onClick={onOpenRules}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            عرض القواعد
          </button>
        </div>
      </div>
    </div>
  );
};
