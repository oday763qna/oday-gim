import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Support base64 image uploads up to 25MB
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Server-side initialization of Gemini API using the official modern SDK
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const ODE_GYM_SYSTEM_PROMPT = `
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
16. استخدم أسماء تمارين واضحة ومفهومة بالعربية، ويمكن إضافة الاسم الإنجليزي بين قوسين عند الحاجة (مثال: بنش برس مستوي بالبار (Barbell Flat Bench Press)).
17. استخدم JSON عندما يطلب النظام JSON.
18. لا تضف أي نص خارج JSON عندما يكون الإخراج المطلوب JSON.
19. لا تغير أسماء الحقول الموجودة في مخطط JSON.
20. إذا كان هناك تعارض بين بيانات المستخدم ومحتوى الصورة أو الخطة، أشر إلى التعارض بصراحة ولا تخترع حلاً.

الأولوية الصارمة:
الدقة > عدم الاختراع > وضوح النتيجة > السرعة.
أنت جزء من تطبيق Ode Gym AI، ولست مدرباً شخصياً مستقلاً أو طبيباً بديلاً.
`;

// Helper: Ensure API key is configured
function checkApiKey(res: Response): boolean {
  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({
      error: 'لم يتم العثور على مفتاح GEMINI_API_KEY في إعدادات البيئة (Settings > Secrets).',
      code: 'MISSING_API_KEY',
    });
    return false;
  }
  return true;
}

// 1. Interactive Coach Chat Endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  if (!checkApiKey(res)) return;

  try {
    const { messages, playerDataContext, imageBase64, mimeType } = req.body;

    let contentsParts: any[] = [];

    // Attach image if present
    if (imageBase64) {
      contentsParts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''),
        },
      });
    }

    // Format chat history and context
    let formattedContext = '';
    if (playerDataContext) {
      formattedContext = `
[بيانات اللاعب المسجلة حالياً داخل التطبيق]:
- الخطة الحالية: ${JSON.stringify(playerDataContext.currentPlan || 'لا توجد خطة مسجلة بعد')}
- آخر التمارين المسجلة: ${JSON.stringify(playerDataContext.recentWorkouts || [])}
- وجبات اليوم والماكروز: ${JSON.stringify(playerDataContext.todayMeals || [])}
- سجل الوزن الأخير: ${JSON.stringify(playerDataContext.recentWeight || [])}
- الأهداف المحددة: ${JSON.stringify(playerDataContext.profile || {})}
`;
    }

    // Format conversation history for Gemini
    const lastUserMessage = messages && messages.length > 0 ? messages[messages.length - 1].content : '';
    const previousHistory = (messages || []).slice(0, -1).map((m: any) => `${m.role === 'user' ? 'اللاعب' : 'Ode Gym AI'}: ${m.content}`).join('\n');

    const promptText = `
${formattedContext}

سياق المحادثة السابقة:
${previousHistory}

رسالة اللاعب الحالية:
${lastUserMessage}

تذكر تطبيق الـ 20 قاعدة بدقة بالغة. إذا قدمت اقتراحاً لتعديل خطة أو تمرين أو تغذية، وضّح أنه مجرد اقتراح يتطلب موافقة اللاعب الصريحة.
إذا طلب اللاعب خطة تمرين أو تعديل تمرين، يمكنك تقديم اقتراح مفصل واختم دائماً بطلب موافقته قبل أن يعتمدها.
`;

    contentsParts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: contentsParts },
      config: {
        systemInstruction: ODE_GYM_SYSTEM_PROMPT,
        temperature: 0.2, // Low temperature for high accuracy & zero hallucination
      },
    });

    const reply = response.text || 'عذراً، لم أتمكن من معالجة الطلب.';
    res.json({ reply });
  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message || 'حدث خطأ أثناء معالجة المحادثة' });
  }
});

