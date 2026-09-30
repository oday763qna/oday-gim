import { WorkoutPlan, WorkoutLogSession, MealLogItem, BodyweightEntry, PlayerProfile, PlanProposal } from '../types/gym';

export const ODE_GYM_RULES = [
  { id: 1, text: 'لا تخترع أي معلومة غير موجودة في البيانات المدخلة.' },
  { id: 2, text: 'إذا كانت المعلومة غير معروفة، استخدم null بدلاً من التخمين.' },
  { id: 3, text: 'إذا كانت الصورة أو النص غير واضح، أرجع needs_review=true.' },
  { id: 4, text: 'لا تخترع رقم آلة أو اسم آلة أبداً.' },
  { id: 5, text: 'لا تعتبر اسم تمرين غير واضح حقيقة مؤكدة.' },
  { id: 6, text: 'إذا كان هناك أكثر من احتمال، أرجع الاحتمالات مع مستوى الثقة.' },
  { id: 7, text: 'أي قيمة غذائية للصورة تعتبر تقديرية وليست قياساً دقيقاً.' },
  { id: 8, text: 'لا تدّعي معرفة وزن الطعام بالجرام من الصورة وحدها.' },
  { id: 9, text: 'لا تقدم تشخيصاً طبياً.' },
  { id: 10, text: 'لا تقدم علاجاً للإصابات أو الأمراض.' },
  { id: 11, text: 'لا تغير خطة اللاعب تلقائياً.' },
  { id: 12, text: 'أي اقتراح لتغيير التمرين أو التغذية يجب أن يكون اقتراحاً يحتاج موافقة اللاعب.' },
  { id: 13, text: 'اعتمد أولاً على البيانات التي يقدمها التطبيق.' },
  { id: 14, text: 'لا تستخدم معلومات من خارج بيانات اللاعب عندما يُطلب منك تحليل بياناته.' },
  { id: 15, text: 'حافظ على اللغة العربية عندما تكون لغة المستخدم عربية.' },
  { id: 16, text: 'استخدم أسماء تمارين واضحة ومفهومة بالعربية، ويمكن إضافة الاسم الإنجليزي بين قوسين.' },
  { id: 17, text: 'استخدم JSON عندما يطلب النظام JSON.' },
  { id: 18, text: 'لا تضف أي نص خارج JSON عندما يكون الإخراج المطلوب JSON.' },
  { id: 19, text: 'لا تغير أسماء الحقول الموجودة في مخطط JSON.' },
  { id: 20, text: 'إذا كان هناك تعارض بين بيانات المستخدم ومحتوى الصورة أو الخطة، أشر إلى التعارض ولا تخترع حلاً.' },
];

// Empty clean templates - NO MOCK OR DEMO DATA
export const EMPTY_PROFILE: PlayerProfile = {
  name: '',
  age: 0,
  heightCm: 0,
  currentWeightKg: 0,
  targetWeightKg: 0,
  goal: 'muscle_gain',
  experienceLevel: 'intermediate',
  dailyCalorieTarget: 0,
  dailyProteinTarget: 0,
  dailyCarbsTarget: 0,
  dailyFatTarget: 0,
  splitType: '',
};

export const EMPTY_PLAN: WorkoutPlan = {
  id: '',
  title: '',
  description: '',
  lastUpdated: '',
  days: [],
};

export const EMPTY_WORKOUTS: WorkoutLogSession[] = [];
export const EMPTY_MEALS: MealLogItem[] = [];
export const EMPTY_WEIGHTS: BodyweightEntry[] = [];
export const EMPTY_PROPOSALS: PlanProposal[] = [];

// Local Storage keys
export const STORAGE_KEYS = {
  PROFILE: 'ode_gym_profile_clean_v2',
  PLAN: 'ode_gym_plan_clean_v2',
  WORKOUTS: 'ode_gym_workouts_clean_v2',
  MEALS: 'ode_gym_meals_clean_v2',
  WEIGHTS: 'ode_gym_weights_clean_v2',
  PROPOSALS: 'ode_gym_proposals_clean_v2',
  CHAT_MESSAGES: 'ode_gym_chat_clean_v2',
};

// Purge any legacy mock data from old keys if present
export function purgeLegacyMockData(): void {
  if (typeof window === 'undefined') return;
  const legacyKeys = [
    'ode_gym_profile_v1',
    'ode_gym_plan_v1',
    'ode_gym_workouts_v1',
    'ode_gym_meals_v1',
    'ode_gym_weights_v1',
    'ode_gym_proposals_v1',
    'ode_gym_chat_v1',
  ];
  legacyKeys.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {}
  });
}

export function loadStoredData<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    // Double check that it's not old demo data
    if (key.includes('profile') && parsed?.name === 'كابتن عدي') {
      localStorage.removeItem(key);
      return fallback;
    }
    if (key.includes('plan') && parsed?.id === 'plan-ppl-core') {
      localStorage.removeItem(key);
      return fallback;
    }
    return parsed;
  } catch (e) {
    console.error(`Error loading key ${key}`, e);
    return fallback;
  }
}

export function saveStoredData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving key ${key}`, e);
  }
}

export function clearAllUserData(): void {
  if (typeof window === 'undefined') return;
  Object.values(STORAGE_KEYS).forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {}
  });
  purgeLegacyMockData();
}
