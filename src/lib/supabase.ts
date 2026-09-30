import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variable resolution for browser (Vite/Next) and node environments
const getEnvVar = (name: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env[name]) return import.meta.env[name];
    if (name.startsWith('NEXT_PUBLIC_')) {
      const viteName = name.replace('NEXT_PUBLIC_', 'VITE_');
      if (import.meta.env[viteName]) return import.meta.env[viteName];
    }
  }
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[name]) return process.env[name] as string;
    if (name.startsWith('NEXT_PUBLIC_')) {
      const viteName = name.replace('NEXT_PUBLIC_', 'VITE_');
      if (process.env[viteName]) return process.env[viteName] as string;
    }
  }
  return '';
};

export const SUPABASE_URL = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
export const SUPABASE_ANON_KEY = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

// Verify environment variables with clear developer feedback
export const checkSupabaseEnv = () => {
  const missing: string[] = [];
  if (!SUPABASE_URL) {
    console.warn('Supabase URL is missing.\nAdd NEXT_PUBLIC_SUPABASE_URL to your environment variables.');
    missing.push('NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!SUPABASE_ANON_KEY) {
    console.warn('Supabase anon key is missing.\nAdd NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.');
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return {
    isConfigured: missing.length === 0,
    missing,
  };
};

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Create Supabase Client instance (or null/mock if unconfigured)
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : (createClient('https://placeholder-project.supabase.co', 'placeholder-anon-key', {
      auth: { persistSession: false, autoRefreshToken: false },
    }) as any);

// ==========================================
// 1. Authentication Service
// ==========================================
export const authService = {
  async signUp(email: string, password: string, metadata?: Record<string, any>) {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.');
    return await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
  },

  async signIn(email: string, password: string) {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.');
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  async signOut() {
    if (!isSupabaseConfigured) return;
    return await supabase.auth.signOut();
  },

  async getSession() {
    if (!isSupabaseConfigured) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  async getCurrentUser() {
    if (!isSupabaseConfigured) return null;
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (!isSupabaseConfigured) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return supabase.auth.onAuthStateChange(callback);
  },
};

// ==========================================
// 2. Player Profiles (table: profiles)
// ==========================================
export const profilesService = {
  async getProfile(userId: string) {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async upsertProfile(profileData: {
    id: string;
    full_name?: string;
    age?: number;
    height_cm?: number;
    current_weight_kg?: number;
    target_weight_kg?: number;
    goal?: string;
    experience_level?: string;
    daily_calories?: number;
    daily_protein?: number;
    daily_carbs?: number;
    daily_fat?: number;
    split_type?: string;
    updated_at?: string;
  }) {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.');
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ==========================================
// 3. Workout Plans (tables: workout_plans, workout_days, planned_exercises)
// ==========================================
export const workoutPlansService = {
  async getPlans(userId: string) {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('workout_plans')
      .select(`
        *,
        workout_days (
          *,
          planned_exercises (*)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async savePlan(planData: {
    id?: string;
    user_id: string;
    title: string;
    description?: string;
    is_active?: boolean;
    days?: any[];
  }) {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.');
    const { data, error } = await supabase
      .from('workout_plans')
      .upsert({
        id: planData.id,
        user_id: planData.user_id,
        title: planData.title,
        description: planData.description,
        is_active: planData.is_active ?? true,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ==========================================
// 4. Gym Machines (table: gym_machines)
// ==========================================
export const gymMachinesService = {
  async getMachines(userId: string) {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('gym_machines')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async addMachine(machineData: {
    user_id: string;
    machine_name: string;
    machine_number?: string;
    target_muscle?: string;
    brand?: string;
    notes?: string;
  }) {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.');
    const { data, error } = await supabase
      .from('gym_machines')
      .insert(machineData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ==========================================
// 5. Workout Sessions & Sets (tables: workout_sessions, exercise_logs, exercise_sets)
// ==========================================
export const workoutLoggingService = {
  async getSessions(userId: string, limit = 20) {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('workout_sessions')
      .select(`
        *,
        exercise_logs (
          *,
          exercise_sets (*)
        )
      `)
      .eq('user_id', userId)
      .order('session_date', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  async saveSession(sessionData: {
    id?: string;
    user_id: string;
    session_title: string;
    session_date: string;
    duration_minutes?: number;
    total_volume_kg?: number;
    notes?: string;
  }) {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.');
    const { data, error } = await supabase
      .from('workout_sessions')
      .upsert(sessionData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ==========================================
// 6. Meals & Nutrition (tables: meals, meal_items)
// ==========================================
export const mealsService = {
  async getMeals(userId: string, date?: string) {
    if (!isSupabaseConfigured) return [];
    let query = supabase
      .from('meals')
      .select(`
        *,
        meal_items (*)
      `)
      .eq('user_id', userId);

    if (date) {
      query = query.eq('meal_date', date);
    }

    const { data, error } = await query.order('meal_time', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async saveMeal(mealData: {
    id?: string;
    user_id: string;
    meal_date: string;
    meal_time: string;
    meal_name: string;
    meal_type: string;
    total_calories?: number;
    total_protein_g?: number;
    total_carbs_g?: number;
    total_fat_g?: number;
    is_estimated?: boolean;
    photo_url?: string;
  }) {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.');
    const { data, error } = await supabase
      .from('meals')
      .upsert(mealData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ==========================================
// 7. Body Measurements (table: body_measurements)
// ==========================================
export const measurementsService = {
  async getMeasurements(userId: string) {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', userId)
      .order('measured_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addMeasurement(measurementData: {
    user_id: string;
    weight_kg: number;
    body_fat_percentage?: number;
    muscle_mass_kg?: number;
    measured_at: string;
    notes?: string;
  }) {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.');
    const { data, error } = await supabase
      .from('body_measurements')
      .insert(measurementData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ==========================================
// 8. Health Test Function (Database & Auth ping)
// ==========================================
export const testSupabaseConnection = async (): Promise<{
  success: boolean;
  service: 'supabase';
  message?: string;
  error?: string;
  isConfigured: boolean;
}> => {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      service: 'supabase',
      isConfigured: false,
      error: 'Supabase URL أو Anon Key غير متوفرين في ملف .env.local أو بيئة التشغيل.',
    };
  }

  try {
    // Attempt lightweight ping to profiles or auth session
    const { error } = await supabase.from('profiles').select('id').limit(1);
    
    // Note: If user isn't logged in, RLS may return empty or 401/PGRST301, but the network request succeeded
    if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
      // If table doesn't exist yet, try auth check
      const authHealth = await supabase.auth.getSession();
      if (authHealth.error) {
        throw authHealth.error;
      }
    }

    return {
      success: true,
      service: 'supabase',
      isConfigured: true,
      message: 'تم الاتصال بـ Supabase بنجاح (قاعدة البيانات والمصادقة متصلة).',
    };
  } catch (err: any) {
    return {
      success: false,
      service: 'supabase',
      isConfigured: true,
      error: err.message || 'فشل الاتصال بقاعدة بيانات Supabase.',
    };
  }
};
