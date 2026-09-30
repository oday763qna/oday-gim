import { Type } from '@google/genai';
import { geminiClient, ODE_GYM_SYSTEM_PROMPT } from '../gemini';

export interface AnalyzeProgressParams {
  workouts?: any[];
  bodyweights?: any[];
  nutritionLogs?: any[];
  profile?: any;
}

export async function analyzeProgressAI(params: AnalyzeProgressParams) {
  const { workouts, bodyweights, nutritionLogs, profile } = params;

  const hasData = (workouts && workouts.length > 0) || (bodyweights && bodyweights.length > 0);

  if (!hasData) {
    return {
      summary: 'لم يتم إرفاق أي بيانات تقدم أو سجلات تمارين أو قياسات وزن أو وجبات في هذا الطلب.',
      observations: [
        'حقيقة: لا توجد سجلات وزن مدخلة لحساب تغير وزن الجسم.',
        'حقيقة: لا توجد جلسات تمرين مدخلة لحساب تغير الأوزان أو التكرارات أو معدل الالتزام.',
        'حقيقة: لا توجد سجلات تغذية مدخلة لحساب متوسط السعرات الحرارية أو البروتين اليومي.',
      ],
      performance_trends: [],
      nutrition_trends: [],
      optional_suggestions: [
        {
          suggestion: 'تسجيل جلسات التمرين والأوزان وقياسات الوزن اليومية/الأسبوعية داخل التطبيق',
          reason: 'لتمكين المحرك الذكي من استخراج حقائق رقمية ورصد الاتجاهات التدريبية بدقة متناهية ودون أي اختراع للبيانات',
          is_optional: true,
          requires_player_approval: true,
        },
      ],
      data_limitations: [
        'غياب البيانات المدخلة يمنع تحليل الاتجاهات الزمنية أو التطور الرياضي.',
        'التزاماً بقواعد Ode Gym AI الصارمة، لن يتم تخمين أي أرقام أو افتراض أي علاقات سببية غير مثبتة بالأرقام المسجلة.',
      ],
    };
  }

  const promptText = `
حلل بيانات تقدم اللاعب المرفقة.
حلل فقط البيانات الموجودة.
ابحث عن:
* تغير الوزن.
* تغير أداء التمارين.
* تغير الأوزان.
* تغير التكرارات.
* الالتزام بالتمارين.
* متوسط السعرات.
* متوسط البروتين.
* الاتجاهات الزمنية.

افصل دائماً بين:
* حقيقة موجودة في البيانات.
* ملاحظة أو اتجاه.
* اقتراح اختياري.

لا تدّعي وجود علاقة سببية إذا لم تثبتها البيانات.
لا تغير خطة اللاعب تلقائياً.
إذا قدمت اقتراحاً، اشرح سبب الاقتراح واجعله اختيارياً.

بيانات التمارين:
${JSON.stringify(workouts || [], null, 2)}

بيانات قياسات الوزن:
${JSON.stringify(bodyweights || [], null, 2)}

بيانات الوجبات:
${JSON.stringify(nutritionLogs || [], null, 2)}

ملف وأهداف اللاعب:
${JSON.stringify(profile || {}, null, 2)}
`;

  const response = await geminiClient.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: promptText,
    config: {
      systemInstruction: ODE_GYM_SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          observations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          performance_trends: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          nutrition_trends: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          optional_suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                suggestion: { type: Type.STRING },
                reason: { type: Type.STRING },
                is_optional: { type: Type.BOOLEAN },
                requires_player_approval: { type: Type.BOOLEAN },
              },
              required: ['suggestion', 'reason', 'is_optional', 'requires_player_approval'],
            },
          },
          data_limitations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: [
          'summary',
          'observations',
          'performance_trends',
          'nutrition_trends',
          'optional_suggestions',
          'data_limitations',
        ],
      },
    },
  });

  return JSON.parse(response.text?.trim() || '{}');
}
