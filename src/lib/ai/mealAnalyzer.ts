import { Type } from '@google/genai';
import { geminiClient, ODE_GYM_SYSTEM_PROMPT } from '../gemini';

export interface AnalyzeMealParams {
  imageBase64?: string;
  mimeType?: string;
  textDescription?: string;
  mealTime?: string;
}

export async function analyzeMealAI(params: AnalyzeMealParams) {
  const { imageBase64, mimeType, textDescription, mealTime } = params;

  if (!imageBase64 && !textDescription) {
    return {
      analysis_status: 'needs_review',
      meal_name: '',
      items: [],
      total: {
        calories: null,
        protein_g: null,
        carbs_g: null,
        fat_g: null,
      },
      warnings: [
        'لم يتم إرفاق صورة أو وصف للوجبة في هذا الطلب. يرجى تزويد صورة الوجبة أو إدخال وصفها لتقدير المكونات والماكروز وفق القواعد الصارمة.',
      ],
    };
  }

  const parts: any[] = [];
  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: imageBase64.replace(/^data:[^;]+;base64,/, ''),
      },
    });
  }

  const promptText = `
أنت محلل الوجبات في Ode Gym AI.
حلل هذه الوجبة بدقة وفقاً للقواعد الصارمة:
1. أي قيمة غذائية للصورة تعتبر تقديرية وليست قياساً دقيقاً (القاعدة 7).
2. لا تدّعي معرفة وزن الطعام بالجرام من الصورة وحدها إذا لم يذكر المستخدم وزناً دقيقاً (القاعدة 8).
3. استخدم estimated=true لجميع القيم المستنتجة بصرياً.
4. إذا لم تستطع تحديد طعام بدقة، استخدم null وضع needs_review في analysis_status.
5. إذا كان هناك أكثر من احتمال، اذكر البدائل ومستوى الثقة.
6. لا تضف مكونات مخفية غير ظاهرة إلا إذا ذكرها المستخدم.
7. لا تعتبر الصورة بديلاً عن القياس الغذائي الدقيق.
8. أرجع JSON فقط.

وصف الوجبة إن وجد: "${textDescription || 'لم يُقدّم وصف نصي'}"
وقت الوجبة: "${mealTime || 'غير محدد'}"
`;

  parts.push({ text: promptText });

  const response = await geminiClient.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: { parts },
    config: {
      systemInstruction: ODE_GYM_SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analysis_status: { type: Type.STRING, description: 'success | needs_review' },
          meal_name: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                food_name_ar: { type: Type.STRING },
                food_name_en: { type: Type.STRING },
                estimated_quantity: { type: Type.STRING },
                unit: { type: Type.STRING },
                calories: { type: Type.NUMBER },
                protein_g: { type: Type.NUMBER },
                carbs_g: { type: Type.NUMBER },
                fat_g: { type: Type.NUMBER },
                estimated: { type: Type.BOOLEAN },
                confidence: { type: Type.NUMBER },
              },
              required: ['food_name_ar', 'estimated', 'confidence'],
            },
          },
          total: {
            type: Type.OBJECT,
            properties: {
              calories: { type: Type.NUMBER },
              protein_g: { type: Type.NUMBER },
              carbs_g: { type: Type.NUMBER },
              fat_g: { type: Type.NUMBER },
            },
            required: ['calories', 'protein_g', 'carbs_g', 'fat_g'],
          },
          warnings: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['analysis_status', 'meal_name', 'items', 'total', 'warnings'],
      },
    },
  });

  return JSON.parse(response.text?.trim() || '{}');
}
