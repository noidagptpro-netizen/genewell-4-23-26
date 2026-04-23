/**
 * wellness-engine.ts
 * Computes the canonical WellnessEngineProfile from raw quiz data.
 * ALL downstream sections read from this object — nothing is recalculated elsewhere.
 * Ported from genewell_complete/src/engine/computeProfile.js
 */

import {
  ACTIVITY_MULTIPLIERS,
  GOAL_OFFSETS,
  PROTEIN_G_PER_KG,
  HYDRATION_ML_PER_KG,
  BMI_RANGES,
  CITY_CONTEXT,
  CityContext,
  scoreSleep,
  scoreHydration,
  scoreMealFrequency,
  scoreStress,
  scoreGutHealth,
  scoreSkinHealth,
} from "./wellness-constants";

export interface WellnessMacros {
  protein_g: number;
  fat_g: number;
  carb_g: number;
  protein_kcal: number;
  fat_kcal: number;
  carb_kcal: number;
}

export interface WellnessScores {
  sleep: number;
  hydration: number;
  meal_frequency: number;
  stress: number;
  gut_health: number;
  skin_health: number;
  overall: number;
}

export interface LimitingFactor {
  key: string;
  score: number;
  label: string;
}

export interface EatingWindow {
  first_meal_time: string;
  window_hours: number;
  last_meal_approx: string;
  is_time_restricted: boolean;
  overnight_fast_hrs: number;
}

export interface SleepAdvice {
  problem: string;
  advice: string;
}

export interface WellnessFlags {
  // Medical
  hasPCOS: boolean;
  hasThyroid: boolean;
  hasDiabetes: boolean;
  hasIBS: boolean;
  hasHypertension: boolean;
  hasAnxiety: boolean;
  hasCondition: boolean;
  // Medications
  onMetformin: boolean;
  onThyroidMeds: boolean;
  onContraceptives: boolean;
  onBloodThinners: boolean;
  onAntidepressants: boolean;
  onMedication: boolean;
  // Diet
  isVegetarian: boolean;
  isVegan: boolean;
  isNonVeg: boolean;
  eatsEggs: boolean;
  // Intolerances
  seafoodIntolerant: boolean;
  dairyIntolerant: boolean;
  glutenIntolerant: boolean;
  nutsIntolerant: boolean;
  eggsIntolerant: boolean;
  soyIntolerant: boolean;
  hasIntolerances: boolean;
  // Lifestyle
  earlyRiser: boolean;
  lateSleeper: boolean;
  flexibleSchedule: boolean;
  highStress: boolean;
  eatsOutOften: boolean;
  lowSleepHrs: boolean;
  hasExercisePref: boolean;
  prefersDance: boolean;
  prefersGym: boolean;
  prefersYoga: boolean;
  // Family history
  familyDiabetes: boolean;
  familyHeart: boolean;
  familyThyroid: boolean;
  familyCancer: boolean;
  // Current supplements
  takesMultivitamin: boolean;
  takesVitaminD: boolean;
  takesOmega3: boolean;
  takesIron: boolean;
  takesProtein: boolean;
  // Budget
  budgetLow: boolean;
  budgetMedium: boolean;
  budgetHigh: boolean;
  // DNA
  hasDNA: boolean;
  // Gender
  isFemale: boolean;
  // Menstrual status
  cycleAbsent: boolean;
  cycleIrregular: boolean;
  cycleRegular: boolean;
}

/**
 * The canonical engine profile — all section generators read from this only.
 */
export interface WellnessEngineProfile {
  // Identity
  name: string;
  age: number;
  gender: string;
  location: string;
  orderId: string;
  planTier: string;

  // Body metrics
  height_cm: number;
  weight_kg: number;
  bmi: number;
  bmiLabel: string;
  diet_type: string;

  // Metabolic (canonical)
  bmr: number;
  tdee: number;
  goalCalories: number;
  activityKey: string;
  activityMultiplier: number;
  goalKey: string;
  macros: WellnessMacros;
  waterTarget_L: number;

