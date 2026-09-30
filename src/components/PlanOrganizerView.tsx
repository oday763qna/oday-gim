import React, { useState } from 'react';
import { WorkoutPlan, WorkoutDayPlan, ExercisePlanItem, PlanProposal, PlayerProfile } from '../types/gym';
import { Plus, Sparkles, Check, X, Dumbbell, Clock, Layers, ChevronDown, ChevronUp, AlertCircle, Info, FileText } from 'lucide-react';
import { WorkoutPlanParserModal } from './WorkoutPlanParserModal';

interface PlanOrganizerViewProps {
  plan: WorkoutPlan;
  onUpdatePlan: (newPlan: WorkoutPlan) => void;
  proposals: PlanProposal[];
  onUpdateProposal: (id: string, status: 'approved' | 'rejected') => void;
  profile: PlayerProfile;
  onRequestAiAdvice: () => void;
}

export const PlanOrganizerView: React.FC<PlanOrganizerViewProps> = ({
  plan,
  onUpdatePlan,
  proposals,
  onUpdateProposal,
  profile,
  onRequestAiAdvice,
}) => {
  const [activeDayId, setActiveDayId] = useState<string>(plan.days[0]?.id || '');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showParserModal, setShowParserModal] = useState<boolean>(false);
  const [isAiSuggesting, setIsAiSuggesting] = useState<boolean>(false);
  const [aiCustomPrompt, setAiCustomPrompt] = useState<string>('');
  const [aiFeedbackMessage, setAiFeedbackMessage] = useState<string | null>(null);

  // New Exercise Form State
  const [newExercise, setNewExercise] = useState<Partial<ExercisePlanItem>>({
    nameAr: '',
    nameEn: '',
    targetMuscle: 'الصدر',
    sets: 3,
    targetReps: '8 - 12',
    restSecs: 90,
    equipmentType: 'dumbbell',
    notes: '',
  });

  const activeDay = plan.days.find((d) => d.id === activeDayId) || plan.days[0];
  const pendingProposals = proposals.filter((p) => p.status === 'pending');

  const handleAddExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExercise.nameAr?.trim() || !activeDay) return;

    const createdExercise: ExercisePlanItem = {
      id: `ex-${Date.now()}`,
      nameAr: newExercise.nameAr.trim(),
      nameEn: newExercise.nameEn?.trim() || '',
      targetMuscle: newExercise.targetMuscle || 'عضلة رئيسية',
      sets: Number(newExercise.sets) || 3,
      targetReps: newExercise.targetReps || '8 - 12',
      restSecs: Number(newExercise.restSecs) || 90,
      equipmentType: (newExercise.equipmentType as any) || 'dumbbell',
      notes: newExercise.notes?.trim() || '',
    };

    const updatedDays = plan.days.map((d) => {
      if (d.id === activeDay.id) {
        return {
          ...d,
          exercises: [...d.exercises, createdExercise],
        };
      }
      return d;
    });

    onUpdatePlan({
      ...plan,
      days: updatedDays,
      lastUpdated: new Date().toISOString().split('T')[0],
    });

    setShowAddModal(false);
    setNewExercise({
      nameAr: '',
      nameEn: '',
      targetMuscle: 'الصدر',
      sets: 3,
      targetReps: '8 - 12',
      restSecs: 90,
      equipmentType: 'dumbbell',
      notes: '',
    });
  };

  const handleDeleteExercise = (dayId: string, exId: string) => {
    const updatedDays = plan.days.map((d) => {
      if (d.id === dayId) {
        return {
          ...d,
          exercises: d.exercises.filter((ex) => ex.id !== exId),
        };
      }
      return d;
    });

    onUpdatePlan({
      ...plan,
      days: updatedDays,
      lastUpdated: new Date().toISOString().split('T')[0],
    });
  };

  const handleAddNewDay = () => {
    const dayNumber = (plan.days?.length || 0) + 1;
    const newDay: WorkoutDayPlan = {
      id: `day-${Date.now()}`,
      dayName: `اليوم ${dayNumber}: تمرين جديد`,
      focusMuscles: ['عضلات رئيسية'],
      exercises: [],
    };
    const updatedPlan = {
      ...plan,
      title: plan.title || 'خطتي التدريبية',
      days: [...(plan.days || []), newDay],
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    onUpdatePlan(updatedPlan);
    setActiveDayId(newDay.id);
  };

  // AI Proposal generation strictly respecting Rule 11 & 12
  const handleRequestSmartSuggestion = async () => {
    setIsAiSuggesting(true);
    setAiFeedbackMessage(null);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `اقترح عليّ تحسيناً أو تعديلاً لخطة تمريني الحالية: "${plan.title}" لليوم: "${activeDay?.dayName}". ${
                aiCustomPrompt ? `ملاحظة إضافية مني: ${aiCustomPrompt}` : ''
              }. تذكر: لا تغير الخطة تلقائياً بل صغ اقتراحاً واضحاً يحتاج موافقتي الصريحة، واستخدم أسماء واضحة بالعربية مع الإنجليزية بين قوسين.`,
            },
          ],
          playerDataContext: {
            currentPlan: plan,
            profile,
          },
        }),
      });

      const data = await response.json();
      if (data.reply) {
        setAiFeedbackMessage(data.reply);
      }
    } catch (err: any) {
      setAiFeedbackMessage('تعذر جلب الاقتراح حالياً، تحقق من الاتصال.');
    } finally {
      setIsAiSuggesting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                {profile.splitType}
              </span>
              <span className="text-xs text-slate-400">
                آخر تحديث: {plan.lastUpdated}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white">{plan.title}</h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">{plan.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowParserModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-sm font-semibold border border-emerald-500/30 hover:border-emerald-500/60 transition-all shadow-sm"
              title="تحليل واستيراد خطة من نص أو صورة أو ملف PDF"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>استيراد خطة (نص / صورة / PDF)</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold border border-white/10 transition-all"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>إضافة تمرين</span>
            </button>
            <button
              onClick={handleRequestSmartSuggestion}
              disabled={isAiSuggesting}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isAiSuggesting ? 'جاري التحليل...' : 'اقتراح ذكي من Ode Gym'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pending Proposals Card (Strictly Enforcing Rules 11 & 12) */}
      {pendingProposals.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>اقتراحات معلقة تتطلب موافقة اللاعب (القاعدة 11 و 12):</span>
          </div>
          <div className="space-y-3">
            {pendingProposals.map((prop) => (
              <div
                key={prop.id}
                className="bg-slate-900/80 border border-amber-500/20 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <h4 className="font-bold text-white text-sm">{prop.title}</h4>
                  <p className="text-xs text-slate-300 mt-1">{prop.description}</p>
                  <p className="text-[11px] text-amber-300/80 mt-1">السبب: {prop.reasoning}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateProposal(prop.id, 'approved')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>موافق واعتماد</span>
                  </button>
                  <button
                    onClick={() => onUpdateProposal(prop.id, 'rejected')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-all"
                  >
                    <X className="w-4 h-4" />
                    <span>رفض الاقتراح</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Suggestion Feedback Box if just queried */}
      {aiFeedbackMessage && (
        <div className="glass-card p-5 rounded-2xl border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
              <Sparkles className="w-4 h-4" />
              <span>اقتراح Ode Gym AI التدريبي (يحتاج موافقتك لاعتماده):</span>
            </div>
            <button
              onClick={() => setAiFeedbackMessage(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line bg-black/30 p-4 rounded-xl border border-white/5">
            {aiFeedbackMessage}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => {
                alert('تنبيه: يمكنك إضافة التمرين أو تعديل الجلسات مباشرة في جدولك أدناه بعد مراجعتها.');
                setAiFeedbackMessage(null);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl"
            >
              مفهوم، سأقوم بالتعديل يدوياً
            </button>
          </div>
        </div>
      )}

      {(!plan.days || plan.days.length === 0) ? (
        <div className="glass-panel p-10 sm:p-14 rounded-3xl border border-white/10 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
            <Dumbbell className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white">لم يتم إضافة أي خطة تدريبية بعد</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              ابدأ الآن ببناء جدولك الخاص. يمكنك استيراد خطتك المكتوبة أو ملف PDF بواسطة الذكاء الاصطناعي، أو إضافة الأيام التدريبية بنفسك.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setShowParserModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>استيراد خطة ذكية (نص / PDF / صورة)</span>
            </button>
            <button
              onClick={handleAddNewDay}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-white/10 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>إضافة يوم تدريبي جديد</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Days Tabs */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 border-b border-white/10">
            <div className="flex gap-2">
              {plan.days.map((day) => (
                <button
                  key={day.id}
                  onClick={() => setActiveDayId(day.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border ${
                    activeDay?.id === day.id
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-950/40'
                      : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 border-white/5'
                  }`}
                >
                  {day.dayName.split(':')[0]}
                </button>
              ))}
            </div>

            <button
              onClick={handleAddNewDay}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 text-xs font-bold border border-white/10 transition-all whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة يوم</span>
            </button>
          </div>
        </>
      )}

      {/* Active Day Detail */}
      {activeDay && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#121824] p-4 rounded-2xl border border-white/5">
            <div>
              <h3 className="text-lg font-bold text-white">{activeDay.dayName}</h3>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {activeDay.focusMuscles.map((m, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] border border-white/5"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-mono">
                {activeDay.exercises.length} تمارين مبرمجة
              </span>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة تمرين لهذا اليوم</span>
              </button>
            </div>
          </div>

          {/* Exercise Cards */}
          {activeDay.exercises.length === 0 ? (
            <div className="glass-card p-8 rounded-2xl border border-white/5 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
                <Dumbbell className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-400">
                لا توجد تمارين مضافة في هذا اليوم حتى الآن.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة أول تمرين</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeDay.exercises.map((ex, index) => (
                <div
                  key={ex.id}
                  className="glass-card p-5 rounded-2xl border border-white/5 hover:border-white/15 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono flex items-center justify-center flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-white text-base leading-snug">
                            {ex.nameAr}
                          </h4>
                          {ex.nameEn && (
                            <p className="text-xs text-slate-400 font-mono mt-0.5" dir="ltr">
                              ({ex.nameEn})
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteExercise(activeDay.id, ex.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="حذف التمرين"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/5">
                      <div className="bg-black/30 p-2 rounded-xl text-center">
                        <span className="text-[10px] text-slate-400 block">المجموعات</span>
                        <span className="text-sm font-bold text-emerald-400 font-mono">{ex.sets}</span>
                      </div>
                      <div className="bg-black/30 p-2 rounded-xl text-center">
                        <span className="text-[10px] text-slate-400 block">التكرارات</span>
                        <span className="text-sm font-bold text-white font-mono">{ex.targetReps}</span>
                      </div>
                      <div className="bg-black/30 p-2 rounded-xl text-center">
                        <span className="text-[10px] text-slate-400 block">الراحة</span>
                        <span className="text-sm font-bold text-cyan-400 font-mono">{ex.restSecs}ث</span>
                      </div>
                    </div>

                    {ex.notes && (
                      <p className="text-xs text-slate-400 mt-3 bg-white/[0.02] p-2.5 rounded-xl border border-white/5 flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{ex.notes}</span>
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-white/5">
                    <span>العضلة: {ex.targetMuscle}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {ex.equipmentType === 'barbell' && 'باربل حر'}
                      {ex.equipmentType === 'dumbbell' && 'دمبلز'}
                      {ex.equipmentType === 'cable' && 'كابلات'}
                      {ex.equipmentType === 'machine' && 'جهاز ميكانيكي'}
                      {ex.equipmentType === 'bodyweight' && 'وزن الجسم'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Exercise Modal */}
      {showAddModal && activeDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0e1320] border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                إضافة تمرين إلى: {activeDay.dayName.split(':')[0]}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExercise} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  اسم التمرين بالعربية (واضح ومفهوم) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ضغط أكتاف بالدمبلز جالساً"
                  value={newExercise.nameAr}
                  onChange={(e) => setNewExercise({ ...newExercise, nameAr: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  الاسم بالإنجليزية (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="Seated Dumbbell Shoulder Press"
                  value={newExercise.nameEn}
                  onChange={(e) => setNewExercise({ ...newExercise, nameEn: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 text-left"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    العضلة المستهدفة
                  </label>
                  <input
                    type="text"
                    value={newExercise.targetMuscle}
                    onChange={(e) => setNewExercise({ ...newExercise, targetMuscle: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    نوع الأداة
                  </label>
                  <select
                    value={newExercise.equipmentType}
                    onChange={(e) => setNewExercise({ ...newExercise, equipmentType: e.target.value as any })}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="barbell">باربل (Barbell)</option>
                    <option value="dumbbell">دمبلز (Dumbbell)</option>
                    <option value="machine">جهاز ميكانيكي (Machine)</option>
                    <option value="cable">كابل (Cable)</option>
                    <option value="bodyweight">وزن الجسم (Bodyweight)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    المجموعات
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newExercise.sets}
                    onChange={(e) => setNewExercise({ ...newExercise, sets: parseInt(e.target.value) || 3 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-sm text-center font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    التكرارات
                  </label>
                  <input
                    type="text"
                    placeholder="8 - 10"
                    value={newExercise.targetReps}
                    onChange={(e) => setNewExercise({ ...newExercise, targetReps: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-sm text-center font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    الراحة (ثانية)
                  </label>
                  <input
                    type="number"
                    step="15"
                    value={newExercise.restSecs}
                    onChange={(e) => setNewExercise({ ...newExercise, restSecs: parseInt(e.target.value) || 60 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-sm text-center font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ملاحظات الأداء والتكنيك
                </label>
                <textarea
                  rows={2}
                  placeholder="مثال: الحفاظ على الظهر ملتصقاً بالمسند وثني الركبتين بخفة..."
                  value={newExercise.notes}
                  onChange={(e) => setNewExercise({ ...newExercise, notes: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-950/50"
                >
                  حفظ التمرين في الخطة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Import Workout Plan Parser Modal */}
      <WorkoutPlanParserModal
        isOpen={showParserModal}
        onClose={() => setShowParserModal(false)}
        onImportPlan={onUpdatePlan}
      />
    </div>
  );
};
