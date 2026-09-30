import React, { useState } from 'react';
import { PlayerProfile, GoalType } from '../types/gym';
import { User, X, Check, Dumbbell, Target } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  onSaveProfile: (profile: PlayerProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [formData, setFormData] = useState<PlayerProfile>({ ...profile });

  React.useEffect(() => {
    setFormData({ ...profile });
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0e1320] border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">ملف اللاعب الرياضي والأهداف</h3>
              <p className="text-xs text-slate-400">تُستخدم هذه البيانات كأساس دقيق لجميع حسابات التطبيق</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">اسم اللاعب</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:border-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">الوزن الحالي (كجم)</label>
              <input
                type="number"
                step="0.1"
                value={formData.currentWeightKg}
                onChange={(e) => setFormData({ ...formData, currentWeightKg: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-sm font-mono text-center"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">الوزن المستهدف (كجم)</label>
              <input
                type="number"
                step="0.1"
                value={formData.targetWeightKg}
                onChange={(e) => setFormData({ ...formData, targetWeightKg: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-emerald-400 text-sm font-mono text-center font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">الهدف الأساسي</label>
              <select
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value as GoalType })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
              >
                <option value="muscle_gain">ضخامة عضلية (Muscle Gain)</option>
                <option value="fat_loss">تنشيف وحرق دهون (Fat Loss)</option>
                <option value="strength">زيادة القوة البدنية (Strength)</option>
                <option value="recomp">إعادة تكوين الجسم (Recomp)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">مستوى الخبرة</label>
              <select
                value={formData.experienceLevel}
                onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
              >
                <option value="beginner">مبتدئ (أقل من سنة)</option>
                <option value="intermediate">متوسط (1 - 3 سنوات)</option>
                <option value="advanced">متقدم (أكثر من 3 سنوات)</option>
              </select>
            </div>
          </div>

          {/* Daily Targets */}
          <div className="pt-2 border-t border-white/5 space-y-2">
            <span className="font-bold text-slate-300 block">أهداف التغذية اليومية (Target Macros):</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-slate-900/60 p-2 rounded-xl border border-white/5 text-center">
                <span className="text-[10px] text-amber-300 block">السعرات</span>
                <input
                  type="number"
                  value={formData.dailyCalorieTarget}
                  onChange={(e) => setFormData({ ...formData, dailyCalorieTarget: parseInt(e.target.value) || 0 })}
                  className="w-full text-center text-xs font-mono font-bold text-white bg-transparent"
                />
              </div>
              <div className="bg-slate-900/60 p-2 rounded-xl border border-white/5 text-center">
                <span className="text-[10px] text-emerald-300 block">بروتين (جم)</span>
                <input
                  type="number"
                  value={formData.dailyProteinTarget}
                  onChange={(e) => setFormData({ ...formData, dailyProteinTarget: parseInt(e.target.value) || 0 })}
                  className="w-full text-center text-xs font-mono font-bold text-emerald-400 bg-transparent"
                />
              </div>
              <div className="bg-slate-900/60 p-2 rounded-xl border border-white/5 text-center">
                <span className="text-[10px] text-cyan-300 block">كارب (جم)</span>
                <input
                  type="number"
                  value={formData.dailyCarbsTarget}
                  onChange={(e) => setFormData({ ...formData, dailyCarbsTarget: parseInt(e.target.value) || 0 })}
                  className="w-full text-center text-xs font-mono font-bold text-cyan-400 bg-transparent"
                />
              </div>
              <div className="bg-slate-900/60 p-2 rounded-xl border border-white/5 text-center">
                <span className="text-[10px] text-rose-300 block">دهون (جم)</span>
                <input
                  type="number"
                  value={formData.dailyFatTarget}
                  onChange={(e) => setFormData({ ...formData, dailyFatTarget: parseInt(e.target.value) || 0 })}
                  className="w-full text-center text-xs font-mono font-bold text-rose-400 bg-transparent"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md shadow-emerald-950/40"
            >
              حفظ الإعدادات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
