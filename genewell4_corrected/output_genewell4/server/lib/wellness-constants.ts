/**
 * wellness-constants.ts
 * Single source of truth for all scientific constants used by the wellness engine.
 * Ported from genewell_complete/src/engine/constants.js
 * All sections reference this file — never hardcode values in section generators.
 */

// ─── Activity multipliers (Mifflin-St Jeor validated) ────────────────────────
export const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  athlete: 1.9,
};

// ─── Goal calorie offsets from TDEE ──────────────────────────────────────────
export const GOAL_OFFSETS: Record<string, number> = {
  lose_fat: -400,
  build_muscle: 300,
  maintain: 100,
  improve_energy: 150,
  manage_condition: 50,
};

// ─── Protein targets: 1.6g/kg (Academy of Nutrition & Dietetics consensus) ───
export const PROTEIN_G_PER_KG = 1.6;

// ─── Hydration: WHO recommendation 35ml/kg body weight ───────────────────────
export const HYDRATION_ML_PER_KG = 35;

// ─── BMI classification ───────────────────────────────────────────────────────
export const BMI_RANGES = {
  underweight: { max: 18.5, label: "Underweight" },
  normal: { min: 18.5, max: 24.9, label: "Healthy range" },
  overweight: { min: 25.0, max: 29.9, label: "Slightly above healthy range" },
  obese: { min: 30.0, label: "Above healthy range" },
};

// ─── Supplement evidence tiers ────────────────────────────────────────────────
export const SUPPLEMENT_EVIDENCE_TIERS: Record<string, { tier: number; evidence: string }> = {
  myo_inositol: { tier: 1, evidence: "Multiple RCTs for PCOS insulin sensitivity (JCEM 2022)" },
  vitamin_d3: { tier: 1, evidence: "Extensive RCT data; >70% Indians deficient (ICMR 2021)" },
  magnesium_bisglycinate: { tier: 1, evidence: "RCTs for sleep quality, PMS reduction (BJOG 2020)" },
  omega3_epa_dha: { tier: 1, evidence: "Cochrane meta-analysis; anti-inflammatory, brain health" },
  ashwagandha_ksm66: { tier: 2, evidence: "24 clinical trials (KSM-66 extract); cortisol -23%" },
  zinc: { tier: 2, evidence: "Human trials for immune function, wound healing, hormones" },
  vitamin_b12: { tier: 1, evidence: "Essential; deficiency causes neurological damage (WHO)" },
  curcumin_piperine: { tier: 2, evidence: "Anti-inflammatory; piperine increases absorption 2000%" },
  probiotics: { tier: 2, evidence: "Strain-dependent; Lactobacillus rhamnosus best studied" },
  spearmint_tea: { tier: 3, evidence: "Reduces free testosterone 30% (Phytotherapy Research)" },
  berberine: { tier: 2, evidence: "Insulin sensitizer; comparable to Metformin in some trials" },
  algae_oil: { tier: 1, evidence: "EPA+DHA equivalent to fish oil; suitable for seafood intolerant" },
  iron_bisglycinate: { tier: 1, evidence: "Superior absorption vs. ferrous sulfate; no constipation" },
  vitamin_b6_p5p: { tier: 2, evidence: "Active form; PMS mood support (Cochrane 2016)" },
  coq10: { tier: 2, evidence: "Mitochondrial energy; ovarian reserve support" },
  l_theanine: { tier: 2, evidence: "Alpha wave induction; anxiolytic without sedation" },
};

// ─── Medication × Supplement interaction matrix ───────────────────────────────
export type MedInteractionAction = "include" | "reduce_dose" | "exclude" | "doctor_first" | "flag_depletion";

export interface MedInteraction {
  action: MedInteractionAction;
  note: string;
}

