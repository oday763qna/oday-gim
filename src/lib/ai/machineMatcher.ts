import { Type } from '@google/genai';
import { geminiClient, ODE_GYM_SYSTEM_PROMPT } from '../gemini';

export interface MatchExerciseMachineParams {
  exerciseName: string;
  userMachines: Array<{
    id: string;
    machine_name: string;
    machine_number?: string | null;
    target_muscle?: string | null;
  }>;
}

export async function matchExerciseMachineAI(params: MatchExerciseMachineParams) {
  const { exerciseName, userMachines } = params;

  if (!exerciseName || !userMachines || userMachines.length === 0) {
    return {
      match_status: 'no_match',
      exercise_name: exerciseName || '',
      matched_machine_id: null,
      matched_machine_name: null,
      matched_machine_number: null,
      confidence: 0,
      alternatives: [],
      reason: 'لم يتم تزويد اسم التمرين أو قائمة أجهزة النادي في المدخلات.',
    };
  }

  const promptText = `
لديك تمرين مستخرج من خطة اللاعب وقائمة الأجهزة التي أدخلها اللاعب في ناديه.
مهمتك تحديد ما إذا كان التمرين يمكن ربطه بأحد الأجهزة الموجودة في قائمة اللاعب.

القواعد:
1. لا تخترع جهازاً غير موجود في قائمة اللاعب.
2. لا تخترع رقم جهاز.
3. إذا وجدت تطابقاً واضحاً، أرجع الجهاز وضع match_status="matched".
4. إذا كان التطابق غير مؤكد، أرجع match_status="needs_confirmation".
5. إذا لم يوجد تطابق، لا تنشئ جهازاً جديداً وضع match_status="no_match".
6. يمكن استخدام تشابه أسماء التمارين والأجهزة، ولكن لا تعتبر التشابه دليلاً مؤكداً.
7. إذا كان هناك أكثر من جهاز محتمل، أرجع الخيارات في alternatives.

اسم التمرين: "${exerciseName}"
قائمة أجهزة اللاعب:
${JSON.stringify(userMachines, null, 2)}
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
          match_status: { type: Type.STRING, description: 'matched | needs_confirmation | no_match' },
          exercise_name: { type: Type.STRING },
          matched_machine_id: { type: Type.STRING },
          matched_machine_name: { type: Type.STRING },
          matched_machine_number: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          alternatives: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                machine_id: { type: Type.STRING },
                machine_name: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
              },
              required: ['machine_name', 'confidence'],
            },
          },
          reason: { type: Type.STRING },
        },
        required: [
          'match_status',
          'exercise_name',
          'confidence',
          'alternatives',
          'reason',
        ],
      },
    },
  });

  return JSON.parse(response.text?.trim() || '{}');
}
