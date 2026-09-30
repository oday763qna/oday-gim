import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Database,
  Cpu,
  Lock,
  RefreshCw,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Server,
  KeyRound
} from 'lucide-react';
import { isSupabaseConfigured, testSupabaseConnection } from '../lib/supabase';

interface SystemStatus {
  supabase: {
    configured: boolean;
    hasUrl: boolean;
    hasAnonKey: boolean;
  };
  gemini: {
    configured: boolean;
  };
  database: {
    configured: boolean;
  };
  authentication: {
    ready: boolean;
  };
}

export const AdminSetupView: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus>({
    supabase: { configured: isSupabaseConfigured, hasUrl: false, hasAnonKey: false },
    gemini: { configured: false },
    database: { configured: false },
    authentication: { ready: false },
  });
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);

  // Gemini Test state
  const [geminiTesting, setGeminiTesting] = useState(false);
  const [geminiResult, setGeminiResult] = useState<any | null>(null);

  // Supabase Test state
  const [supabaseTesting, setSupabaseTesting] = useState(false);
  const [supabaseResult, setSupabaseResult] = useState<any | null>(null);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/system/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch system status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleTestGemini = async () => {
    setGeminiTesting(true);
    setGeminiResult(null);
    try {
      const res = await fetch('/api/test/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setGeminiResult(data);
      if (data.success) {
        setStatus((prev) => ({ ...prev, gemini: { configured: true } }));
      }
    } catch (err: any) {
      setGeminiResult({
        success: false,
        service: 'gemini',
        error: err.message || 'حدث خطأ في الاتصال بالخادم',
      });
    } finally {
      setGeminiTesting(false);
    }
  };

  const handleTestSupabase = async () => {
    setSupabaseTesting(true);
    setSupabaseResult(null);
    try {
      // Test server-side endpoint
      const res = await fetch('/api/test/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setSupabaseResult(data);
      if (data.success) {
        setStatus((prev) => ({
          ...prev,
          supabase: { configured: true, hasUrl: true, hasAnonKey: true },
          database: { configured: true },
          authentication: { ready: true },
        }));
      }
    } catch (err: any) {
      setSupabaseResult({
        success: false,
        service: 'supabase',
        error: err.message || 'فشل الاتصال بقاعدة البيانات',
      });
    } finally {
      setSupabaseTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-6 animate-fade-in">
      {/* Title & Header */}
      <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>لوحة تحكم إعدادات النظام للمطور</span>
          </div>
          <h1 className="text-3xl font-black text-white">Ode | إعداد النظام</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            مراقبة حالة الاتصال بقاعدة بيانات Supabase ومحرك Google Gemini API دون كشف المفاتيح السرية.
          </p>
        </div>

        <button
          onClick={fetchStatus}
          disabled={loadingStatus}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-white/10 transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? 'animate-spin' : ''}`} />
          <span>تحديث الحالة</span>
        </button>
      </div>

      {/* Main Connection Status Board (Exact specifications requested) */}
      <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/10 space-y-6">
        <h2 className="text-lg font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
          <Server className="w-5 h-5 text-emerald-400" />
          <span>حالة الاتصال بالخدمات</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-mono text-sm">
          {/* Supabase Status */}
          <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white font-sans">Supabase</span>
              <Database className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              {status.supabase.configured ? (
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>● متصل</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full border border-slate-500" />
                  <span>○ غير مضبوط</span>
                </div>
              )}
            </div>
          </div>

          {/* Gemini AI Status */}
          <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white font-sans">Gemini AI</span>
              <Cpu className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              {status.gemini.configured ? (
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>● متصل</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full border border-slate-500" />
                  <span>○ غير مضبوط</span>
                </div>
              )}
            </div>
          </div>

          {/* Database Status */}
          <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white font-sans">Database</span>
              <Database className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              {status.database.configured ? (
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>● متصل</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full border border-slate-500" />
                  <span>○ غير مضبوط</span>
                </div>
              )}
            </div>
          </div>

          {/* Authentication Status */}
          <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white font-sans">Authentication</span>
              <Lock className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              {status.authentication.ready ? (
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>● جاهز</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full border border-slate-500" />
                  <span>○ غير مضبوط</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 text-xs text-emerald-300">
          <KeyRound className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span>
            <strong>حماية المفاتيح:</strong> لا يتم عرض أي مفاتيح API أو قيم سرية داخل هذه الصفحة أو شفرة المتصفح مطلقاً وفقاً لمعايير الأمان الصارمة.
          </span>
        </div>
      </div>

      {/* Connection Testing Lab */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gemini API Test */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Cpu className="w-5 h-5 text-amber-400" />
              <span>اختبار اتصال Google Gemini</span>
            </div>
            <button
              onClick={handleTestGemini}
              disabled={geminiTesting}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{geminiTesting ? 'جاري الفحص...' : 'تشغيل الاختبار'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            يرسل طلباً مباشراً من السيرفر للتأكد من استجابة المحرك للرسالة:
            <code className="text-emerald-400 bg-black/40 px-1 py-0.5 rounded mx-1">مرحباً، أنت تعمل داخل Ode Gym AI. أجب بكلمة: OK</code>
          </p>

          {geminiResult && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-xs">
                {geminiResult.success ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> نجح الاتصال بمحرك Gemini
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-400 font-bold">
                    <XCircle className="w-4 h-4" /> فشل الاتصال بمحرك Gemini
                  </span>
                )}
              </div>
              <pre className="p-3 rounded-xl bg-black/80 border border-white/10 text-xs font-mono text-slate-300 overflow-x-auto text-left direction-ltr">
                {JSON.stringify(geminiResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Supabase Connection Test */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Database className="w-5 h-5 text-emerald-400" />
              <span>اختبار اتصال Supabase</span>
            </div>
            <button
              onClick={handleTestSupabase}
              disabled={supabaseTesting}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-bold border border-emerald-500/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{supabaseTesting ? 'جاري الفحص...' : 'تشغيل الاختبار'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            يتحقق من استجابة خادم Supabase وقراءة جدول <code className="text-white bg-black/40 px-1 py-0.5 rounded mx-1">profiles</code> مع احترام صلاحيات RLS.
          </p>

          {supabaseResult && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-xs">
                {supabaseResult.success ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> نجح الاتصال بقاعدة بيانات Supabase
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-400 font-bold">
                    <XCircle className="w-4 h-4" /> فشل الاتصال بقاعدة بيانات Supabase
                  </span>
                )}
              </div>
              <pre className="p-3 rounded-xl bg-black/80 border border-white/10 text-xs font-mono text-slate-300 overflow-x-auto text-left direction-ltr">
                {JSON.stringify(supabaseResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