export const MEDICATION_INTERACTIONS: Record<string, Record<string, MedInteraction>> = {
  metformin: {
    vitamin_b12: {
      action: "flag_depletion",
      note: "Metformin depletes B12 — test levels before supplementing. Methylcobalamin preferred form.",
    },
    myo_inositol: {
      action: "doctor_first",
      note: "Additive insulin-sensitizing effect. May need Metformin dose adjustment.",
    },
  },
  thyroid_meds: {
    ashwagandha_ksm66: {
      action: "exclude",
      note: "Ashwagandha modulates thyroid hormone — contraindicated with thyroid medications. Replaced with Rhodiola Rosea.",
    },
    zinc: {
      action: "doctor_first",
      note: "May affect thyroid hormone absorption. Take 4 hours apart from medication.",
    },
  },
  blood_thinners: {
    omega3_epa_dha: {
      action: "doctor_first",
      note: "Omega-3 has mild blood-thinning effect — can compound anticoagulant medications. Doctor supervision required.",
    },
    curcumin_piperine: {
      action: "doctor_first",
      note: "Curcumin has mild antiplatelet effect. Consult doctor.",
    },
  },
  contraceptives: {
    vitamin_b12: {
      action: "flag_depletion",
      note: "OCPs deplete B2, B6, B12, zinc, and magnesium. These are prioritised in your supplement stack.",
    },
    zinc: {
      action: "flag_depletion",
      note: "OCP depletes zinc. Supplementation particularly beneficial.",
    },
    magnesium_bisglycinate: {
      action: "flag_depletion",
      note: "OCP depletes magnesium. Supplementation particularly beneficial.",
    },
  },
  antidepressants: {
    ashwagandha_ksm66: {
      action: "doctor_first",
      note: "Ashwagandha may interact with SSRI/SNRI. Consult prescribing doctor.",
    },
    l_theanine: {
      action: "doctor_first",
      note: "L-Theanine has mild anxiolytic effect. May compound antidepressant action. Generally safe but doctor advised.",
    },
  },
};

// ─── Supplement stacking rules ────────────────────────────────────────────────
export const SUPPLEMENT_STACKING: Record<string, { synergistic: string[]; avoid_same_time: string[]; note: string }> = {
  magnesium_bisglycinate: {
    synergistic: ["vitamin_d3", "vitamin_b6_p5p"],
    avoid_same_time: ["zinc"],
    note: "Take Magnesium and Zinc at least 2 hours apart — they compete for absorption",
  },
  omega3_epa_dha: {
    synergistic: ["vitamin_d3", "vitamin_e", "coq10"],
    avoid_same_time: [],
    note: "Take with largest meal for best absorption and to reduce fishy burps",
  },
  curcumin_piperine: {
    synergistic: [],
    avoid_same_time: ["iron_bisglycinate"],
    note: "Take curcumin at least 2 hours apart from iron — piperine affects iron absorption",
  },
  ashwagandha_ksm66: {
    synergistic: ["magnesium_bisglycinate"],
    avoid_same_time: [],
    note: "Cycle 5 days on, 2 days off. Avoid if pregnant or breastfeeding.",
  },
};

// ─── Food intolerance ingredient map ─────────────────────────────────────────
export const INTOLERANCE_INGREDIENT_MAP: Record<string, string[]> = {
  seafood: ["fish", "salmon", "tuna", "mackerel", "sardine", "prawn", "shrimp", "crab", "shellfish", "anchovy", "fish oil", "cod liver"],
  dairy: ["milk", "paneer", "cheese", "curd", "yogurt", "ghee", "butter", "whey", "casein", "lactose"],
  gluten: ["wheat", "roti", "bread", "atta", "maida", "oats", "barley", "rye", "semolina"],
  nuts: ["walnut", "almond", "cashew", "pistachio", "peanut", "pecan", "hazelnut"],
  eggs: ["egg", "eggs", "egg white", "egg yolk"],
  soy: ["soy", "soya", "tofu", "tempeh", "edamame", "soy milk"],
};

// ─── Omega-3 alternatives ─────────────────────────────────────────────────────
export const OMEGA3_ALTERNATIVES = {
  seafood_intolerant: {
    food_sources: ["flaxseeds (ALA only — limited conversion)", "chia seeds", "walnuts", "hemp seeds"],
    supplement: "Algae oil EPA+DHA — clinically equivalent to fish oil, no seafood derivative",
    note: "Plant-based ALA converts poorly to EPA+DHA in humans (<5%). Algae oil is the scientifically validated alternative.",
  },
  standard: {
    food_sources: ["fatty fish (salmon, mackerel, sardines)", "flaxseeds", "walnuts"],
    supplement: "Fish oil EPA+DHA 1000-2000mg with largest meal",
  },
};

// ─── Indian city context ───────────────────────────────────────────────────────
export interface CityContext {
  lab_chains: string;
  supplement_stores: string;
  local_foods: string[];
  water_quality_note: string;
}

