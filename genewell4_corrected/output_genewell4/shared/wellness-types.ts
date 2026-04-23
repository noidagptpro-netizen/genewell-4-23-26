export interface WellnessUserProfile {
  name: string;
  email: string;
  age: number;
  gender: string;
  heightCm: number;
  weightKg: number;
  bmi: number;
  bmr: number;
  tdee: number;
  calorieTarget?: number; // FIX: added — goal-adjusted calorie target (distinct from raw TDEE)
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  stressScore: number;
  sleepScore: number;
  activityScore: number;
  energyScore: number;
  medicalConditions: string[];
  digestiveIssues: string[];
  foodIntolerances: string[];
  skinConcerns: string[];
  dietaryPreference: string;
  exercisePreference: string[];
  exerciseIntensity: string;
  workSchedule: string;
  region: string;
  goals: string[];
  recommendedTests: string[];
  supplementPriority: string[];
  mealFrequency: number;
  dnaConsent: boolean;
  // Extended profile fields (computed from quiz data)
  sleepHours?: number;
  waterLiters?: number;
  waterIntake?: number;
  healthConditions?: string[];
  afternoonCrash?: boolean;
  estimatedTDEE?: number;
  activityMultiplier?: number;
  eatingOutFrequency?: string;
  city?: string;
  snoringOrApnea?: boolean;
  stressSymptoms?: string[];
  moodPatterns?: string[];
  cravings?: string[];
  hungerFrequency?: string;
  activityLevel?: string;
  // typed propagation of the user's actual wake-up window so
  // the Decision Engine can compute realistic wake/bed targets instead of
  // hardcoding "6:30am" and contradicting the user's reported routine.
  wakeUpTime?: "before-6" | "6-8" | "8-10" | "after-10" | string;
  // Phase 2 — merged signals from the 22-question quiz.
  energyPattern?: "consistent-high" | "afternoon-dip" | "morning-fog" | "evening-crash" | "always-tired" | string;
  gutSymptoms?: string[];
  // Phase 4 — Honesty Pass: carry the user's *actual* quiz inputs through
  // to the renderer so the PDF can show what they answered (e.g.
  // "4-6 glasses/day") instead of fabricated decimals (e.g. "1.25 L exact").
  // These are deliberately strings — the renderer must not re-derive
  // numeric scores from them and present those as measured data.
  inputs?: {
    hydrationLabel?: string;       // e.g. "4-6 glasses/day (~1.0–1.5 L)"
    hydrationLevel?: "low" | "below-target" | "on-track" | "high";
    stressLevelLabel?: string;     // e.g. "moderate (self-reported)"
    stressLevelBucket?: "minimal" | "low" | "moderate" | "very-high";
    sleepHoursLabel?: string;      // e.g. "5–6 hrs (target 7–8)"
    sleepLevel?: "very-low" | "low" | "on-target" | "high";
    mealsPerDayLabel?: string;     // e.g. "2 meals/day (recommended 3–5)"
    mealsLevel?: "too-few" | "below-recommended" | "adequate" | "good";
    energyPatternLabel?: string;   // e.g. "afternoon dip"
  };
}

export interface RuleEngineOutput {
  riskFlags: RiskFlag[];
  activeModules: string[];
  labTestPriority: PrioritizedLabTest[];
  narrativeHints: NarrativeHint[];
  severityProfile: {
    sleepSeverity: "normal" | "mild" | "moderate" | "severe";
    stressSeverity: "normal" | "mild" | "moderate" | "severe";
    weightRisk: "underweight" | "normal" | "overweight" | "obese";
    metabolicRisk: "low" | "moderate" | "high";
  };
}

export interface RiskFlag {
  category: string;
  severity: "low" | "moderate" | "high" | "critical";
  description: string;
  actionRequired: string;
}

export interface PrioritizedLabTest {
  name: string;
  priority: number;
  reason: string;
  estimatedCostINR: string;
  frequency: string;
}

export interface NarrativeHint {
  section: string;
  tone: string;
  focusAreas: string[];
  avoidTopics: string[];
}

export interface NarrativeOutput {
  executiveSummary: string;
  riskInterpretation: string;
  goalStrategy: string;
  sleepNarrative: string;
  stressNarrative: string;
  nutritionNarrative: string;
  movementNarrative: string;
  conditionNarratives: Record<string, string>;
}

export interface MealItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  portion: string;
}

export interface DayMeal {
  dayLabel: string;
  breakfast: MealItem[];
  midMorningSnack: MealItem[];
  lunch: MealItem[];
  eveningSnack: MealItem[];
  dinner: MealItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
}

export interface MealPlanOutput {
  days: DayMeal[];
  dailyTargetCalories: number;
  macroTargets: { protein: number; carbs: number; fats: number };
  dietaryNotes: string[];
}

export interface PDFDataBundle {
  profile: WellnessUserProfile;
  rules: RuleEngineOutput;
  narratives: NarrativeOutput;
  mealPlan: MealPlanOutput;
  tier: "free" | "essential" | "premium" | "coaching";
  addOns: string[];
  /**
   * Phase 3 — per-add-on scope keyed by add-on id. Optional and
   * forward-compatible: legacy bundles omit it. Renderers should
   * default sensibly when absent (e.g. Family bundle defaults to 2).
   */
  addOnScope?: Record<string, { familyMemberCount?: 2 | 4; labReviewCadence?: string; notes?: string }>;
  orderId: string;
  timestamp: string;
  adjustments?: string[];
}
