import React from 'react';
import {
  Dumbbell,
  Mail,
  ShieldCheck,
  User,
  Heart,
  Award,
  Sparkles,
  ExternalLink,
  Target,
  Zap,
  Lock,
} from 'lucide-react';

interface AboutUsViewProps {
  onBackToApp?: () => void;
  onOpenRules?: () => void;
}

export const AboutUsView: React.FC<AboutUsViewProps> = ({ onBackToApp, onOpenRules }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-fade-in text-slate-100">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0e1626] via-[#0b101c] to-[#080c14] border border-white/10 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-right">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/25 flex-shrink-0">
            <Dumbbell className="w-10 h-10 transform -rotate-12" />
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>نبذة عن المنصة</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-wide">
              Ode Gym <span className="text-emerald-400">AI</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              تطبيق ذكي يساعد لاعبي كمال الأجسام على تنظيم تدريباتهم، تسجيل أدائهم، متابعة تقدمهم، وإدارة التغذية بطريقة منظمة.
            </p>
          </div>
        </div>
      </div>

      {/* Developer & Creator Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2.5 border-b border-white/10 pb-3">
          <User className="w-5 h-5 text-emerald-400" />
          <span>المطور وفريق العمل</span>
        </h2>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-950/60 p-6 rounded-2xl border border-white/5">
          <div className="space-y-2 text-center sm:text-right">
            <div className="text-xs text-slate-400 font-medium">مطور ومنشئ المنصة</div>
            <div className="text-2xl font-black text-white flex items-center justify-center sm:justify-start gap-2">
              <span>Oday Qutqut</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-mono">
                Developer
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              تم بناء تطبيق Ode Gym AI بشغف رياضي وهندسي ليقدم للاعبي كمال الأجسام واللياقة تجربة ذكية موثوقة تعتمد على الأرقام الحقيقية وتلتزم بأعلى معايير الدقة والخصوصية.
            </p>
          </div>

          {/* Contact Actions */}
          <div className="flex flex-col gap-2.5 w-full sm:w-auto">
            <a
              href="mailto:oday5qutqut@gmail.com"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>تواصل معنا</span>
            </a>

            <div className="text-center sm:text-right text-[11px] text-slate-400">
              البريد المباشر:{' '}
              <a
                href="mailto:oday5qutqut@gmail.com"
                className="text-emerald-400 hover:underline font-mono"
              >
                oday5qutqut@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Core Principles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">الاعتماد على بياناتك فقط</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            لا يخترع التطبيق تمارين لم تلعبها أو أوزاناً لم ترفعها. كل تحليل وتطور يستند حصراً إلى أرقامك المدخلة والموثقة.
          </p>
        </div>

        <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">الذكاء التقديري الشفاف</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            عند تحليل صور الوجبات، يتم تنبيهك صراحة بأن القيم تقديرية ولا تغني عن الميزان، مع إمكانية تعديل كافة الأرقام يدوياً.
          </p>
        </div>

        <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">خصوصية صارمة عبر RLS</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            جميع بياناتك الشخصية وتمارينك محفوظة في قاعدة بيانات Supabase مع سياسات أمان Row Level Security تضمن عدم رؤية أي شخص لبياناتك سواك.
          </p>
        </div>
      </div>

      {/* Rules Constitution Link Card */}
      {onOpenRules && (
        <div className="glass-card rounded-3xl p-6 border border-emerald-500/20 bg-emerald-500/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">دستور الـ 20 قاعدة الصارمة</h4>
              <p className="text-xs text-slate-400">
                القواعد الهندسية والأخلاقية التي تحكم سلوك Ode Gym AI لضمان سلامتك وموثوقية معلوماتك.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenRules}
            className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-colors cursor-pointer self-stretch sm:self-auto"
          >
            استعراض الدستور
          </button>
        </div>
      )}
    </div>
  );
};