export const CITY_CONTEXT: Record<string, CityContext> = {
  default: {
    lab_chains: "Thyrocare, Dr. Lal PathLabs, SRL Diagnostics, Metropolis",
    supplement_stores: "Amazon India (amazon.in), HealthKart (healthkart.com), PharmEasy, 1mg, Netmeds",
    local_foods: ["turmeric milk (haldi doodh)", "coconut water", "amla", "moringa", "curry leaves", "fenugreek seeds"],
    water_quality_note: "Use filtered or boiled water for your daily hydration target.",
  },
  mumbai: {
    lab_chains: "Thyrocare (Navi Mumbai HQ), Dr. Lal PathLabs, Metropolis",
    supplement_stores: "Amazon India, HealthKart, GNC stores (Linking Road, Lower Parel)",
    local_foods: ["tender coconut water", "kokum sherbet", "sprouted moong", "fresh pomfret (if no seafood intolerance)"],
    water_quality_note: "Mumbai municipal water is treated — a water filter (RO+UV) is recommended.",
  },
  delhi: {
    lab_chains: "Dr. Lal PathLabs (headquartered here), Thyrocare, SRL",
    supplement_stores: "Amazon India, HealthKart, Organic India outlets",
    local_foods: ["sarson da saag", "makki di roti", "amla murabba", "gulkand"],
    water_quality_note: "Delhi groundwater has high TDS — RO filter strongly recommended.",
  },
  bangalore: {
    lab_chains: "Thyrocare, Neuberg Diagnostics, Manipal Hospitals labs",
    supplement_stores: "Amazon India, HealthKart, Nature's Basket",
    local_foods: ["ragi mudde", "horsegram rasam", "coconut-based curries"],
    water_quality_note: "Bangalore Cauvery water — standard filter recommended.",
  },
  hyderabad: {
    lab_chains: "Thyrocare, Apollo Diagnostics, Dr. Lal PathLabs",
    supplement_stores: "Amazon India, HealthKart, Noble Chemists",
    local_foods: ["bajra roti", "gongura", "tamarind-rich dishes (use in moderation for gut health)"],
    water_quality_note: "Hyderabad groundwater has high fluoride in some areas — RO filter recommended.",
  },
  pune: {
    lab_chains: "Thyrocare, Metropolis, Ruby Hall Clinic labs",
    supplement_stores: "Amazon India, HealthKart, Arogya shops in Deccan",
    local_foods: ["thalipeeth", "batata vada", "misal pav (gut-friendly: ask for less oil)"],
    water_quality_note: "Pune PMC water — standard filter recommended.",
  },
};

// ─── Scoring formulas ──────────────────────────────────────────────────────────
export function scoreSleep(sleep_hrs_slot: string, sleep_quality: string): number {
  const durationScores: Record<string, number> = {
    under_5: 30, "5_6": 55, "6_7": 75, "7_8": 95, "8_plus": 85,
  };
  const qualityAdjustments: Record<string, number> = { poor: -20, fair: -5, good: 0 };
  const base = durationScores[sleep_hrs_slot] ?? 50;
  const adj = qualityAdjustments[sleep_quality] ?? 0;
  return Math.max(10, Math.min(100, base + adj));
}

export function scoreHydration(glasses: string, weight_kg: number): number {
  const glass_ml = 250;
  const actual_ml = glassesMidpoint(glasses) * glass_ml;
  const target_ml = weight_kg * HYDRATION_ML_PER_KG;
  const ratio = actual_ml / target_ml;
  if (ratio >= 1.0) return 90;
  if (ratio >= 0.85) return 75;
  if (ratio >= 0.70) return 60;
  if (ratio >= 0.55) return 45;
  return 30;
}

function glassesMidpoint(slot: string): number {
  const map: Record<string, number> = { under_4: 3, "4_6": 5, "6_8": 7, "8_10": 9, "10_plus": 11 };
  return map[slot] ?? 6;
}

export function scoreMealFrequency(meals_per_day: number): number {
  const scores: Record<string, number> = { 1: 20, 2: 35, 3: 75, "4_plus": 90 };
  return scores[String(meals_per_day)] ?? 50;
}

export function scoreStress(stress_rating: number): number {
  // stress_rating 1–5 where 1=very low, 5=very high
  const scores: Record<number, number> = { 1: 90, 2: 75, 3: 55, 4: 35, 5: 20 };
  return scores[stress_rating] ?? 50;
}

export function scoreGutHealth(digestive_issues: string[]): number {
  if (!digestive_issues || digestive_issues.length === 0 || digestive_issues.includes("none")) return 85;
  let score = 85;
  if (digestive_issues.includes("loose_stools")) score -= 25;
  if (digestive_issues.includes("constipation")) score -= 20;
  if (digestive_issues.includes("bloating")) score -= 15;
  if (digestive_issues.includes("acid_reflux")) score -= 20;
  if (digestive_issues.includes("gas")) score -= 10;
  return Math.max(10, score);
}

export function scoreSkinHealth(skin_concerns: string[]): number {
  if (!skin_concerns || skin_concerns.length === 0 || skin_concerns.includes("none")) return 90;
  let score = 90;
  if (skin_concerns.includes("acne")) score -= 25;
  if (skin_concerns.includes("dryness")) score -= 15;
  if (skin_concerns.includes("hair_fall")) score -= 20;
  if (skin_concerns.includes("dullness")) score -= 10;
  if (skin_concerns.includes("pigmentation")) score -= 10;
  return Math.max(10, score);
}