  // Scores
  scores: WellnessScores;
  limitingFactor: LimitingFactor;
  sortedDimensions: [string, number][];

  // Parsed arrays
  medical_conditions: string[];
  medications: string[];
  food_intolerances: string[];
  supplements_current: string[];
  digestive_issues: string[];
  skin_concerns: string[];
  mood_patterns: string[];
  exercise_pref: string[];
  family_history: string[];
  cravings: string[];

  // Boolean flags
  flags: WellnessFlags;

  // Context
  sleepSlot: string;
  sleepQuality: string;
  sleepAdvice: SleepAdvice;
  wakeSlot: string;
  bedSlot: string;
  eatingWindow: EatingWindow;
  cityContext: CityContext;
  stressRating: number;
  energyPattern: string;
  menstrualStatus: string;
  eatingOutFreq: string;
  budgetTier: string;
  dnaUpload: string;
}

// ── Helper functions ────────────────────────────────────────────────────────────

export function parseArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return (val as any[]).map((s: any) => String(s).toLowerCase().trim());
  if (typeof val === "string") {
    try {
      return JSON.parse(val).map((s: any) => String(s).toLowerCase().trim());
    } catch {
      return val.split(",").map((s) => s.toLowerCase().trim()).filter(Boolean);
    }
  }
  return [];
}

function normaliseActivityKey(raw: unknown): string {
  const map: Record<string, string> = {
    sedentary: "sedentary",
    lightly_active: "lightly_active", "lightly active": "lightly_active",
    moderately_active: "moderately_active", "moderately active": "moderately_active", "moderately-active": "moderately_active",
    very_active: "very_active", "very active": "very_active",
    athlete: "athlete",
  };
  return map[String(raw ?? "").toLowerCase()] ?? "moderately_active";
}

function normaliseGoalKey(raw: unknown): string {
  const map: Record<string, string> = {
    lose_fat: "lose_fat", "lose fat": "lose_fat", "weight loss": "lose_fat",
    build_muscle: "build_muscle", "build muscle": "build_muscle",
    maintain: "maintain", "maintain weight": "maintain",
    improve_energy: "improve_energy", "improve energy": "improve_energy",
    manage_condition: "manage_condition", "manage condition": "manage_condition",
  };
  return map[String(raw ?? "").toLowerCase()] ?? "maintain";
}

function normaliseSleepSlot(raw: unknown): string {
  const map: Record<string, string> = {
    under_5: "under_5", "under 5": "under_5", "< 5": "under_5",
    "5_6": "5_6", "5-6": "5_6", "5 to 6": "5_6",
    "6_7": "6_7", "6-7": "6_7",
    "7_8": "7_8", "7-8": "7_8",
    "8_plus": "8_plus", "8+": "8_plus", "over 8": "8_plus",
  };
  return map[String(raw ?? "").toLowerCase()] ?? "5_6";
}

function parseMealTimeHour(slot: string): number {
  const map: Record<string, number> = { before_8am: 7, "8_10am": 9, "10am_12pm": 11, after_12pm: 13 };
  return map[slot] ?? 9;
}

function formatHour(h: number): string {
  const hour = h % 24;
  if (hour === 0) return "12:00 AM";
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return "12:00 PM";
  return `${hour - 12}:00 PM`;
}