// 2. Meal Analyzer Endpoint (Vision & Text)
app.post('/api/analyze-meal', async (req: Request, res: Response) => {
  if (!checkApiKey(res)) return;

  try {
    const { imageBase64, mimeType, textDescription, mealTime } = req.body;

    const parts: any[] = [];
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''),
        },
      });
    }

    const promptText = `
أنت محلل الوجبات في Ode Gym AI.
حلل هذه الوجبة بدقة وفقاً للقواعد الصارمة:
- أي قيمة غذائية للصورة تعتبر تقديرية وليست قياساً دقيقاً (القاعدة 7).
- لا تدّعي معرفة وزن الطعام بالجرام من الصورة وحدها (القاعدة 8).
- إذا كانت الصورة أو النص غير واضح أو لا يمكن التعرف على المكونات بدقة، ضع needs_review=true واذكر السبب (القاعدة 3).
- إذا كانت هناك معلومة غير معروفة أو لا يمكن تقديرها بأمان، ضع null بدلاً من التخمين (القاعدة 2).
- إذا كان هناك أكثر من احتمال لمكون، أرجع الاحتمالات مع مستوى الثقة في alternatives_if_uncertain (القاعدة 6).
- حافظ على الـ JSON الصارم بدون أي نص قبله أو بعده (القواعد 17, 18, 19).

وصف الوجبة المقدم من اللاعب: "${textDescription || 'لم يُقدّم وصف نصي، الاعتماد على الصورة'}"
وقت الوجبة: "${mealTime || 'غير محدد'}"
`;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        systemInstruction: ODE_GYM_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            meal_name: { type: Type.STRING, description: 'اسم الوجبة المقدر بالعربية' },
            confidence: { type: Type.NUMBER, description: 'مستوى الثقة في التعرف من 0 إلى 100' },
            needs_review: { type: Type.BOOLEAN, description: 'هل الصورة أو النص يحتاج مراجعة أو غير مؤكد؟' },
            review_reason: { type: Type.STRING, description: 'سبب الحاجة للمراجعة إذا كان needs_review صحيحاً، أو null' },
            estimated_weight_note: { type: Type.STRING, description: 'تنبيه صريح بأن الوزن والماكروز تقديريان' },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: 'اسم العنصر الغذائي بالعربية' },
                  estimated_portion: { type: Type.STRING, description: 'الكمية التقديرية الحجمية (مثال: قبضة يد، قطعة متوسطة)' },
                  calories: { type: Type.NUMBER, description: 'السعرات التقديرية أو null' },
                  protein_g: { type: Type.NUMBER, description: 'البروتين بالجرام أو null' },
                  carbs_g: { type: Type.NUMBER, description: 'الكربوهيدرات بالجرام أو null' },
                  fat_g: { type: Type.NUMBER, description: 'الدهون بالجرام أو null' },
                },
                required: ['name', 'estimated_portion'],
              },
            },
            total_calories: { type: Type.NUMBER, description: 'مجموع السعرات التقديري' },
            total_protein_g: { type: Type.NUMBER, description: 'مجموع البروتين التقديري' },
            total_carbs_g: { type: Type.NUMBER, description: 'مجموع الكارب التقديري' },
            total_fat_g: { type: Type.NUMBER, description: 'مجموع الدهون التقديري' },
            advice_and_notes: { type: Type.STRING, description: 'ملاحظة رياضية عن توازن الوجبة والبروتين' },
            alternatives_if_uncertain: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'احتمالات بديلة مع مستوى الثقة إذا كان هناك شك'
            },
          },
          required: [
            'meal_name',
            'confidence',
            'needs_review',
            'items',
            'total_calories',
            'total_protein_g',
            'total_carbs_g',
            'total_fat_g',
            'estimated_weight_note',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Meal analysis error:', err);
    res.status(500).json({ error: err.message || 'فشل تحليل الوجبة' });
  }
});

