import React, { useState } from 'react';
import { WorkoutLogSession, BodyweightEntry, PlayerProfile, PlanProposal } from '../types/gym';
import { TrendingUp, Scale, Sparkles, Check, AlertTriangle, ArrowUpRight, Flame, BarChart2, Plus, Calendar } from 'lucide-react';

interface ProgressAnalyticsViewProps {
  workouts: WorkoutLogSession[];
  weights: BodyweightEntry[];
  profile: PlayerProfile;
  onAddWeight: (entry: BodyweightEntry) => void;
  onApproveProposal: (proposal: PlanProposal) => void;
}

export const ProgressAnalyticsView: React.FC<ProgressAnalyticsViewProps> = ({
  workouts,
  weights,
  profile,
  onAddWeight,
  onApproveProposal,
}) => {
  const [newWeightVal, setNewWeightVal] = useState<string>('');
  const [newWeightNote, setNewWeightNote] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newWeightVal);
    if (!val || val < 30 || val > 300) return;

    onAddWeight({
      id: `bw-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      weightKg: val,
      note: newWeightNote.trim() || undefined,
    });

    setNewWeightVal('');
    setNewWeightNote('');
  };

  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/analyze-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workouts,
          bodyweights: weights,
          profile,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'فشل تحليل التقدم');
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'حدث خطأ أثناء فحص البيانات.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Min and max for weight chart
  const sortedWeights = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const rawWeights = sortedWeights.map((w) => w.weightKg);
  if (profile.currentWeightKg > 0) rawWeights.push(profile.currentWeightKg);
  if (profile.targetWeightKg > 0) rawWeights.push(profile.targetWeightKg);
  const minWeight = rawWeights.length > 0 ? Math.min(...rawWeights) - 1 : 50;
  const maxWeight = rawWeights.length > 0 ? Math.max(...rawWeights) + 1 : 100;
  const weightRange = maxWeight - minWeight || 1;

  // Recent volume data
  const volumePoints = workouts.slice(-6).map((w) => ({
    title: w.sessionTitle.replace('جلسة ', ''),
    volume: w.totalVolumeKg,
    date: w.date.split('-').slice(1).join('/'),
  }));
  const maxVolume = Math.max(...volumePoints.map((v) => v.volume), 1000);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-white">تحليل تطور الأداء والوزن</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              متابعة الزيادة التدريجية للحمل التدريبي (Progressive Overload) ومسار الوزن، استناداً حصراً لبياناتك المسجلة.
            </p>
          </div>

          <button
            onClick={handleRunAiAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isAnalyzing ? 'جاري فحص وتدقيق البيانات...' : 'تحليل التطور بواسطة Ode Gym AI'}</span>
          </button>
        </div>
      </div>

      {/* AI Analysis Result (Rules 1 & 14 Compliant) */}
      {analysisResult && (
        <div className="glass-card p-6 rounded-3xl border border-emerald-500/40 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Sparkles className="w-5 h-5" />
              <span>تقرير Ode Gym AI المعتمد حصراً على أرقامك المدخلة (القاعدتان 1 و 14)</span>
            </div>
            {analysisResult.needs_review && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                مراجعة مطلوبة
              </span>
            )}
          </div>

          <p className="text-sm text-slate-200 leading-relaxed bg-black/20 p-4 rounded-2xl border border-white/5 font-semibold">
            {analysisResult.summary_statement}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 space-y-2">
              <h4 className="text-xs font-bold text-cyan-400">📊 تحليل الحجم التدريبي الإجمالي:</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{analysisResult.volume_trend}</p>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 space-y-2">
              <h4 className="text-xs font-bold text-amber-400">⚖️ تحليل مسار وزن الجسم:</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{analysisResult.weight_trend_analysis}</p>
            </div>
          </div>

          {/* Strength highlights */}
          {analysisResult.strength_highlights && analysisResult.strength_highlights.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-emerald-400">💪 أبرز نقاط التطور في القوة المسجلة:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {analysisResult.strength_highlights.map((item: string, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proposals Requiring Approval (Rule 11 & 12) */}
          {analysisResult.proposals_requiring_player_approval &&
            analysisResult.proposals_requiring_player_approval.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <AlertTriangle className="w-4 h-4" />
                  <span>اقتراحات تدريبية تحتاج موافقتك الصريحة لتطبيقها:</span>
                </div>
                <div className="space-y-2">
                  {analysisResult.proposals_requiring_player_approval.map((prop: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-slate-900/90 p-3.5 rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-white text-sm">{prop.title}</div>
                        <p className="text-slate-300 mt-0.5">{prop.description}</p>
                        <p className="text-slate-400 text-[11px] mt-0.5">السبب: {prop.reasoning}</p>
                      </div>
                      <button
                        onClick={() =>
                          onApproveProposal({
                            id: `prop-${Date.now()}-${idx}`,
                            title: prop.title,
                            description: prop.description,
                            reasoning: prop.reasoning,
                            type: 'modify_sets',
                            status: 'approved',
                            createdAt: new Date().toISOString().split('T')[0],
                          })
                        }
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center gap-1.5 self-start sm:self-center"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>اعتماد الاقتراح</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bodyweight Trend Chart */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-400" />
                <span>سجل وزن الجسم (آخر 30 يوماً)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                الوزن الحالي: {sortedWeights[sortedWeights.length - 1]?.weightKg || profile.currentWeightKg || 'لم يسجل'} كجم • الهدف: {profile.targetWeightKg || 'غير محدد'} كجم
              </p>
            </div>

            {sortedWeights.length > 1 && (
              <span className="text-xs font-mono text-emerald-400 px-2 py-1 rounded bg-emerald-500/10">
                {((sortedWeights[sortedWeights.length - 1].weightKg - sortedWeights[0].weightKg) >= 0 ? '+' : '')}
                {(sortedWeights[sortedWeights.length - 1].weightKg - sortedWeights[0].weightKg).toFixed(1)} كجم
              </span>
            )}
          </div>

          {/* SVG Line / Dot Chart */}
          <div className="h-44 w-full bg-black/30 rounded-2xl p-4 border border-white/5 relative flex flex-col justify-end">
            {sortedWeights.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 text-center px-4">
                لا توجد قياسات وزن مسجلة بعد. استخدم نموذج التسجيل أدناه لإضافة قياسك الأول!
              </div>
            ) : (
              <>
                <svg className="w-full h-full overflow-visible" viewBox="0 0 400 120">
                  {/* Target weight line */}
                  {profile.targetWeightKg > 0 && (() => {
                    const targetY = 120 - ((profile.targetWeightKg - minWeight) / weightRange) * 100;
                    return (
                      <line
                        x1="0"
                        y1={targetY}
                        x2="400"
                        y2={targetY}
                        stroke="#10b981"
                        strokeDasharray="4 4"
                        strokeWidth="1.5"
                        opacity="0.4"
                      />
                    );
                  })()}

                  {/* Data points and line */}
                  {sortedWeights.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={sortedWeights
                        .map((pt, idx) => {
                          const x = (idx / (sortedWeights.length - 1)) * 380 + 10;
                          const y = 120 - ((pt.weightKg - minWeight) / weightRange) * 90 - 10;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />
                  )}

                  {sortedWeights.map((pt, idx) => {
                    const x = (idx / Math.max(1, sortedWeights.length - 1)) * 380 + 10;
                    const y = 120 - ((pt.weightKg - minWeight) / weightRange) * 90 - 10;
                    return (
                      <g key={pt.id}>
                        <circle cx={x} cy={y} r="5" fill="#090b10" stroke="#06b6d4" strokeWidth="2.5" />
                        <text
                          x={x}
                          y={y - 10}
                          fill="#94a3b8"
                          fontSize="9"
                          fontFamily="JetBrains Mono"
                          textAnchor="middle"
                        >
                          {pt.weightKg}k
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-2 border-t border-white/5">
                  <span>{sortedWeights[0]?.date || 'البداية'}</span>
                  {profile.targetWeightKg > 0 && (
                    <span className="text-emerald-400">خط الهدف: {profile.targetWeightKg} كجم</span>
                  )}
                  <span>{sortedWeights[sortedWeights.length - 1]?.date || 'اليوم'}</span>
                </div>
              </>
            )}
          </div>

          {/* Quick Log Form */}
          <form onSubmit={handleLogWeight} className="flex gap-2 pt-2 border-t border-white/5">
            <input
              type="number"
              step="0.1"
              placeholder="الوزن (كجم)"
              value={newWeightVal}
              onChange={(e) => setNewWeightVal(e.target.value)}
              className="w-28 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-mono font-bold text-center"
            />
            <input
              type="text"
              placeholder="ملاحظة (مثال: صيام، بعد تمرين...)"
              value={newWeightNote}
              onChange={(e) => setNewWeightNote(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل</span>
            </button>
          </form>
        </div>

        {/* Workout Volume Trend Chart */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                <span>الحجم التدريبي للجلسات الأخيرة (Total Volume)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                مجموع (الأوزان × التكرارات) لكل جلسة
              </p>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="h-44 w-full bg-black/30 rounded-2xl p-4 border border-white/5 flex items-end gap-3 justify-around">
            {volumePoints.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-slate-500 text-center px-4">
                لا توجد جلسات تدريب مسجلة بعد. سجل أول جلسة في تبويب "تسجيل الأداء" لعرض المنحنى البياني!
              </div>
            ) : (
              volumePoints.map((vp, idx) => {
                const heightPct = Math.max(15, Math.round((vp.volume / maxVolume) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] font-mono text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(vp.volume / 1000).toFixed(1)}k
                    </span>
                    <div
                      className="w-full max-w-[36px] bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-lg transition-all hover:brightness-125"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] text-slate-400 truncate max-w-[48px] text-center font-mono">
                      {vp.date}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="text-xs text-slate-400 p-3 rounded-xl bg-white/[0.02] border border-white/5 leading-relaxed">
            💡 <strong>مؤشر القوة:</strong> الزيادة التدريجية للحجم التدريبي مع الحفاظ على الأداء الحركي السليم هي الضامن الأكبر للبناء العضلي بدون انتكاسات.
          </div>
        </div>
      </div>
    </div>
  );
};