function getSleepWindowAdvice(wakeSlot: string, bedSlot: string, sleepSlot: string): SleepAdvice {
  const earlyWake = ["before_5am", "5_6am"].includes(wakeSlot);
  const lateBed = ["after_12am", "12am_1am"].includes(bedSlot);
  const shortSleep = ["under_5", "5_6"].includes(sleepSlot);

  if (earlyWake && lateBed) {
    return {
      problem: "late_bedtime",
      advice: "Your wake time is optimal — it's your bedtime that needs fixing. Target: in bed by 10:30 PM. Do not push your wake time later — it's your circadian anchor.",
    };
  }
  if (!earlyWake && lateBed) {
    return {
      problem: "delayed_phase",
      advice: "Both sleep and wake times are shifted late — delayed sleep phase pattern. Advance bedtime by 15 minutes every 3 days. Add 10 min of morning outdoor light (before 9 AM) to reset your circadian rhythm.",
    };
  }
  if (earlyWake && !lateBed && !shortSleep) {
    return {
      problem: "none",
      advice: "Your sleep timing is well-structured. Focus on sleep quality: dark, cool room (18–20°C), no screens 60 min before bed.",
    };
  }
  if (!shortSleep) {
    return {
      problem: "quality",
      advice: "Your sleep duration is adequate — focus on quality. Ensure your room is dark, cool (18–20°C), and screen-free 60 min before bed. Magnesium bisglycinate can deepen sleep architecture.",
    };
  }
  return {
    problem: "duration",
    advice: "Your sleep is below the recommended 7–8 hours. Prioritise an earlier bedtime — even 30 minutes earlier makes a measurable difference in cortisol and energy.",
  };
}

/**
 * Main entry point. Takes raw quiz data and returns a fully computed wellness engine profile.
 * @param quiz - Raw quiz data (from database or API)
 */