// 3. Exercise & Machine Guide / Identifier Endpoint
app.post('/api/analyze-machine-exercise', async (req: Request, res: Response) => {
  if (!checkApiKey(res)) return;

  try {
    const { imageBase64, mimeType, query } = req.body;

    const parts: any[] = [];
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''),
        },
      });
    }

    const promptText = `
أنت خبير التمارين والأجهزة في Ode Gym AI.
حلل هذا التمرين أو جهاز الجيم وفقاً للقواعد الصارمة:
- لا تخترع رقم آلة أو اسم آلة أبداً (القاعدة 4). إذا لم يكن رقم الآلة أو كودها مطبوعاً بوضوح تام، ضع machine_number=null.
- لا تعتبر اسم تمرين غير واضح حقيقة مؤكدة (القاعدة 5).
- إذا كان هناك أكثر من احتمال أو شك، أرجع الاحتمالات مع مستوى الثقة في alternative_possibilities وضع needs_review=true (القواعد 3 و 6).
- استخدم أسماء تمارين واضحة ومفهومة بالعربية مع الاسم الإنجليزي بين قوسين (القاعدة 16).
- لا تقدم أي نصائح علاجية لإصابة أو تشخيص طبي (القواعد 9 و 10).
- أخرج بصيغة JSON حصراً بدون أي نصوص خارجية (القواعد 17 و 18 و 19).

طلب أو استفسار اللاعب: "${query || 'التعرف على الجهاز أو التمرين من الصورة المرفقة'}"
`;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        systemInstruction: ODE_GYM_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            identified_name_ar: { type: Type.STRING, description: 'اسم التمرين أو الجهاز بالعربية مع الإنجليزي بين قوسين' },
            is_machine: { type: Type.BOOLEAN, description: 'هل هو جهاز ميكانيكي / كابلات أم وزن حر؟' },
            machine_model_or_number: { type: Type.STRING, description: 'رقم أو موديل الآلة فقط إذا كان ظاهراً ومؤكداً 100%، وإلا null حصراً' },
            confidence: { type: Type.NUMBER, description: 'مستوى الثقة في التحديد من 0 إلى 100' },
            needs_review: { type: Type.BOOLEAN, description: 'هل يحتاج لمراجعة لعدم وضوح زاوية الصورة أو الجهاز؟' },
            review_reason: { type: Type.STRING, description: 'سبب الشك إن وجد، أو null' },
            target_muscle: { type: Type.STRING, description: 'العضلة المستهدفة الأساسية' },
            secondary_muscles: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'العضلات المساعدة'
            },
            execution_steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'خطوات الأداء الحركي الصحيح خطوة بخطوة'
            },
            machine_adjustments: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'كيفية ضبط المقعد / المسند / البكرات قبل البدء'
            },
            common_mistakes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'الأخطاء الشائعة لتجنب الإصابة'
            },
            alternative_possibilities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name_ar: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  note: { type: Type.STRING },
                },
                required: ['name_ar', 'confidence'],
              },
              description: 'الاحتمالات البديلة عند وجود أكثر من احتمال'
            },
          },
          required: [
            'identified_name_ar',
            'is_machine',
            'confidence',
            'needs_review',
            'target_muscle',
            'execution_steps',
            'common_mistakes',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Exercise/machine analysis error:', err);
    res.status(500).json({ error: err.message || 'فشل تحليل التمرين أو الجهاز' });
  }
});

