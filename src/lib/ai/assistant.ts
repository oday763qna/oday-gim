import { geminiClient, ODE_GYM_SYSTEM_PROMPT } from '../gemini';

export interface ChatAssistantParams {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  playerDataContext?: any;
  imageBase64?: string;
  mimeType?: string;
}

export async function askOdeAssistantAI(params: ChatAssistantParams) {
  const { messages, playerDataContext, imageBase64, mimeType } = params;

  let contentsParts: any[] = [];

  if (imageBase64) {
    contentsParts.push({
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: imageBase64.replace(/^data:[^;]+;base64,/, ''),
      },
    });
  }

  let formattedContext = '';
  if (playerDataContext) {
    formattedContext = `
[بيانات اللاعب المسجلة حالياً داخل التطبيق]:
- الخطة الحالية: ${JSON.stringify(playerDataContext.currentPlan || 'لا توجد خطة مسجلة بعد')}
- آخر التمارين المسجلة: ${JSON.stringify(playerDataContext.recentWorkouts || [])}
- وجبات اليوم والماكروز: ${JSON.stringify(playerDataContext.todayMeals || [])}
- سجل الوزن الأخير: ${JSON.stringify(playerDataContext.recentWeight || [])}
- الأهداف والملف الشخصي: ${JSON.stringify(playerDataContext.profile || {})}
`;
  }

  const lastUserMessage = messages && messages.length > 0 ? messages[messages.length - 1].content : '';
  const previousHistory = (messages || [])
    .slice(0, -1)
    .map((m: any) => `${m.role === 'user' ? 'اللاعب' : 'Ode Gym AI'}: ${m.content}`)
    .join('\n');

  const promptText = `
${formattedContext}

سياق المحادثة السابقة:
${previousHistory}

رسالة اللاعب الحالية:
${lastUserMessage}

تذكر تطبيق الـ 20 قاعدة بدقة بالغة:
- لا تخترع أي معلومة غير موجودة.
- إذا كانت البيانات غير كافية، قل بوضوح إن البيانات غير كافية.
- لا تغير خطة اللاعب تلقائياً أبداً.
- أي اقتراح يجب أن يظهر كـ "اقتراح يحتاج موافقة اللاعب".
- إذا كان السؤال طبياً أو متعلقاً بألم أو إصابة، لا تقدم تشخيصاً أو علاجاً وانصح بمراجعة مختص طبي.
- أجب بالعربية دائماً.
`;

  contentsParts.push({ text: promptText });

  const response = await geminiClient.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: { parts: contentsParts },
    config: {
      systemInstruction: ODE_GYM_SYSTEM_PROMPT,
      temperature: 0.2,
    },
  });

  return response.text || 'عذراً، لم أتمكن من معالجة الطلب.';
}