export function computeWellnessProfile(quiz: Record<string, any>): WellnessEngineProfile {
  const age = parseInt(quiz.age) || 25;
  const weight = parseFloat(quiz.weight_kg) || 60;
  const height = parseFloat(quiz.height_cm) || 160;
  const gender = (quiz.gender || "female").toLowerCase();

  // ── Metabolic calculations (Mifflin-St Jeor) ──────────────────────────────
  const bmr = gender === "female"
    ? (10 * weight) + (6.25 * height) - (5 * age) - 161
    : (10 * weight) + (6.25 * height) - (5 * age) + 5;

  const activityKey = normaliseActivityKey(quiz.activity_level);
  const multiplier = ACTIVITY_MULTIPLIERS[activityKey] ?? 1.55;
  const tdee = Math.round(bmr * multiplier);

  const goalKey = normaliseGoalKey(quiz.weight_goal);
  const offset = GOAL_OFFSETS[goalKey] ?? 100;
  const goalCalories = Math.round(tdee + offset);

  const bmi = Math.round((weight / Math.pow(height / 100, 2)) * 10) / 10;

  // Canonical macros
  const protein_g = Math.round(weight * PROTEIN_G_PER_KG);
  const protein_kcal = protein_g * 4;
  const fat_kcal = Math.round(goalCalories * 0.30);
  const fat_g = Math.round(fat_kcal / 9);
  const carb_kcal = goalCalories - protein_kcal - fat_kcal;
  const carb_g = Math.round(carb_kcal / 4);

  const waterTarget_L = parseFloat((weight * HYDRATION_ML_PER_KG / 1000).toFixed(1));

  // ── Parse multi-value fields ───────────────────────────────────────────────
  const medical_conditions = parseArray(quiz.medical_conditions);
  const medications        = parseArray(quiz.medications);
  const food_intolerances  = parseArray(quiz.food_intolerances);
  const supplements_current = parseArray(quiz.supplements_current);
  const digestive_issues   = parseArray(quiz.digestive_issues);
  const skin_concerns      = parseArray(quiz.skin_concerns);
  const mood_patterns      = parseArray(quiz.mood_patterns);
  const exercise_pref      = parseArray(quiz.exercise_pref);
  const family_history     = parseArray(quiz.family_history);
  const cravings           = parseArray(quiz.cravings);

  // ── Health dimension scores ────────────────────────────────────────────────
  const sleepSlot   = normaliseSleepSlot(quiz.sleep_hrs);
  const sleepQuality = quiz.sleep_quality || "fair";
  const dimensionScores = {
    sleep:          scoreSleep(sleepSlot, sleepQuality),
    hydration:      scoreHydration(quiz.hydration_glasses, weight),
    meal_frequency: scoreMealFrequency(parseInt(quiz.meals_per_day) || 2),
    stress:         scoreStress(parseInt(quiz.stress_rating) || 3),
    gut_health:     scoreGutHealth(digestive_issues),
    skin_health:    scoreSkinHealth(skin_concerns),
  };
  const overall = Math.round(
    Object.values(dimensionScores).reduce((a, b) => a + b, 0) / Object.keys(dimensionScores).length
  );
  const scores: WellnessScores = { ...dimensionScores, overall };

  const dimensionLabels: Record<string, string> = {
    sleep: "Sleep", hydration: "Hydration", meal_frequency: "Meal frequency",
    stress: "Stress management", gut_health: "Gut health", skin_health: "Skin health",
  };
  const sortedDimensions = Object.entries(dimensionScores).sort(([, a], [, b]) => a - b) as [string, number][];
  const limitingFactor: LimitingFactor = {
    key: sortedDimensions[0][0],
    score: sortedDimensions[0][1],
    label: dimensionLabels[sortedDimensions[0][0]],
  };

  // ── Boolean flags ──────────────────────────────────────────────────────────
  const flags: WellnessFlags = {
    hasPCOS:        medical_conditions.includes("pcos"),
    hasThyroid:     medical_conditions.includes("thyroid"),
    hasDiabetes:    medical_conditions.includes("diabetes"),
    hasIBS:         medical_conditions.includes("ibs"),
    hasHypertension: medical_conditions.includes("hypertension"),
    hasAnxiety:     medical_conditions.includes("anxiety") || medical_conditions.includes("depression"),
    hasCondition:   medical_conditions.length > 0 && !medical_conditions.includes("none"),
    onMetformin:    medications.includes("metformin"),
    onThyroidMeds:  medications.includes("thyroid_meds"),
    onContraceptives: medications.includes("contraceptives"),
    onBloodThinners:  medications.includes("blood_thinners"),
    onAntidepressants: medications.includes("antidepressants"),
    onMedication:   medications.length > 0 && !medications.includes("none"),
    isVegetarian:   ["vegetarian", "vegan", "eggetarian"].includes(quiz.diet_type),
    isVegan:        quiz.diet_type === "vegan",
    isNonVeg:       quiz.diet_type === "non_vegetarian",
    eatsEggs:       quiz.diet_type !== "vegan" && !["vegetarian"].includes(quiz.diet_type),
    seafoodIntolerant: food_intolerances.includes("seafood"),
    dairyIntolerant:   food_intolerances.includes("dairy"),
    glutenIntolerant:  food_intolerances.includes("gluten"),
    nutsIntolerant:    food_intolerances.includes("nuts"),
    eggsIntolerant:    food_intolerances.includes("eggs"),
    soyIntolerant:     food_intolerances.includes("soy"),
    hasIntolerances:   food_intolerances.length > 0 && !food_intolerances.includes("none"),
    earlyRiser:     ["before_5am", "5_6am"].includes(quiz.wake_time_slot),
    lateSleeper:    quiz.bed_time_slot === "after_12am",
    flexibleSchedule: quiz.work_schedule === "flexible" || quiz.work_schedule === "freelance",
    highStress:     parseInt(quiz.stress_rating) >= 4,
    eatsOutOften:   ["often", "almost_always"].includes(quiz.eating_out_freq),
    lowSleepHrs:    ["under_5", "5_6"].includes(sleepSlot),
    hasExercisePref: exercise_pref.length > 0 && !exercise_pref.includes("none"),
    prefersDance:   exercise_pref.includes("dance"),
    prefersGym:     exercise_pref.includes("gym"),
    prefersYoga:    exercise_pref.includes("yoga"),
    familyDiabetes: family_history.includes("diabetes"),
    familyHeart:    family_history.includes("heart_disease"),
    familyThyroid:  family_history.includes("thyroid"),
    familyCancer:   family_history.includes("cancer"),
    takesMultivitamin: supplements_current.includes("multivitamin"),
    takesVitaminD:     supplements_current.includes("vitamin_d"),
    takesOmega3:       supplements_current.includes("omega3"),
    takesIron:         supplements_current.includes("iron"),
    takesProtein:      supplements_current.includes("protein_powder"),
    budgetLow:    quiz.budget_tier === "under_500",
    budgetMedium: quiz.budget_tier === "500_1500",
    budgetHigh:   ["1500_3000", "3000_plus"].includes(quiz.budget_tier),
    hasDNA: quiz.dna_upload === "have_not_uploaded",
    isFemale: gender === "female",
    cycleAbsent:    quiz.menstrual_status === "absent",
    cycleIrregular: quiz.menstrual_status === "irregular",
    cycleRegular:   quiz.menstrual_status === "regular",
  };

  // ── Eating window ──────────────────────────────────────────────────────────
  const firstMealHour = parseMealTimeHour(quiz.first_meal_time);
  const mealsPerDay   = parseInt(quiz.meals_per_day) || 2;
  const estWindowHrs  = mealsPerDay <= 2 ? 8 : mealsPerDay === 3 ? 10 : 12;
  const lastMealHour  = firstMealHour + estWindowHrs;
  const eatingWindow: EatingWindow = {
    first_meal_time: quiz.first_meal_time,
    window_hours:    estWindowHrs,
    last_meal_approx: formatHour(lastMealHour),
    is_time_restricted: estWindowHrs <= 10,
    overnight_fast_hrs: 24 - estWindowHrs,
  };

  // ── City context ───────────────────────────────────────────────────────────
  const city = (quiz.location || "").toLowerCase();
  const cityContext = CITY_CONTEXT[city] ?? CITY_CONTEXT["default"];

  // ── Wake/bed & BMI ─────────────────────────────────────────────────────────
  const wakeSlot = quiz.wake_time_slot || "6_7am";
  const bedSlot  = quiz.bed_time_slot  || "10_11pm";
  const sleepAdvice = getSleepWindowAdvice(wakeSlot, bedSlot, sleepSlot);

  let bmiLabel = BMI_RANGES.normal.label;
  if (bmi < 18.5) bmiLabel = BMI_RANGES.underweight.label;
  else if (bmi >= 30) bmiLabel = BMI_RANGES.obese.label;
  else if (bmi >= 25) bmiLabel = BMI_RANGES.overweight.label;

  return {
    name:   quiz.name || "User",
    age,
    gender,
    location: quiz.location || "India",
    orderId: quiz.order_id || "",
    planTier: quiz.plan_tier || "pro",

    height_cm: height,
    weight_kg: weight,
    bmi,
    bmiLabel,
    diet_type: quiz.diet_type || "non_vegetarian",

    bmr:          Math.round(bmr),
    tdee,
    goalCalories,
    activityKey,
    activityMultiplier: multiplier,
    goalKey,
    macros: { protein_g, fat_g, carb_g, protein_kcal, fat_kcal, carb_kcal },
    waterTarget_L,

    scores,
    limitingFactor,
    sortedDimensions,

    medical_conditions,
    medications,
    food_intolerances,
    supplements_current,
    digestive_issues,
    skin_concerns,
    mood_patterns,
    exercise_pref,
    family_history,
    cravings,

    flags,

    sleepSlot,
    sleepQuality,
    sleepAdvice,
    wakeSlot,
    bedSlot,
    eatingWindow,
    cityContext,
    stressRating: parseInt(quiz.stress_rating) || 3,
    energyPattern: quiz.energy_pattern || "afternoon_crash",
    menstrualStatus: quiz.menstrual_status || "regular",
    eatingOutFreq: quiz.eating_out_freq || "sometimes",
    budgetTier: quiz.budget_tier || "500_1500",
    dnaUpload: quiz.dna_upload || "none",
  };
}