// 4. Performance & Weight Progress Analyzer
app.post('/api/analyze-progress', async (req: Request, res: Response) => {
  if (!checkApiKey(res)) return;

  try {
    const { workouts, bodyweights, profile } = req.body;

    const promptText = `
أنت محلل الأداء والتطور في Ode Gym AI.
حلل تطور أداء اللاعب ووزنه بناءً حصراً وبدقة تامة على البيانات المدخلة أدناه:
- لا تخترع أي معلومة أو أرقام غير موجودة (القاعدة 1).
- اعتمد فقط على البيانات المقدمة ولا تستخدم افتراضات من خارجها (القاعدة 13 و 14).
- إذا كانت البيانات غير كافية أو فارغة، اذكر ذلك صراحة وضع needs_review=true (القاعدة 2 و 3).
- أي اقتراح لتغيير تكرارات أو أوزان أو تمرين يجب أن يُصاغ كـ "اقتراح يحتاج موافقة اللاعب" (القاعدة 11 و 12).
- لا تقدم تشخيصاً طبياً (القاعدة 9 و 10).
- أخرج النتيجة بصيغة JSON بدون أي كلام إضافي (القواعد 17, 18, 19).

بيانات التمارين المسجلة:
${JSON.stringify(workouts || [], null, 2)}

سجل أوزان الجسم المسجلة:
${JSON.stringify(bodyweights || [], null, 2)}

أهداف وملف اللاعب:
${JSON.stringify(profile || {}, null, 2)}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction: ODE_GYM_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary_statement: { type: Type.STRING, description: 'ملخص دقيق ومباشر للتطور بناءً على الأرقام الحقيقية' },
            volume_trend: { type: Type.STRING, description: 'تحليل الحجم التدريبي الإجمالي (Sets x Reps x Weight)' },
            strength_highlights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'التمارين التي حدث فيها تطور وزني أو تكراري مسجل'
            },
            weight_trend_analysis: { type: Type.STRING, description: 'تحليل تطور وزن الجسم مقارنة بالهدف' },
            identified_plateaus: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'أي تمارين توقف فيها التقدم أو تحتاج انتباه'
            },
            proposals_requiring_player_approval: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  reasoning: { type: Type.STRING },
                  action_type: { type: Type.STRING, description: 'workout_change | volume_increase | rest_adjustment' },
                },
                required: ['title', 'description', 'reasoning', 'action_type'],
              },
              description: 'مقترحات تدريبية صريحة تتطلب موافقة اللاعب'
            },
            needs_review: { type: Type.BOOLEAN },
            review_reason: { type: Type.STRING },
          },
          required: [
            'summary_statement',
            'volume_trend',
            'strength_highlights',
            'weight_trend_analysis',
            'proposals_requiring_player_approval',
            'needs_review',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Progress analysis error:', err);
    res.status(500).json({ error: err.message || 'فشل تحليل التقدم' });
  }
});

// 5. Workout Plan Parser (OCR / Image / PDF / Text)
app.post('/api/parse-workout-plan', async (req: Request, res: Response) => {
  if (!checkApiKey(res)) return;

  try {
    const { text, fileBase64, mimeType } = req.body;

    if (!text && !fileBase64) {
      return res.json({
        needs_review: true,
        confidence: 0.0,
        workout_plan: {
          name: null,
          days: []
        },
        warnings: [
          'لم يتم تزويد أي نص أو صورة أو ملف لتحليله. يرجى إرفاق خطة التمرين ليتم استخراج البيانات بدقة وبدون أي اختراع.'
        ]
      });
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

قواعد صارمة جداً:
* لا تخترع الوزن أبداً.
* لا تخترع عدد المجموعات.
* لا تخترع التكرارات.
* لا تخترع رقم الجهاز.
* لا تفترض أن تمريناً معيناً يحتاج جهازاً معيناً.
* إذا لم توجد معلومة استخدم null.
* إذا كان اسم التمرين غير واضح، ضع needs_review=true.
* ضع confidence بين 0 و 1 (مثلاً 0.95 أو 0.8).
* إذا كانت الصورة غير واضحة، لا تحاول ملء الفراغات بالتخمين.
* أرجع JSON حصراً بدون أي نصوص أو markdown خارجه.

النص المرفق إن وجد:
${text || 'لا يوجد نص مرافق، الاعتماد على الملف المرفق'}
`;

    parts.push({ text: parsePrompt });

    const response = await ai.models.generateContent({
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

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Workout plan parser error:', err);
    res.status(500).json({ error: err.message || 'فشل تحليل خطة التمرين' });
  }
});

// 6. Exercise to Player Gym Machines Matcher
app.post('/api/match-exercise-machine', async (req: Request, res: Response) => {
  if (!checkApiKey(res)) return;

  try {
    const { exercise_name, player_machines } = req.body;

    if (!exercise_name || !player_machines || !Array.isArray(player_machines) || player_machines.length === 0) {
      return res.json({
        match_status: 'no_match',
        exercise_name: exercise_name || '',
        matched_machine_id: null,
        matched_machine_name: null,
        matched_machine_number: null,
        confidence: 0,
        alternatives: [],
        reason: 'لم يتم توفير اسم التمرين أو قائمة أجهزة النادي للمطابقة.'
      });
    }

    const matcherPrompt = `
أنت المحرك الذكي في Ode Gym AI المسؤول عن مطابقة التمارين بأجهزة النادي الخاصة باللاعب.
لديك تمرين مستخرج من خطة اللاعب وقائمة الأجهزة التي أدخلها اللاعب في ناديه.

مهمتك تحديد ما إذا كان التمرين يمكن ربطه بأحد الأجهزة الموجودة في قائمة اللاعب.

القواعد الصارمة:
1. لا تخترع جهازاً غير موجود في قائمة اللاعب أبداً.
2. لا تخترع رقم جهاز، اعتمد فقط على الرقم المسجل في قائمة اللاعب إن وجد وإلا ضع null.
3. إذا وجدت تطابقاً واضحاً ومؤكداً، أرجع الجهاز واجعل match_status = "matched" وضع confidence عالياً (مثلاً 0.85 إلى 1.0).
4. إذا كان التطابق غير مؤكد أو احتمالي، اجعل match_status = "needs_confirmation" وضع confidence متوسطاً (مثلاً 0.5 إلى 0.8) واذكر السبب.
5. إذا لم يوجد تطابق، اجعل match_status = "no_match" وجميع حقول matched_machine_id و matched_machine_name و matched_machine_number بقيمة null. لا تنشئ جهازاً جديداً أبداً.
6. يمكن استخدام تشابه أسماء التمارين والأجهزة، ولكن لا تعتبر التشابه دليلاً مؤكداً.
7. إذا كان هناك أكثر من جهاز محتمل، أرجع الخيارات في مصفوفة alternatives.
8. أخرج JSON فقط بدون أي نص أو markdown خارجه.

اسم التمرين المطلوب مطابقته:
"${exercise_name}"

قائمة الأجهزة المسجلة في نادي اللاعب:
${JSON.stringify(player_machines, null, 2)}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: matcherPrompt,
      config: {
        systemInstruction: ODE_GYM_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            match_status: {
              type: Type.STRING,
              description: 'matched | needs_confirmation | no_match'
            },
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
                  machine_number: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  note: { type: Type.STRING }
                },
                required: ['machine_id', 'machine_name', 'confidence']
              }
            },
            reason: { type: Type.STRING }
          },
          required: [
            'match_status',
            'exercise_name',
            'matched_machine_id',
            'matched_machine_name',
            'matched_machine_number',
            'confidence',
            'alternatives',
            'reason'
          ]
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Machine match error:', err);
    res.status(500).json({ error: err.message || 'فشل مطابقة التمرين بالجهاز' });
  }
});

// 7. Developer Setup & System Health Endpoints
app.get('/api/system/status', (_req: Request, res: Response) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);

  res.json({
    supabase: {
      configured: Boolean(supabaseUrl && supabaseAnon),
      hasUrl: Boolean(supabaseUrl),
      hasAnonKey: Boolean(supabaseAnon),
    },
    gemini: {
      configured: hasGeminiKey,
    },
    database: {
      configured: Boolean(supabaseUrl && supabaseAnon),
    },
    authentication: {
      ready: Boolean(supabaseUrl && supabaseAnon),
    },
  });
});

app.post('/api/test/gemini', async (_req: Request, res: Response) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.trim().length === 0) {
    return res.status(400).json({
      success: false,
      service: 'gemini',
      error: 'Gemini API key is missing. Add GEMINI_API_KEY to your environment variables.',
    });
  }

  try {
    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'مرحباً، أنت تعمل داخل Ode Gym AI. أجب بكلمة: OK',
      config: {
        maxOutputTokens: 20,
        temperature: 0.1,
      },
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('انتهت مهلة الاتصال بمحرك Gemini API (تأكد من صحة المفتاح والاتصال)')), 30000)
    );

    const response = (await Promise.race([generatePromise, timeoutPromise])) as any;
    const reply = response.text?.trim() || 'OK';
    return res.json({
      success: true,
      service: 'gemini',
      reply,
    });
  } catch (err: any) {
    const rawMsg = err?.message || 'Failed to connect to Gemini API';
    const safeError = rawMsg.replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]');
    return res.status(500).json({
      success: false,
      service: 'gemini',
      error: safeError,
    });
  }
});

app.post('/api/test/supabase', async (_req: Request, res: Response) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnon) {
    return res.status(400).json({
      success: false,
      service: 'supabase',
      error: 'Supabase URL is missing or anon key is missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to environment variables.',
    });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(supabaseUrl, supabaseAnon);
    const { error } = await sb.from('profiles').select('id').limit(1);

    if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
      const authRes = await sb.auth.getSession();
      if (authRes.error) throw authRes.error;
    }

    return res.json({
      success: true,
      service: 'supabase',
      message: 'تم التحقق من الاتصال بـ Supabase بنجاح.',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      service: 'supabase',
      error: err.message || 'فشل الاتصال بـ Supabase',
    });
  }
});

// Vite middleware or static serving
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[Ode Gym AI] Server running on port ${PORT}`);
  });
}

setupServer();
