import React, { useState } from 'react';
import { MealLogItem, MealAnalysisResponse, PlayerProfile } from '../types/gym';
import { Camera, Upload, Utensils, AlertTriangle, Sparkles, Check, Trash2, Plus, Flame, Beef, Wheat, Droplet, HelpCircle } from 'lucide-react';

interface MealAnalyzerViewProps {
  todayMeals: MealLogItem[];
  onAddMeal: (meal: MealLogItem) => void;
  onDeleteMeal: (mealId: string) => void;
  profile: PlayerProfile;
}

export const MealAnalyzerView: React.FC<MealAnalyzerViewProps> = ({
  todayMeals,
  onAddMeal,
  onDeleteMeal,
  profile,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [textDescription, setTextDescription] = useState<string>('');
  const [mealTimeType, setMealTimeType] = useState<MealLogItem['mealType']>('lunch');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<MealAnalysisResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editable values before saving
  const [editCalories, setEditCalories] = useState<number>(0);
  const [editProtein, setEditProtein] = useState<number>(0);
  const [editCarbs, setEditCarbs] = useState<number>(0);
  const [editFat, setEditFat] = useState<number>(0);
  const [editMealName, setEditMealName] = useState<string>('');

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

  const handleAnalyzeMeal = async () => {
    if (!selectedImage && !textDescription.trim()) {
      setErrorMsg('يرجى التقاط صورة للوجبة أو كتابة وصف لمكوناتها أولاً.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType: imageMime,
          textDescription,
          mealTime: mealTimeType,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'فشل التحليل الذكي للوجبة');
      }

      const data: MealAnalysisResponse = await response.json();
      setAnalysisResult(data);
      setEditMealName(data.meal_name || 'وجبة جديدة');
      setEditCalories(data.total_calories || 0);
      setEditProtein(data.total_protein_g || 0);
      setEditCarbs(data.total_carbs_g || 0);
      setEditFat(data.total_fat_g || 0);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'حدث خطأ أثناء فحص الوجبة.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToTodayMeals = () => {
    if (!editMealName.trim()) return;

    const newMeal: MealLogItem = {
      id: `meal-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      mealType: mealTimeType,
      name: editMealName,
      calories: Number(editCalories) || 0,
      proteinG: Number(editProtein) || 0,
      carbsG: Number(editCarbs) || 0,
      fatG: Number(editFat) || 0,
      isEstimated: !!selectedImage,
      needsReview: analysisResult?.needs_review,
      reviewReason: analysisResult?.review_reason || undefined,
      photoUrl: selectedImage || undefined,
      items: analysisResult?.items?.map((it) => ({
        name: it.name,
        estimatedPortion: it.estimated_portion,
        calories: it.calories,
        proteinG: it.protein_g,
        carbsG: it.carbs_g,
        fatG: it.fat_g,
      })),
    };

    onAddMeal(newMeal);
    // Reset form
    setSelectedImage(null);
    setTextDescription('');
    setAnalysisResult(null);
  };

  // Totals for today
  const totalCal = todayMeals.reduce((s, m) => s + m.calories, 0);
  const totalPro = todayMeals.reduce((s, m) => s + m.proteinG, 0);
  const totalCarb = todayMeals.reduce((s, m) => s + m.carbsG, 0);
  const totalFat = todayMeals.reduce((s, m) => s + m.fatG, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Strict Disclaimer */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Utensils className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-white">تحليل الوجبات والماكروز الذكي</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              حلل وجباتك بالصورة أو النص، واكتشف تقدير السعرات والبروتين والماكروز وفق القواعد الصارمة.
            </p>
          </div>
        </div>

        {/* Rules 7 & 8 Notice Box */}
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
          <div className="leading-relaxed">
            <span className="font-bold">القاعدتان 7 و 8:</span> أي قيمة غذائية ناتجة عن الصورة تعتبر{' '}
            <strong>تقديرية وليست قياساً دقيقاً</strong>. المحرك لا يدّعي معرفة وزن الطعام الدقيق بالجرام من الصورة وحدها، لذا ننصحك بتأكيد الكميات وتعديلها أدناه قبل الحفظ.
          </div>
        </div>
      </div>

      {/* Main Analyzer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Form Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>التقاط صورة للوجبة أو رفعها</span>
            </h3>

            {/* Image Preview / Drop zone */}
            <div className="relative border-2 border-dashed border-white/15 rounded-2xl overflow-hidden p-4 text-center hover:border-emerald-500/40 transition-colors bg-black/20">
              {selectedImage ? (
                <div className="relative group">
                  <img
                    src={selectedImage}
                    alt="صورة الوجبة"
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
                  <Upload className="w-8 h-8 text-slate-400 mb-2 group-hover:text-emerald-400 transition-colors" />
                  <span className="text-xs font-semibold text-slate-300">
                    اضغط هنا لرفع صورة الوجبة أو التقاطها
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1">
                    يدعم JPG, PNG, WEBP حتى 25 ميجابايت
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

            {/* Text description input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                وصف المكونات أو ملاحظات (اختياري لتحسين الدقة)
              </label>
              <textarea
                rows={2}
                placeholder="مثال: صدر دجاج 200 جم تقريباً، كوب رز بسمتي مسلوق بدون زيت..."
                value={textDescription}
                onChange={(e) => setTextDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Meal Time Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                توقيت الوجبة
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {[
                  { id: 'breakfast', label: 'فطور' },
                  { id: 'lunch', label: 'غداء' },
                  { id: 'dinner', label: 'عشاء' },
                  { id: 'snack', label: 'سناك' },
                  { id: 'pre_workout', label: 'قبل التمرين' },
                  { id: 'post_workout', label: 'بعد التمرين' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setMealTimeType(t.id as any)}
                    className={`py-1.5 rounded-lg border text-center transition-all ${
                      mealTimeType === t.id
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                        : 'bg-slate-900/60 text-slate-400 border-white/5 hover:bg-slate-800'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                {errorMsg}
              </p>
            )}

            {/* Action Button */}
            <button
              onClick={handleAnalyzeMeal}
              disabled={isAnalyzing}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isAnalyzing ? 'جاري التحليل والفحص الذكي...' : 'تحليل الوجبة والماكروز'}</span>
            </button>
          </div>
        </div>

        {/* Results & Verification Column (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {analysisResult ? (
            <div className="glass-card p-6 rounded-3xl border border-emerald-500/30 space-y-4 animate-fadeIn">
              {/* Needs Review Alert (Rule 3) */}
              {analysisResult.needs_review && (
                <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold mb-0.5">تنبيه مراجعة (needs_review=true - القاعدة 3):</strong>
                    {analysisResult.review_reason || 'الصورة أو المكونات تحتاج مراجعة يدوية للتأكد من الماكروز بدقة.'}
                  </div>
                </div>
              )}

              {/* Confidence Badge */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <span className="text-[10px] text-slate-400 block">اسم الوجبة المكتشف:</span>
                  <input
                    type="text"
                    value={editMealName}
                    onChange={(e) => setEditMealName(e.target.value)}
                    className="text-lg font-black text-white bg-transparent border-b border-dashed border-white/30 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div className="text-left font-mono">
                  <span className="text-[10px] text-slate-400 block">مستوى الثقة</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    analysisResult.confidence >= 80
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {analysisResult.confidence}%
                  </span>
                </div>
              </div>

              {/* Disclaimer Note from Response */}
              <p className="text-xs text-slate-400 italic bg-black/20 p-2.5 rounded-xl border border-white/5">
                {analysisResult.estimated_weight_note}
              </p>

              {/* Detected Items Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300">مكونات الوجبة التقديرية:</span>
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-900/80 text-slate-400">
                      <tr>
                        <th className="p-2">العنصر</th>
                        <th className="p-2">الكمية التقديرية</th>
                        <th className="p-2 text-center">سعرات</th>
                        <th className="p-2 text-center">بروتين</th>
                        <th className="p-2 text-center">كارب</th>
                        <th className="p-2 text-center">دهون</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {analysisResult.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02]">
                          <td className="p-2 font-semibold text-slate-200">{item.name}</td>
                          <td className="p-2 text-slate-400">{item.estimated_portion}</td>
                          <td className="p-2 text-center font-mono text-amber-400">
                            {item.calories !== null ? `${item.calories}` : 'null'}
                          </td>
                          <td className="p-2 text-center font-mono text-emerald-400">
                            {item.protein_g !== null ? `${item.protein_g}g` : 'null'}
                          </td>
                          <td className="p-2 text-center font-mono text-cyan-400">
                            {item.carbs_g !== null ? `${item.carbs_g}g` : 'null'}
                          </td>
                          <td className="p-2 text-center font-mono text-rose-400">
                            {item.fat_g !== null ? `${item.fat_g}g` : 'null'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Macro Adjustment Cards before saving */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] text-amber-300 block">السعرات</span>
                  <input
                    type="number"
                    value={editCalories}
                    onChange={(e) => setEditCalories(parseInt(e.target.value) || 0)}
                    className="w-full text-center text-sm font-mono font-bold text-white bg-transparent focus:outline-none"
                  />
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] text-emerald-300 block">بروتين (g)</span>
                  <input
                    type="number"
                    value={editProtein}
                    onChange={(e) => setEditProtein(parseInt(e.target.value) || 0)}
                    className="w-full text-center text-sm font-mono font-bold text-emerald-400 bg-transparent focus:outline-none"
                  />
                </div>
                <div className="bg-cyan-500/10 border border-cyan-500/20 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] text-cyan-300 block">كارب (g)</span>
                  <input
                    type="number"
                    value={editCarbs}
                    onChange={(e) => setEditCarbs(parseInt(e.target.value) || 0)}
                    className="w-full text-center text-sm font-mono font-bold text-cyan-400 bg-transparent focus:outline-none"
                  />
                </div>
                <div className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] text-rose-300 block">دهون (g)</span>
                  <input
                    type="number"
                    value={editFat}
                    onChange={(e) => setEditFat(parseInt(e.target.value) || 0)}
                    className="w-full text-center text-sm font-mono font-bold text-rose-400 bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              {/* Coach Nutrition Advice */}
              {analysisResult.advice_and_notes && (
                <p className="text-xs text-slate-300 bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-xl leading-relaxed">
                  💡 <strong>نصيحة Ode Gym الغذائية:</strong> {analysisResult.advice_and_notes}
                </p>
              )}

              {/* Save Button */}
              <button
                onClick={handleSaveToTodayMeals}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                <span>تأكيد وإضافة الوجبة لسجل اليوم</span>
              </button>
            </div>
          ) : (
            /* Today Meals Summary List */
            <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div>
                  <h3 className="text-base font-bold text-white">سجل وجبات اليوم ({todayMeals.length})</h3>
                  <p className="text-xs text-slate-400">إجمالي السعرات والماكروز المسجلة</p>
                </div>
                <div className="text-left font-mono">
                  <span className="text-xs text-emerald-400 font-bold">{totalPro}g بروتين</span>
                  <span className="text-xs text-slate-400 block">{totalCal} سعرة</span>
                </div>
              </div>

              {todayMeals.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  لا توجد وجبات مسجلة اليوم. قم برفع صورة أو إضافة وجبة لبدء التتبع!
                </div>
              ) : (
                <div className="space-y-3">
                  {todayMeals.map((meal) => (
                    <div
                      key={meal.id}
                      className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-white/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        {meal.photoUrl ? (
                          <img
                            src={meal.photoUrl}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover border border-white/10 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                            <Utensils className="w-5 h-5 text-emerald-400" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm">{meal.name}</h4>
                            {meal.isEstimated && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                                تقديري
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                            {meal.time} • {meal.mealType}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-white/5">
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="text-amber-400 font-bold">{meal.calories} kcal</span>
                          <span className="text-emerald-400 font-bold">{meal.proteinG}g P</span>
                          <span className="text-cyan-400">{meal.carbsG}g C</span>
                          <span className="text-rose-400">{meal.fatG}g F</span>
                        </div>
                        <button
                          onClick={() => onDeleteMeal(meal.id)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                          title="حذف الوجبة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
