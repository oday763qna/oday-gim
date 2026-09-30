export type GoalType = 'muscle_gain' | 'fat_loss' | 'strength' | 'recomp';

export interface PlayerProfile {
  name: string;
  age: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  goal: GoalType;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
  dailyCarbsTarget: number;
  dailyFatTarget: number;
  splitType: string;
}

export interface ExercisePlanItem {
  id: string;
  nameAr: string;
  nameEn?: string;
  targetMuscle: string;
  sets: number;
  targetReps: string;
  restSecs: number;
  equipmentType: 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight';
  notes?: string;
}

export interface WorkoutDayPlan {
  id: string;
  dayName: string; // e.g. "اليوم 1: دفع (Push - صدور وتراي وأكتاف أمامية)"
  focusMuscles: string[];
  exercises: ExercisePlanItem[];
}

export interface WorkoutPlan {
  id: string;
  title: string;
  description: string;
  days: WorkoutDayPlan[];
  lastUpdated: string;
}

export interface LoggedSet {
  setNumber: number;
  weightKg: number;
  reps: number;
  rpe?: number;
  completed: boolean;
}

export interface LoggedExercise {
  exerciseId: string;
  exerciseNameAr: string;
  exerciseNameEn?: string;
  targetMuscle: string;
  sets: LoggedSet[];
}

export interface WorkoutLogSession {
  id: string;
  date: string; // YYYY-MM-DD
  dayPlanId?: string;
  sessionTitle: string;
  durationMinutes: number;
  exercises: LoggedExercise[];
  notes?: string;
  totalVolumeKg: number;
}

export interface FoodItemBreakdown {
  name: string;
  estimatedPortion: string;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
}

export interface MealLogItem {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout';
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  items?: FoodItemBreakdown[];
  isEstimated: boolean;
  needsReview?: boolean;
  reviewReason?: string;
  photoUrl?: string;
}

export interface BodyweightEntry {
  id: string;
  date: string;
  weightKg: number;
  note?: string;
}

export interface PlanProposal {
  id: string;
  title: string;
  description: string;
  reasoning: string;
  type: 'add_exercise' | 'modify_sets' | 'diet_change' | 'deload_suggestion';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  payload?: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachedImage?: string;
  proposal?: PlanProposal;
  needsReview?: boolean;
}

export interface MachineAnalysisResponse {
  identified_name_ar: string | null;
  is_machine: boolean;
  machine_model_or_number: string | null;
  confidence: number;
  needs_review: boolean;
  review_reason: string | null;
  target_muscle: string | null;
  secondary_muscles: string[];
  execution_steps: string[];
  machine_adjustments: string[];
  common_mistakes: string[];
  alternative_possibilities?: Array<{
    name_ar: string;
    confidence: number;
    note: string;
  }>;
}

export interface MealAnalysisResponse {
  meal_name: string;
  confidence: number;
  needs_review: boolean;
  review_reason: string | null;
  estimated_weight_note: string;
  items: Array<{
    name: string;
    estimated_portion: string;
    calories: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
  }>;
  total_calories: number | null;
  total_protein_g: number | null;
  total_carbs_g: number | null;
  total_fat_g: number | null;
  advice_and_notes: string;
  alternatives_if_uncertain?: string[];
}

export interface ParsedExerciseItem {
  order: number;
  name_ar: string;
  name_en: string | null;
  sets: number | null;
  reps: string | number | null;
  weight: number | null;
  weight_unit: string | null;
  rest_seconds: number | null;
  rpe: number | null;
  rir: number | null;
  machine_name: string | null;
  machine_number: string | null;
  notes: string | null;
  confidence: number;
  needs_review: boolean;
}

export interface ParsedWorkoutDay {
  day_name: string;
  muscles: string[];
  exercises: ParsedExerciseItem[];
}

export interface ParsedWorkoutPlanResponse {
  needs_review: boolean;
  confidence: number;
  workout_plan: {
    name: string | null;
    days: ParsedWorkoutDay[];
  };
  warnings: string[];
}
