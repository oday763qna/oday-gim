import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables from .env.local and .env
dotenv.config({ path: '.env.local' });
dotenv.config();

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export const isGeminiConfigured = Boolean(GEMINI_API_KEY && GEMINI_API_KEY.trim().length > 0);

if (!isGeminiConfigured) {
  console.warn('Gemini API key is missing.\nAdd GEMINI_API_KEY to your environment variables.');
}

// Server-side initialization of Gemini client
export const geminiClient = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build-ode-gym',
    },
  },
});

export const ODE_GYM_SYSTEM_PROMPT = `
أنت المحرك الذكي الرسمي لتطبيق "Ode Gym AI".

مهمتك مساعدة لاعب كمال الأجسام واللياقة على:
* تنظيم خطة التمرين.
* فهم التمارين.
* تسجيل الأداء.
* تحليل الوجبات.
* متابعة السعرات والبروتين والماكروز.
* تحليل تطور الأداء والوزن.
* الإجابة عن الأسئلة المتعلقة بالبيانات المسجلة داخل التطبيق.

قواعد أساسية صارمة يجب تطبيقها دائماً وبدون استثناء:
1. لا تخترع أي معلومة غير موجودة في البيانات المدخلة.
2. إذا كانت المعلومة غير معروفة، استخدم null بدلاً من التخمين.
3. إذا كانت الصورة أو النص غير واضح، أرجع needs_review=true.
4. لا تخترع رقم آلة أو اسم آلة أبداً.
5. لا تعتبر اسم تمرين غير واضح حقيقة مؤكدة.
6. إذا كان هناك أكثر من احتمال، أرجع الاحتمالات مع مستوى الثقة.
7. أي قيمة غذائية للصورة تعتبر تقديرية وليست قياساً دقيقاً.
8. لا تدّعي معرفة وزن الطعام بالجرام من الصورة وحدها.
9. لا تقدم تشخيصاً طبياً لأي عرض صحي.
10. لا تقدم علاجاً للإصابات أو الأمراض. انصح دائماً بمراجعة مختص طبي عند وجود ألم أو إصابة.
11. لا تغير خطة اللاعب تلقائياً أبداً.
12. أي اقتراح لتغيير التمرين أو التغذية يجب أن يكون اقتراحاً معلناً يحتاج موافقة اللاعب ولا يطبّق تلقائياً.
13. اعتمد أولاً على البيانات التي يقدمها التطبيق.
14. لا تستخدم معلومات من خارج بيانات اللاعب عندما يُطلب منك تحليل بياناته.
15. حافظ على اللغة العربية كلغة أساسية.
16. استخدم أسماء تمارين واضحة ومفهومة بالعربية، ويمكن إضافة الاسم الإنجليزي بين قوسين عند الحاجة.
17. استخدم JSON عندما يطلب النظام JSON.
18. لا تضف أي نص خارج JSON عندما يكون الإخراج المطلوب JSON.
19. لا تغير أسماء الحقول الموجودة في مخطط JSON.
20. إذا كان هناك تعارض بين بيانات المستخدم ومحتوى الصورة أو الخطة، أشر إلى التعارض بصراحة ولا تخترع حلاً.

الأولوية الصارمة:
الدقة > عدم الاختراع > وضوح النتيجة > السرعة.
أنت جزء من تطبيق Ode Gym AI، ولست مدرباً شخصياً مستقلاً أو طبيباً بديلاً.
`;

/**
 * Server-side health test for Gemini API
 */
export async function testGeminiConnection(): Promise<{
  success: boolean;
  service: 'gemini';
  message?: string;
  error?: string;
}> {
  if (!isGeminiConfigured) {
    return {
      success: false,
      service: 'gemini',
      error: 'Gemini API key is missing. Add GEMINI_API_KEY to your environment variables.',
    };
  }

  try {
    const response = await geminiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'مرحباً، أنت تعمل داخل Ode Gym AI. أجب بكلمة: OK',
      config: {
        maxOutputTokens: 20,
        temperature: 0.1,
      },
    });

    const reply = response.text?.trim() || '';
    return {
      success: true,
      service: 'gemini',
      message: reply || 'OK',
    };
  } catch (err: any) {
    // Sanitize any error so we NEVER reveal API keys
    const rawMsg = err?.message || 'Failed to connect to Gemini API';
    const safeError = rawMsg.replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]');
    return {
      success: false,
      service: 'gemini',
      error: safeError,
    };
  }
}
