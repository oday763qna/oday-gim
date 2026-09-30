import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Dumbbell, Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';

interface AuthViewProps {
  onAuthSuccess: (user: any) => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot_password';

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setPassword('');
    setConfirmPassword('');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
        }
        if (error.message.includes('Email not confirmed')) {
          throw new Error('يرجى تأكيد بريدك الإلكتروني أولاً عبر الرابط المرسل إليك.');
        }
        throw new Error(error.message);
      }

      if (data?.user) {
        onAuthSuccess(data.user);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('يرجى إدخال اسمك.');
      return;
    }
    if (!email.trim() || !password) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('يجب أن تتكون كلمة المرور من 6 خانات على الأقل.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('كلمتا المرور غير متطابقتين.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          throw new Error('هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.');
        }
        throw new Error(error.message);
      }

      if (data?.user) {
        // Create initial profile in profiles table with auth.uid()
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            updated_at: new Date().toISOString(),
          });
        } catch (profileErr) {
          console.error('Error creating profile record:', profileErr);
        }

        // If session was returned immediately (email confirmation disabled or auto-confirmed)
        if (data.session) {
          setSuccessMessage('تم إنشاء الحساب بنجاح! جاري تحويلك...');
          setTimeout(() => {
            onAuthSuccess(data.user);
          }, 800);
        } else {
          setSuccessMessage(
            'تم إنشاء الحساب بنجاح! تم إرسال رابط تأكيد إلى بريدك الإلكتروني، يرجى تفقده ثم تسجيل الدخول.'
          );
          setMode('signin');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('يرجى كتابة بريدك الإلكتروني لإرسال رابط الاستعادة.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/`,
      });

      if (error) throw error;
      setSuccessMessage('تم إرسال تعليمات إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح.');
    } catch (err: any) {
      setErrorMessage(err.message || 'تعذر إرسال رابط الاستعادة.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-center items-center p-4 py-12 relative overflow-hidden font-['Cairo',sans-serif]">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* App Logo & Branding */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-xl shadow-emerald-500/25">
            <Dumbbell className="w-8 h-8 transform -rotate-12" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              Ode Gym <span className="text-emerald-400">AI</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              المساعد الذكي الرسمي لكمال الأجسام واللياقة
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#0f1422]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header depending on mode */}
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-white">
              {mode === 'signin' && 'تسجيل الدخول'}
              {mode === 'signup' && 'إنشاء حساب جديد'}
              {mode === 'forgot_password' && 'استعادة كلمة المرور'}
            </h2>
            <p className="text-xs text-slate-400">
              {mode === 'signin' && 'أهلاً بك مجدداً! أدخل بيانات حسابك للمتابعة'}
              {mode === 'signup' && 'ابدأ رحلتك التدريبية مع حماية كاملة لبياناتك'}
              {mode === 'forgot_password' && 'أدخل بريدك الإلكتروني لاستلام رابط تعيين كلمة المرور'}
            </p>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Sign In Form */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    dir="ltr"
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    كلمة المرور
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setMode('forgot_password');
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-400">ليس لديك حساب بعد؟ </span>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setMode('signup');
                  }}
                  className="text-xs font-bold text-emerald-400 hover:underline cursor-pointer"
                >
                  إنشاء حساب جديد
                </button>
              </div>
            </form>
          )}

          {/* Sign Up Form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  الاسم الكامل
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="كابتن أحمد"
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    dir="ltr"
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  كلمة المرور (6 خانات على الأقل)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  تأكيد كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-400">لديك حساب بالفعل؟ </span>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setMode('signin');
                  }}
                  className="text-xs font-bold text-emerald-400 hover:underline cursor-pointer"
                >
                  تسجيل الدخول
                </button>
              </div>
            </form>
          )}

          {/* Forgot Password Form */}
          {mode === 'forgot_password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    dir="ltr"
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-xl text-sm border border-emerald-500/30 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setMode('signin');
                  }}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  العودة إلى تسجيل الدخول
                </button>
              </div>
            </form>
          )}

          {/* Privacy & RLS Guarantee */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>بياناتك محمية تماماً بسياسات Supabase Row Level Security (RLS)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
