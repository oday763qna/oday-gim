import React, { useState, useEffect } from 'react';
import { WorkoutPlan, WorkoutLogSession, LoggedExercise, LoggedSet } from '../types/gym';
import { Play, Check, Plus, Trash2, Timer, Flame, Award, Dumbbell, History, ChevronRight } from 'lucide-react';

interface WorkoutLoggerViewProps {
  plan: WorkoutPlan;
  workouts: WorkoutLogSession[];
  onSaveWorkout: (session: WorkoutLogSession) => void;
}

export const WorkoutLoggerView: React.FC<WorkoutLoggerViewProps> = ({
  plan,
  workouts,
  onSaveWorkout,
}) => {
  const [activeSession, setActiveSession] = useState<WorkoutLogSession | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');

  // Rest Timer State
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const startRestTimer = (seconds: number) => {
    setTimerSeconds(seconds);
    setIsTimerRunning(true);
  };

  // Start workout from plan
  const handleStartFromPlan = (dayId: string) => {
    const selectedDay = plan.days?.find((d) => d.id === dayId);
    if (!selectedDay) return;
    const initialExercises: LoggedExercise[] = selectedDay.exercises.map((ex) => ({
      exerciseId: ex.id,
      exerciseNameAr: ex.nameAr,
      exerciseNameEn: ex.nameEn,
      targetMuscle: ex.targetMuscle,
      sets: Array.from({ length: ex.sets }).map((_, idx) => ({
        setNumber: idx + 1,
        weightKg: 0,
        reps: 10,
        rpe: 8,
        completed: false,
      })),
    }));

    const newSession: WorkoutLogSession = {
      id: `session-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      dayPlanId: selectedDay.id,
      sessionTitle: selectedDay.dayName,
      durationMinutes: 45,
      exercises: initialExercises,
      totalVolumeKg: 0,
      notes: '',
    };

    setActiveSession(newSession);
    setActiveTab('current');
  };

  const handleStartFreeWorkout = () => {
    const newSession: WorkoutLogSession = {
      id: `session-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      sessionTitle: 'جلسة تدريب حرة',
      durationMinutes: 45,
      exercises: [],
      totalVolumeKg: 0,
      notes: '',
    };
    setActiveSession(newSession);
    setActiveTab('current');
  };

  const handleUpdateSet = (exIndex: number, setIndex: number, field: keyof LoggedSet, value: any) => {
    if (!activeSession) return;
    const updatedExercises = [...activeSession.exercises];
    const targetSet = { ...updatedExercises[exIndex].sets[setIndex], [field]: value };
    updatedExercises[exIndex].sets[setIndex] = targetSet;

    // Recalculate total volume for completed sets
    let volume = 0;
    updatedExercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        if (s.completed && s.weightKg > 0 && s.reps > 0) {
          volume += s.weightKg * s.reps;
        }
      });
    });

    setActiveSession({
      ...activeSession,
      exercises: updatedExercises,
      totalVolumeKg: volume,
    });
  };

  const handleAddSet = (exIndex: number) => {
    if (!activeSession) return;
    const updatedExercises = [...activeSession.exercises];
    const currentSets = updatedExercises[exIndex].sets;
    const lastSet = currentSets[currentSets.length - 1];

    currentSets.push({
      setNumber: currentSets.length + 1,
      weightKg: lastSet ? lastSet.weightKg : 0,
      reps: lastSet ? lastSet.reps : 10,
      rpe: 8,
      completed: false,
    });

    setActiveSession({
      ...activeSession,
      exercises: updatedExercises,
    });
  };

  const handleFinishWorkout = () => {
    if (!activeSession) return;
    onSaveWorkout(activeSession);
    setActiveSession(null);
    setActiveTab('history');
  };

  // One Rep Max formula (Brzycki)
  const calc1RM = (weight: number, reps: number) => {
    if (reps <= 1) return weight;
    if (reps > 20) return weight * 1.5;
    return Math.round(weight * (36 / (37 - reps)));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Tab Switcher & Timer Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('current')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'current'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-4 h-4 text-emerald-400" />
            <span>الجلسة الحالية</span>
            {activeSession && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>سجل التمارين ({workouts.length})</span>
          </button>
        </div>

        {/* Live Rest Timer Widget */}
        <div className="flex items-center gap-3 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
          <Timer className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-slate-400">مؤقت الراحة:</span>
          <span className="text-sm font-mono font-bold text-cyan-300 min-w-10 text-center">
            {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => startRestTimer(60)}
              className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300 hover:text-white"
            >
              60ث
            </button>
            <button
              onClick={() => startRestTimer(90)}
              className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300 hover:text-white"
            >
              90ث
            </button>
            <button
              onClick={() => startRestTimer(120)}
              className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300 hover:text-white"
            >
              120ث
            </button>
            {isTimerRunning && (
              <button
                onClick={() => setIsTimerRunning(false)}
                className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[11px]"
              >
                إيقاف
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Workout Session Mode */}
      {activeTab === 'current' && (
        <>
          {!activeSession ? (
            <div className="glass-card p-8 rounded-3xl border border-white/10 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                <Dumbbell className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-xl font-bold text-white">ابدأ جلسة تمرين جديدة</h3>
                <p className="text-xs text-slate-400 mt-1">
                  اختر أحد أيام خطتك المعتمدة لتسجيل الأوزان والتكرارات وحساب الحجم التدريبي الإجمالي لحظياً.
                </p>
              </div>

              {!plan.days || plan.days.length === 0 ? (
                <div className="space-y-4 max-w-md mx-auto">
                  <p className="text-xs text-slate-400">
                    لم تقم بإعداد أيام في خطتك بعد. يمكنك بدء جلسة تمرين حرة الآن وتسجيل تمارينك ومجموعاتك مباشرة:
                  </p>
                  <button
                    onClick={handleStartFreeWorkout}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>بدء جلسة تمرين حرة</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto pt-2">
                    {plan.days.map((day) => (
                      <button
                        key={day.id}
                        onClick={() => handleStartFromPlan(day.id)}
                        className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 hover:border-emerald-500/40 hover:bg-slate-800/80 transition-all text-right group"
                      >
                        <div className="text-xs text-emerald-400 font-semibold mb-1">
                          {day.dayName.split(':')[0]}
                        </div>
                        <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                          {day.dayName.split(':')[1] || day.dayName}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-2 font-mono">
                          {day.exercises.length} تمارين
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleStartFreeWorkout}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-white/10 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>أو بدء جلسة تدريب حرة (خارج الخطة)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Session Header Info */}
              <div className="glass-panel p-5 rounded-3xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-emerald-400">جلسة مباشرة جارية</span>
                  <h2 className="text-xl font-black text-white mt-0.5">{activeSession.sessionTitle}</h2>
                  <div className="text-xs text-slate-400 mt-1 font-mono">
                    التاريخ: {activeSession.date} • التمارين: {activeSession.exercises.length}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-black/40 px-4 py-2 rounded-2xl border border-white/10 text-right">
                    <span className="text-[10px] text-slate-400 block">الحجم التدريبي (Volume)</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">
                      {activeSession.totalVolumeKg.toLocaleString()} كجم
                    </span>
                  </div>

                  <button
                    onClick={handleFinishWorkout}
                    className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-950/50"
                  >
                    <Check className="w-5 h-5" />
                    <span>إنهاء وحفظ الجلسة</span>
                  </button>
                </div>
              </div>

              {/* Exercises in Session */}
              <div className="space-y-4">
                {activeSession.exercises.map((ex, exIdx) => (
                  <div key={ex.exerciseId} className="glass-card p-5 rounded-2xl border border-white/10 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <div>
                        <h4 className="font-bold text-white text-base">{ex.exerciseNameAr}</h4>
                        {ex.exerciseNameEn && (
                          <span className="text-xs text-slate-400 font-mono" dir="ltr">
                            ({ex.exerciseNameEn})
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10">
                        {ex.targetMuscle}
                      </span>
                    </div>

                    {/* Sets Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="text-slate-400 border-b border-white/5 pb-2">
                            <th className="py-2 px-2 text-center w-12">مجموعة</th>
                            <th className="py-2 px-2 text-center">الوزن (كجم)</th>
                            <th className="py-2 px-2 text-center">التكرارات</th>
                            <th className="py-2 px-2 text-center w-20">جهد (RPE)</th>
                            <th className="py-2 px-2 text-center">تقدير 1RM</th>
                            <th className="py-2 px-2 text-center w-20">إتمام</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {ex.sets.map((set, setIdx) => {
                            const est1RM = set.weightKg > 0 && set.reps > 0 ? calc1RM(set.weightKg, set.reps) : null;
                            return (
                              <tr
                                key={setIdx}
                                className={`transition-colors ${set.completed ? 'bg-emerald-500/5' : ''}`}
                              >
                                <td className="py-2 px-2 text-center font-mono font-bold text-slate-300">
                                  {set.setNumber}
                                </td>
                                <td className="py-2 px-2 text-center">
                                  <input
                                    type="number"
                                    step="0.5"
                                    value={set.weightKg === 0 ? '' : set.weightKg}
                                    placeholder="0"
                                    onChange={(e) =>
                                      handleUpdateSet(exIdx, setIdx, 'weightKg', parseFloat(e.target.value) || 0)
                                    }
                                    className="w-20 px-2 py-1 rounded-lg bg-slate-900 border border-white/10 text-white font-mono text-center font-bold"
                                  />
                                </td>
                                <td className="py-2 px-2 text-center">
                                  <input
                                    type="number"
                                    value={set.reps === 0 ? '' : set.reps}
                                    placeholder="0"
                                    onChange={(e) =>
                                      handleUpdateSet(exIdx, setIdx, 'reps', parseInt(e.target.value) || 0)
                                    }
                                    className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-white/10 text-white font-mono text-center font-bold"
                                  />
                                </td>
                                <td className="py-2 px-2 text-center">
                                  <select
                                    value={set.rpe || 8}
                                    onChange={(e) =>
                                      handleUpdateSet(exIdx, setIdx, 'rpe', parseFloat(e.target.value))
                                    }
                                    className="px-2 py-1 rounded-lg bg-slate-900 border border-white/10 text-slate-300 text-xs text-center font-mono"
                                  >
                                    <option value="6">6 (سهل)</option>
                                    <option value="7">7 (3 متبقية)</option>
                                    <option value="8">8 (2 متبقية)</option>
                                    <option value="8.5">8.5</option>
                                    <option value="9">9 (1 متبقية)</option>
                                    <option value="10">10 (أقصى جهد)</option>
                                  </select>
                                </td>
                                <td className="py-2 px-2 text-center font-mono text-slate-400">
                                  {est1RM ? `${est1RM} كجم` : '-'}
                                </td>
                                <td className="py-2 px-2 text-center">
                                  <button
                                    onClick={() => {
                                      handleUpdateSet(exIdx, setIdx, 'completed', !set.completed);
                                      if (!set.completed) startRestTimer(90);
                                    }}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all ${
                                      set.completed
                                        ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                                        : 'bg-slate-800 text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button
                        onClick={() => handleAddSet(exIdx)}
                        className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة مجموعة إضافية</span>
                      </button>
                      <button
                        onClick={() => startRestTimer(90)}
                        className="text-xs text-cyan-400 hover:text-cyan-300"
                      >
                        بدء راحة 90 ثانية ⏱️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* History Log Mode */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-base font-bold text-white">الجلسات المسجلة سابقاً ({workouts.length})</h3>
            <span className="text-xs text-slate-400">
              تُستخدم بيانات هذه الجلسات فقط للتحليل التلقائي بدون اختراع
            </span>
          </div>

          {workouts.length === 0 ? (
            <div className="glass-card p-8 rounded-2xl text-center text-slate-400">
              لم تسجل أي جلسات بعد. ابدأ جلسة جديدة أعلاه!
            </div>
          ) : (
            <div className="space-y-3">
              {workouts.map((w) => (
                <div key={w.id} className="glass-card p-5 rounded-2xl border border-white/5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white">{w.sessionTitle}</h4>
                        <span className="text-xs font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10">
                          {w.totalVolumeKg.toLocaleString()} كجم حجم كلي
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        التاريخ: {w.date} • المدة: {w.durationMinutes} دقيقة
                      </div>
                    </div>
                  </div>

                  {w.notes && (
                    <p className="text-xs text-slate-300 bg-black/20 p-2.5 rounded-xl border border-white/5">
                      💬 ملاحظات اللاعب: {w.notes}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2 border-t border-white/5">
                    {w.exercises.map((ex, idx) => (
                      <div key={idx} className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5 text-xs">
                        <div className="font-semibold text-slate-200">{ex.exerciseNameAr}</div>
                        <div className="text-[11px] text-slate-400 mt-1 font-mono">
                          {ex.sets.map((s) => `${s.weightKg}k×${s.reps}`).join(' | ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
