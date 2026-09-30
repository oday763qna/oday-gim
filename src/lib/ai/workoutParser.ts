import { Type } from '@google/genai';
import { geminiClient, ODE_GYM_SYSTEM_PROMPT } from '../gemini';
import { ParsedWorkoutPlanResponse } from '../../types/gym';

export interface ParseWorkoutPlanParams {
  text?: string;
  fileBase64?: string;
  mimeType?: string;
}

export async function parseWorkoutPlanAI(params: ParseWorkoutPlanParams): Promise<ParsedWorkoutPlanResponse> {
  const { text, fileBase64, mimeType } = params;

  if (!text && !fileBase64) {
    return {
      needs_review: true,
      confidence: 0.0,
      workout_plan: {
        name: null,
        days: [],
      },
      warnings: [
        'لم يتم تزويد أي نص أو صورة أو ملف لتحليله. يرجى إرفاق خطة التمرين ليتم استخراج البيانات بدقة وبدون أي اختراع.',
      ],
    };
  }

  const parts: any[] = [];
  if (fileBase64) {
    parts.push({
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: fileBase64.replace(/^data:[^;]+;base64,/, ''),
      },
    });
  }

  const parsePrompt = `
أنت المحلل الذكي لخطة التمرين في Ode Gym AI.
حلل خطة التمرين المرفقة بالنص أو الصورة أو PDF.
استخرج المعلومات الموجودة فقط.

لكل يوم تمرين استخرج:
* اسم اليوم (day_name).
* العضلات المستهدفة إذا كانت مذكورة (muscles).
* ترتيب التمارين (order).
* اسم التمرين بالعربية (name_ar).
* الاسم الإنجليزي إن كان واضحاً (name_en).
* عدد المجموعات (sets) كرقم أو null.
* عدد التكرارات (reps) كنص/رقم (مثال: "8-12" أو "10") أو null.
* الوزن المستهدف إذا كان موجوداً (weight) كرقم أو null.
* وحدة الوزن إذا كانت موجودة (weight_unit) مثل "kg" أو "lbs" أو null.
* مدة الراحة بالثواني إذا كانت موجودة (rest_seconds) أو null.
* RPE إذا كان موجوداً (rpe) كرقم أو null.
* RIR إذا كان موجوداً (rir) كرقم أو null.
* ملاحظات المدرب أو الخطة (notes) أو null.
* اسم الجهاز إذا كان مذكوراً صراحة (machine_name) أو null.
* رقم الجهاز إذا كان موجوداً صراحة (machine_number) أو null.

قواعد مهمة وصارمة:
* لا تخترع الوزن أبداً.
* لا تخترع عدد المجموعات.
* لا تخترع التكرارات.
* لا تخترع رقم الجهاز.
* لا تفترض أن تمريناً معيناً يحتاج جهازاً معيناً.
* إذا لم توجد معلومة استخدم null.
* إذا كان اسم التمرين غير واضح، ضع needs_review=true.
* ضع confidence بين 0 و 1.
* إذا كانت الصورة غير واضحة، لا تحاول ملء الفراغات بالتخمين.
* أرجع النتيجة JSON حصراً.

النص المرفق إن وجد:
${text || 'لا يوجد نص مرافق، الاعتماد على الملف المرفق'}
`;

  parts.push({ text: parsePrompt });

  const response = await geminiClient.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: { parts },
    config: {
      systemInstruction: ODE_GYM_SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          needs_review: { type: Type.BOOLEAN },
          confidence: { type: Type.NUMBER },
          workout_plan: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              days: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    day_name: { type: Type.STRING },
                    muscles: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    exercises: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          order: { type: Type.INTEGER },
                          name_ar: { type: Type.STRING },
                          name_en: { type: Type.STRING },
                          sets: { type: Type.INTEGER },
                          reps: { type: Type.STRING },
                          weight: { type: Type.NUMBER },
                          weight_unit: { type: Type.STRING },
                          rest_seconds: { type: Type.INTEGER },
                          rpe: { type: Type.NUMBER },
                          rir: { type: Type.INTEGER },
                          machine_name: { type: Type.STRING },
                          machine_number: { type: Type.STRING },
                          notes: { type: Type.STRING },
                          confidence: { type: Type.NUMBER },
                          needs_review: { type: Type.BOOLEAN },
                        },
                        required: ['order', 'name_ar', 'confidence', 'needs_review'],
                      },
                    },
                  },
                  required: ['day_name', 'muscles', 'exercises'],
                },
              },
            },
            required: ['days'],
          },
          warnings: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['needs_review', 'confidence', 'workout_plan', 'warnings'],
      },
    },
  });

  return JSON.parse(response.text?.trim() || '{}');
}
