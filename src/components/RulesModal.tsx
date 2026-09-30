import React from 'react';
import { ODE_GYM_RULES } from '../utils/storage';
import { ShieldAlert, CheckCircle2, X } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0e131f] border border-emerald-500/30 rounded-2xl p-6 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                دستور وقواعد Ode Gym AI الصارمة
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  20 قاعدة ذهبية
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                الأولوية: الدقة &gt; عدم الاختراع &gt; وضوح النتيجة &gt; السرعة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rules Content */}
        <div className="overflow-y-auto py-4 space-y-2.5 pr-1 flex-1">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs leading-relaxed">
            <strong>تذكير مهم:</strong> أنت جزء من تطبيق Ode Gym AI ولست مدرباً شخصياً مستقلاً أو طبيباً بديلاً. لا يتم تغيير أي خطة تلقائياً وأي قيمة غذائية للصورة تعتبر تقديرية حصراً.
          </div>

          <div className="grid grid-cols-1 gap-2 pt-1">
            {ODE_GYM_RULES.map((rule) => {
              const isHighlight = [1, 2, 3, 4, 7, 8, 9, 11, 12, 16].includes(rule.id);
              return (
                <div
                  key={rule.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-sm transition-all ${
                    isHighlight
                      ? 'bg-slate-900/80 border-emerald-500/30 text-slate-200'
                      : 'bg-slate-900/40 border-white/5 text-slate-300'
                  }`}
                >
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
                    {rule.id}
                  </span>
                  <div className="flex-1">
                    <p className="leading-snug">{rule.text}</p>
                  </div>
                  {isHighlight && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-900/20"
          >
            فهمت، الالتزام بالمعايير الصارمة
          </button>
        </div>
      </div>
    </div>
  );
};
