import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Maximize2
} from 'lucide-react';
import { ParsedWorkoutPlanResponse, WorkoutPlan, WorkoutDayPlan, ExercisePlanItem } from '../types/gym';

interface WorkoutPlanParserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportPlan: (newPlan: WorkoutPlan) => void;
}

export const WorkoutPlanParserModal: React.FC<WorkoutPlanParserModalProps> = ({
  isOpen,
  onClose,
  onImportPlan,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [parseResult, setParseResult] = useState<ParsedWorkoutPlanResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showJsonRaw, setShowJsonRaw] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedFile({
        base64: event.target?.result as string,
        mimeType: file.type || 'image/jpeg',
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!inputText.trim() && !selectedFile) {
      setErrorMessage('يرجى كتابة نص الخطة أو رفع صورة / ملف PDF أولاً.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/parse-workout-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText.trim(),
          fileBase64: selectedFile?.base64,
          mimeType: selectedFile?.mimeType,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'فشل تحليل الخطة');
      }

      const data: ParsedWorkoutPlanResponse = await res.json();
      setParseResult(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء الاتصال بالمحرك الذكي');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToPlan = () => {
    if (!parseResult || !parseResult.workout_plan) return;

    // Convert parsed days to application's WorkoutPlan format
    const convertedDays: WorkoutDayPlan[] = parseResult.workout_plan.days.map((day, dIdx) => ({
      id: `imported-day-${Date.now()}-${dIdx}`,
      dayName: day.day_name || `يوم تدريبي ${dIdx + 1}`,
      focusMuscles: day.muscles && day.muscles.length > 0 ? day.muscles : ['عضلات مستهدفة'],
      exercises: (day.exercises || []).map((ex, eIdx) => ({
        id: `imported-ex-${Date.now()}-${dIdx}-${eIdx}`,
        nameAr: ex.name_ar,
        nameEn: ex.name_en || undefined,
        targetMuscle: (day.muscles && day.muscles[0]) || 'عضلة رئيسية',
        sets: ex.sets || 3,
        targetReps: ex.reps ? String(ex.reps) : '8 - 12',
        restSecs: ex.rest_seconds || 90,
        equipmentType: ex.machine_name ? 'machine' : 'barbell',
        notes: [
          ex.notes,
          ex.weight ? `الوزن المقترح: ${ex.weight} ${ex.weight_unit || 'كجم'}` : null,
          ex.rpe ? `RPE: ${ex.rpe}` : null,
          ex.rir ? `RIR: ${ex.rir}` : null,
          ex.machine_name ? `اسم الجهاز: ${ex.machine_name}` : null,
          ex.machine_number ? `رقم الآلة: ${ex.machine_number}` : null,
        ].filter(Boolean).join(' | '),
      })),
    }));

    const newWorkoutPlan: WorkoutPlan = {
      id: `imported-plan-${Date.now()}`,
      title: parseResult.workout_plan.name || 'الخطة المستوردة عبر Ode Gym AI',
      description: 'خطة مستخرجة آلياً عبر Ode Gym AI وفق القواعد الصارمة ودون أي اختراع للمعلومات.',
      days: convertedDays,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    onImportPlan(newWorkoutPlan);
    onClose();
  };

  const copyToClipboard = () => {
    if (!parseResult) return;
    navigator.clipboard.writeText(JSON.stringify(parseResult, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl my-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">محلل ومستورد خطة التمرين (OCR / PDF / نص)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                استخراج دقيق للمعلومات الموجودة فقط وفق قواعد Ode Gym AI الصارمة (بدون اختراع).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* File Upload Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/15 hover:border-emerald-500/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-950/70"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            {selectedFile ? (
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-white truncate max-w-[220px]">{selectedFile.name}</p>
                <p className="text-[11px] text-emerald-400">تم اختيار الملف بنجاح، اضغط لتغييره</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-200">
                  ارفع صورة جدول التمارين، لوحة النادي، أو ملف PDF
                </p>
                <p className="text-[11px] text-slate-500">يدعم PNG, JPG, WebP, PDF</p>
              </div>
            )}
          </div>

          {/* Text Area Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              أو الصق نص الخطة المكتوبة هنا:
            </label>
            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="مثال:
اليوم الأول: صدر وبايسبس
1. بنش برس بالبار (Barbell Bench Press) 4 مجموعات في 8-10 تكرارات وزن 80 كجم راحة 90 ثانية.
2. تفتيح بالدمبلز 3 في 12... إلخ"
              className="w-full h-[135px] px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-white/10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans resize-none"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>مطابق لقواعد عدم الاختراع الصارمة (Null إذا كانت المعلومة غير موجودة).</span>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isLoading || (!inputText.trim() && !selectedFile)}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isLoading ? 'جاري الاستخراج الصارم...' : 'تحليل واستخراج الخطة (JSON)'}</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-300 text-xs">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Parsed Result Display */}
        {parseResult && (
          <div className="space-y-4 pt-4 border-t border-white/10 animate-fade-in">
            {/* Summary Header & Score */}
            <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl border ${parseResult.needs_review ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                  {parseResult.needs_review ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {parseResult.workout_plan.name || 'خطة تمرين مستخرجة'}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-xs">
                    <span className="text-slate-400">
                      نسبة الثقة: <strong className="text-emerald-400 font-mono">{(parseResult.confidence * 100).toFixed(0)}%</strong>
                    </span>
                    <span className="text-slate-400">
                      مراجعة بشرية مطلوبة:{' '}
                      <strong className={parseResult.needs_review ? 'text-amber-400' : 'text-emerald-400'}>
                        {parseResult.needs_review ? 'نعم (needs_review=true)' : 'لا (واضحة)'}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowJsonRaw(!showJsonRaw)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-white/10 transition-all flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{showJsonRaw ? 'عرض الواجهة' : 'عرض JSON الخام'}</span>
                </button>
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-white/10 transition-all flex items-center gap-1.5"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedJson ? 'تم النسخ' : 'نسخ JSON'}</span>
                </button>
              </div>
            </div>

            {/* Warnings Alert */}
            {parseResult.warnings && parseResult.warnings.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>تنبيهات وتوضيحات الاستخراج:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300 pr-2">
                  {parseResult.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Raw JSON View */}
            {showJsonRaw ? (
              <pre className="p-4 rounded-2xl bg-black/90 border border-emerald-500/20 text-emerald-400 font-mono text-xs overflow-x-auto max-h-96 leading-relaxed text-left direction-ltr">
                {JSON.stringify(parseResult, null, 2)}
              </pre>
            ) : (
              /* Structured Days & Exercises Visualizer */
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                {parseResult.workout_plan.days.map((day, dIdx) => (
                  <div key={dIdx} className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center font-mono">
                          {dIdx + 1}
                        </span>
                        <h5 className="font-bold text-white text-sm">{day.day_name}</h5>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {day.muscles.map((m, mIdx) => (
                          <span key={mIdx} className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-300">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {day.exercises.map((ex, eIdx) => (
                        <div
                          key={eIdx}
                          className="bg-slate-900/80 border border-white/5 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 font-mono font-bold">#{ex.order}</span>
                              <span className="font-bold text-white text-sm">{ex.name_ar}</span>
                              {ex.name_en && (
                                <span className="text-[11px] text-slate-400 font-mono">({ex.name_en})</span>
                              )}
                              {ex.needs_review && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold">
                                  يحتاج مراجعة
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-slate-300 text-[11px]">
                              <span>المجموعات: <strong className="text-white">{ex.sets !== null ? ex.sets : 'null'}</strong></span>
                              <span>التكرارات: <strong className="text-white">{ex.reps !== null ? ex.reps : 'null'}</strong></span>
                              <span>الوزن: <strong className="text-emerald-400">{ex.weight !== null ? `${ex.weight} ${ex.weight_unit || ''}` : 'null'}</strong></span>
                              <span>الراحة: <strong className="text-slate-200">{ex.rest_seconds !== null ? `${ex.rest_seconds}ث` : 'null'}</strong></span>
                              {ex.rpe !== null && <span>RPE: <strong className="text-cyan-400">{ex.rpe}</strong></span>}
                              {ex.rir !== null && <span>RIR: <strong className="text-cyan-400">{ex.rir}</strong></span>}
                            </div>
                            {(ex.machine_name || ex.machine_number || ex.notes) && (
                              <p className="text-[11px] text-slate-400 pt-0.5">
                                {ex.machine_name && <span>الجهاز: {ex.machine_name} </span>}
                                {ex.machine_number && <span className="text-amber-300">(رقم: {ex.machine_number}) </span>}
                                {ex.notes && <span>— ملاحظات: {ex.notes}</span>}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 self-end md:self-center">
                            <span className="text-[10px] font-mono text-slate-500">
                              دقة: {(ex.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Approval / Apply Button (Strictly respecting Rule 11 & 12) */}
            <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-amber-300/90">
                * لن يتم تغيير خطتك الحالية إلا بعد ضغطك على زر الاعتماد أدناه.
              </p>
              <button
                onClick={handleApplyToPlan}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>موافق: اعتماد واستيراد هذه الخطة لجدولي</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
