import React, { useState } from 'react';
import { MachineAnalysisResponse } from '../types/gym';
import { Dumbbell, Camera, Upload, AlertCircle, Sparkles, CheckCircle2, ShieldAlert, Layers, HelpCircle } from 'lucide-react';

export const MachineExerciseGuideView: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [queryText, setQueryText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<MachineAnalysisResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageMime(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async (presetText?: string) => {
    const textToQuery = presetText !== undefined ? presetText : queryText;
    if (!selectedImage && !textToQuery.trim()) {
      setErrorMsg('يرجى رفع صورة للجهاز أو التمرين، أو كتابة اسم تمرين للبحث.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const response = await fetch('/api/analyze-machine-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType: imageMime,
          query: textToQuery,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'فشل تحليل الجهاز أو التمرين');
      }

      const data: MachineAnalysisResponse = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'حدث خطأ أثناء فحص الجهاز.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Dumbbell className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-white">فهم التمارين وأجهزة الجيم</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              التعرف على أجهزة الصالة والتكنيك الميكانيكي الصحيح وفق قواعد عدم الاختراع والدقة الصارمة.
            </p>
          </div>
        </div>

        {/* Rules 4, 5, 6 Banner */}
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-cyan-400" />
          <div className="leading-relaxed">
            <span className="font-bold">القواعد 4 و 5 و 6:</span> لا يتم اختراع رقم آلة أو موديل إن لم يكن مطبوعاً ومؤكداً. إذا كان التمرين غير مؤكد يعود بـ needs_review، ويتم إرجاع الاحتمالات البديلة مع درجات الثقة.
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image / Text Input (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>التقاط صورة للآلة أو رفعها</span>
            </h3>

            {/* Upload Box */}
            <div className="relative border-2 border-dashed border-white/15 rounded-2xl overflow-hidden p-4 text-center hover:border-emerald-500/40 transition-colors bg-black/20">
              {selectedImage ? (
                <div className="relative">
                  <img
                    src={selectedImage}
                    alt="صورة الآلة"
                    className="w-full h-48 object-cover rounded-xl"
                  />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-2 left-2 p-1.5 bg-black/70 hover:bg-rose-600 text-white rounded-lg text-xs transition-colors"
                  >
                    حذف الصورة
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-44 cursor-pointer">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-xs font-semibold text-slate-300">
                    اضغط هنا لرفع صورة جهاز أو تمرين
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1">
                    يدعم أجهزة الكابلات، الأوزان الحرة، والأجهزة الميكانيكية
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Text Search */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                أو اكتب اسم التمرين / الجهاز للاستفسار
              </label>
              <input
                type="text"
                placeholder="مثال: كيف أضبط دكة السحب الأرضي؟ أو تمرين التراي بالحبل"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              يمكنك تصوير أي جهاز داخل الجيم أو كتابة اسم أي تمرين لفهم التكنيك الميكانيكي والعضلات المستهدفة مباشرة.
            </p>

            {errorMsg && (
              <p className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                {errorMsg}
              </p>
            )}

            <button
              onClick={() => handleAnalyze()}
              disabled={isAnalyzing}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isAnalyzing ? 'جاري فحص الجهاز والتكنيك...' : 'التعرف على الجهاز وشرح التكنيك'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Guide Results (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {result ? (
            <div className="glass-card p-6 rounded-3xl border border-emerald-500/30 space-y-5 animate-fadeIn">
              {/* Needs Review Alert (Rule 3) */}
              {result.needs_review && (
                <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold mb-0.5">تنبيه مراجعة (القاعدة 3):</strong>
                    {result.review_reason || 'الصورة أو الاستفسار يحتوي على نسبة عدم تأكد.'}
                  </div>
                </div>
              )}

              {/* Title & Machine Spec */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-xl font-black text-white">{result.identified_name_ar}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-emerald-400 font-mono">
                      العضلة الأساسية: {result.target_muscle}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-xs text-slate-400">
                      {result.is_machine ? 'جهاز ميكانيكي / كابل' : 'وزن حر'}
                    </span>
                  </div>
                </div>

                <div className="text-left font-mono">
                  <span className="text-[10px] text-slate-400 block">رقم الآلة (القاعدة 4)</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10">
                    {result.machine_model_or_number ? result.machine_model_or_number : 'null (غير مطبوع)'}
                  </span>
                </div>
              </div>

              {/* Alternative Possibilities if ambiguous (Rule 6) */}
              {result.alternative_possibilities && result.alternative_possibilities.length > 0 && (
                <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                    <HelpCircle className="w-4 h-4" />
                    <span>احتمالات بديلة مع مستوى الثقة (القاعدة 6):</span>
                  </div>
                  <div className="space-y-1.5">
                    {result.alternative_possibilities.map((alt, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-slate-300 p-2 rounded-lg bg-black/20">
                        <span>{alt.name_ar}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">{alt.note}</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                            {alt.confidence}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Machine Setup / Adjustments */}
              {result.machine_adjustments && result.machine_adjustments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    <span>ضبط الجهاز والمقعد قبل البدء (Machine Setup):</span>
                  </h4>
                  <ul className="space-y-1.5">
                    {result.machine_adjustments.map((step, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
                        <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 font-mono">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Step-by-Step Biomechanics Execution */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>خطوات الأداء الحركي الصحيح (Execution Cues):</span>
                </h4>
                <ul className="space-y-1.5">
                  {result.execution_steps.map((step, idx) => (
                    <li key={idx} className="text-xs text-slate-200 flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                      <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-mono font-bold">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Common Mistakes & Safety */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>أخطاء شائعة لتفادي الإصابة:</span>
                </h4>
                <ul className="space-y-1.5">
                  {result.common_mistakes.map((mistake, idx) => (
                    <li key={idx} className="text-xs text-rose-200/90 flex items-start gap-2 bg-rose-500/5 p-2.5 rounded-xl border border-rose-500/15">
                      <span className="text-rose-400 flex-shrink-0 mt-0.5">⚠️</span>
                      <span>{mistake}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Secondary Muscles */}
              {result.secondary_muscles && result.secondary_muscles.length > 0 && (
                <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">العضلات المساعدة:</span>
                  <div className="flex flex-wrap gap-1">
                    {result.secondary_muscles.map((m, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card p-12 rounded-3xl border border-white/10 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                <Dumbbell className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-bold text-white">دليل الأجهزة والحركة الذكي</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  التقط صورة لأي جهاز في الجيم غير متأكد من طريقة ضبطه، أو اختر أحد الأمثلة السريعة لعرض الشرح الحركي وتفادي الإصابات.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
