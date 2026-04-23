/**
 * Decision engine — pure function from profile + raw quiz data to a
 * variant id per personalized PDF section, plus a candidate supplement list.
 *
 * Keep this file free of jsPDF / DOM / network code so it can be unit-tested
 * and run in the persona-verification script.
 */

import type { WellnessUserProfile } from "./wellness-types";
import type { SectionId } from "./content-blocks";
import {
  applyContraindications,
  type FilteredSupplements,
} from "./contraindications";

export interface SectionDecisions {
  variants: Record<SectionId, string>;
  supplementCandidateIds: string[];
  supplementResult: FilteredSupplements;
}

function hasCondition(profile: WellnessUserProfile, pattern: RegExp): boolean {
  return (profile.medicalConditions || []).some(c => pattern.test(c));
}

function hasIntolerance(profile: WellnessUserProfile, pattern: RegExp): boolean {
  return (profile.foodIntolerances || []).some(i => pattern.test(i));
}

function pickNutritionVariant(profile: WellnessUserProfile): string {
  if (hasCondition(profile, /pcos/i)) return "pcos_insulin";
  if (hasCondition(profile, /thyroid/i)) return "thyroid_focus";
  const goals = (profile.goals || []).join(",").toLowerCase();
  if (/lose|fat/.test(goals)) return "weightloss_default";
  if (/gain|muscle|build/.test(goals)) return "musclegain_default";
  return "maintenance_default";
}

function pickSleepVariant(profile: WellnessUserProfile): string {
  const score = profile.sleepScore ?? 70;
  const hrs = profile.sleepHours ?? 7;
  if (score < 55 || hrs < 6) return "severe_disruption";
  if (score < 75) return "moderate_improvable";
  return "healthy_maintain";
}

function pickStressVariant(profile: WellnessUserProfile): string {
  const score = profile.stressScore ?? 50;
  if (score >= 75) return "high_burnout_risk";
  if (score >= 45) return "moderate_buffering";
  return "low_maintain";
}

/**
 * Phase 2 — gut signal source-of-truth is `digestiveIssues` (already merged
 * by quiz-analysis.ts), but we union with `gutSymptoms` so callers that
 * bypass quiz-analysis (e.g. raw quiz payloads passed straight in) still
 * get correct routing.
 */
function gutSignal(profile: WellnessUserProfile): string[] {
  const merged = new Set<string>([
    ...(profile.digestiveIssues || []),
    ...(profile.gutSymptoms || []),
  ]);
  merged.delete("none");
  return Array.from(merged);
}

function pickSupplementVariant(profile: WellnessUserProfile): string {
  if (hasCondition(profile, /pcos|thyroid/i)) return "condition_specific";
  if ((profile.sleepScore ?? 70) < 65 || (profile.stressScore ?? 50) > 60 ||
      gutSignal(profile).length > 0) {
    return "foundation_plus_targeted";
  }
  return "foundation_only";
}

function pickGutVariant(profile: WellnessUserProfile): string {
  const issues = gutSignal(profile).map(d => d.toLowerCase());
  if (issues.some(i => /constip/i.test(i))) return "constipation_focus";
  if (issues.some(i => /bloat|gas/i.test(i))) return "bloating_focus";
  if (issues.some(i => /acid|reflux|heartburn/i.test(i))) return "acidity_focus";
  return "no_issues";
}

function pickSkinVariant(profile: WellnessUserProfile): string {
  const skin = (profile.skinConcerns || []).map(s => s.toLowerCase());
  if (skin.some(s => /acne|oili/i.test(s))) return "acne_focus";
  if (skin.some(s => /pigment|aging/i.test(s))) return "pigmentation_focus";
  if (skin.some(s => /dry/i.test(s))) return "dryness_focus";
  return "none";
}

function pickMealTiming(profile: WellnessUserProfile): string {
  const wake = (profile.wakeUpTime || "6-8").toLowerCase();
  if (wake === "before-6") return "early_riser";
  if (wake === "8-10" || wake === "after-10") return "late_riser";
  return "standard";
}

function pickMovementBias(profile: WellnessUserProfile): string {
  const prefs = (profile.exercisePreference || []).map(p => p.toLowerCase());
  if (prefs.includes("none")) return "starter";
  if (prefs.some(p => /strength|weights|lift/i.test(p))) return "strength_first";
  if (prefs.some(p => /cardio|run|cycle/i.test(p))) return "cardio_first";
  if (prefs.some(p => /yoga|walk|pilates/i.test(p))) return "yoga_walk";
  return "yoga_walk";
}

function pickWomensHormonal(profile: WellnessUserProfile): string {
  if (profile.gender !== "female") return "standard_cycle";
  if (hasCondition(profile, /pcos/i)) return "pcos";
  if (profile.age >= 40) return "perimenopausal";
  return "standard_cycle";
}

function pickAddonDnaIntro(profile: WellnessUserProfile): string {
  const sleep = profile.sleepScore ?? 70;
  if (sleep < 65) return "low_sleep_fast_caffeine";
  const bmi = profile.bmi ?? 0;
  if (bmi >= 25) return "overweight_fto_focus";
  return "general_balance";
}

function pickAddonSupplementIntro(profile: WellnessUserProfile): string {
  if (hasCondition(profile, /thyroid/i)) return "thyroid_priority";
  if ((profile.stressScore ?? 50) > 60) return "high_stress_phased";
  return "default_phased";
}

function pickAddonAthleteIntro(profile: WellnessUserProfile): string {
  const prefs = (profile.exercisePreference || []).map(p => p.toLowerCase());
  if (prefs.some(p => /cardio|run|cycle|swim/i.test(p))) return "endurance_bias";
  if (prefs.some(p => /strength|weights|lift/i.test(p))) return "strength_bias";
  return "general_athlete";
}

function pickAddonFamilyIntro(_profile: WellnessUserProfile, planAddons?: string[]): string {
  if (planAddons?.includes("addon_family_4")) return "family_4_focus";
  if (planAddons?.includes("addon_family_2")) return "family_2_focus";
  return "family_default";
}

function pickAddonWomenHormoneIntro(profile: WellnessUserProfile): string {
  if (hasCondition(profile, /pcos/i)) return "pcos";
  if (hasCondition(profile, /thyroid/i)) return "thyroid";
  if (profile.gender === "female" && profile.age >= 40) return "perimenopausal";
  return "standard_cycle";
}

function pickAddonMenFitnessIntro(profile: WellnessUserProfile): string {
  if ((profile.sleepScore ?? 70) < 65) return "low_sleep_t_risk";
  if ((profile.bmi ?? 0) >= 25) return "overweight_recomp";
  return "fit_optimize";
}

/**
 * Standard quarterly lab panels with profile-driven status.
 * Pure function — no DOM / PDF deps so the persona verifier can call it.
 *
 * Status semantics:
 *   - "good"    → on-track, no action needed this quarter
 *   - "watch"   → trending; tighten habits and re-check next quarter
 *   - "act_now" → out of range or condition-triggered; concrete next step
 */
export type LabPanelStatus = "good" | "watch" | "act_now";

export interface LabPanelRow {
  panel: string;
  marker: string;
  reference: string;
  status: LabPanelStatus;
  rationale: string;
  action: string;
}

export function buildLabInterpretationGrid(profile: WellnessUserProfile): LabPanelRow[] {
  const conditions = (profile.medicalConditions || []).map(c => c.toLowerCase());
  const has = (re: RegExp) => conditions.some(c => re.test(c));
  const goals = (profile.goals || []).join(",").toLowerCase();
  const dp = (profile.dietaryPreference || "").toLowerCase();
  const isVeg = /(veg|vegan|eggetarian)/.test(dp) && !/non.?veg/.test(dp);
  const isFemale = (profile.gender || "").toLowerCase() === "female";
  const age = profile.age ?? 30;
  const bmi = profile.bmi ?? (profile.weightKg && profile.heightCm
    ? profile.weightKg / Math.pow(profile.heightCm / 100, 2)
    : 22);
  const stress = profile.stressScore ?? 50;
  const sleep = profile.sleepScore ?? 70;
  const wantsLoss = /lose|fat|weight/.test(goals);

  const rows: LabPanelRow[] = [];

  // CBC — anemia / iron-deficiency lens
  rows.push((() => {
    if (isFemale && isVeg && age < 50) return {
      panel: "CBC", marker: "Hemoglobin · MCV · RDW",
      reference: "Hb 12.0–15.5 g/dL · MCV 80–100 fL",
      status: "act_now" as LabPanelStatus,
      rationale: "Vegetarian female of menstruating age — iron-deficiency anemia is the highest-prevalence finding in this group.",
      action: "Order CBC + ferritin together this quarter; if Hb < 12 or MCV < 80, start iron bisglycinate 25 mg with vitamin-C-rich meal and recheck at week 12.",
    };
    if (has(/pregnancy/)) return {
      panel: "CBC", marker: "Hemoglobin",
      reference: "Hb ≥ 11.0 g/dL (pregnancy)",
      status: "act_now",
      rationale: "Pregnancy raises plasma volume and iron demand.",
      action: "CBC + ferritin every trimester; coordinate iron dose with your obstetrician.",
    };
    return {
      panel: "CBC", marker: "Hemoglobin · WBC · Platelets",
      reference: "Hb 13.0–17.0 g/dL (M) · 12.0–15.5 g/dL (F)",
      status: "good",
      rationale: "No anemia drivers in your profile.",
      action: "Routine CBC once this quarter as a baseline. No supplement change needed.",
    };
  })());

  // Comprehensive Metabolic Panel
  rows.push((() => {
    if (has(/diabetes|ckd|kidney/)) return {
      panel: "Metabolic", marker: "Fasting glucose · Creatinine · eGFR",
      reference: "FPG 70–99 mg/dL · eGFR ≥ 90",
      status: "act_now" as LabPanelStatus,
      rationale: "Existing diabetes / kidney condition means renal markers must be tracked every quarter.",
      action: "Run CMP + urine ACR this quarter. Share results with your physician before any supplement or training intensity change.",
    };
    if (bmi >= 27 || wantsLoss) return {
      panel: "Metabolic", marker: "Fasting glucose · ALT · Creatinine",
      reference: "FPG 70–99 mg/dL · ALT < 40 U/L",
      status: "watch",
      rationale: `BMI ${bmi.toFixed(1)} or fat-loss goal — early metabolic strain shows up here first (fasting glucose creep, ALT rise).`,
      action: "If FPG > 100 or ALT > 40, tighten meal-window to 10 hours and add 10-min post-meal walks; recheck in 12 weeks.",
    };
    return {
      panel: "Metabolic", marker: "Fasting glucose · ALT · Creatinine",
      reference: "FPG 70–99 mg/dL · ALT < 40 U/L",
      status: "good",
      rationale: "No metabolic-syndrome flags in your profile.",
      action: "Annual CMP is sufficient unless symptoms change.",
    };
  })());

  // Lipid panel
  rows.push((() => {
    if (has(/cardio|hypertension|cholesterol|stroke/)) return {
      panel: "Lipids", marker: "LDL-C · HDL-C · Triglycerides · ApoB",
      reference: "LDL < 100 · HDL ≥ 40 (M)/50 (F) · TG < 150",
      status: "act_now" as LabPanelStatus,
      rationale: "Cardiovascular history in your profile means lipid drift drives medication decisions, not just lifestyle ones.",
      action: "Add ApoB to the standard panel this quarter; loop in your cardiologist before any new supplement.",
    };
    if (bmi >= 27 || stress > 65) return {
      panel: "Lipids", marker: "LDL-C · HDL-C · Triglycerides",
      reference: "LDL < 130 · HDL ≥ 40 (M)/50 (F) · TG < 150",
      status: "watch",
      rationale: `BMI ${bmi.toFixed(1)} and stress ${stress}/100 — both push triglycerides and lower HDL.`,
      action: "If TG > 150 or HDL is low, run an 8-week trial: cut refined oils + added sugar, add 150 min/wk Zone-2 cardio, then retest.",
    };
    return {
      panel: "Lipids", marker: "LDL-C · HDL-C · Triglycerides",
      reference: "LDL < 130 · HDL ≥ 40 (M)/50 (F) · TG < 150",
      status: "good",
      rationale: "No cardiovascular risk amplifiers in your profile.",
      action: "Lipid panel once this quarter as baseline; recheck only if values drift.",
    };
  })());

  // Thyroid
  rows.push((() => {
    if (has(/thyroid|hashimoto|graves/)) return {
      panel: "Thyroid", marker: "TSH · Free T3 · Free T4 · Anti-TPO",
      reference: "TSH 0.5–4.5 µIU/mL · FT3 / FT4 mid-range",
      status: "act_now" as LabPanelStatus,
      rationale: "Existing thyroid condition — every quarter must include the full panel, not just TSH.",
      action: "If TSH > 4.5 or FT3 low with normal FT4, escalate to your endocrinologist before adding ashwagandha or iodine.",
    };
    if (isFemale && age >= 35) return {
      panel: "Thyroid", marker: "TSH · Free T4",
      reference: "TSH 0.5–4.5 µIU/mL",
      status: "watch",
      rationale: "Female ≥ 35 — subclinical hypothyroidism prevalence rises sharply.",
      action: "If TSH 2.5–4.5 with fatigue or hair-loss symptoms, add Free T4 and anti-TPO next cycle.",
    };
    return {
      panel: "Thyroid", marker: "TSH",
      reference: "TSH 0.5–4.5 µIU/mL",
      status: "good",
      rationale: "No thyroid risk markers in your profile.",
      action: "Annual TSH is sufficient unless symptoms develop.",
    };
  })());

  // Iron / Ferritin
  rows.push((() => {
    if (isFemale && isVeg && age < 50) return {
      panel: "Iron", marker: "Ferritin · Transferrin sat · TIBC",
      reference: "Ferritin 40–150 ng/mL",
      status: "act_now" as LabPanelStatus,
      rationale: "Vegetarian menstruating female — ferritin < 30 ng/mL is the most likely fatigue driver.",
      action: "If ferritin < 30, start iron bisglycinate 25 mg with vitamin-C source; recheck at week 12 before going higher.",
    };
    if (isVeg || (isFemale && age < 50)) return {
      panel: "Iron", marker: "Ferritin",
      reference: "Ferritin 40–150 ng/mL",
      status: "watch",
      rationale: "Diet pattern or age range raises iron-deficiency risk over the year.",
      action: "Bundle ferritin with the next CBC. Pair iron-rich meals with vitamin C; avoid tea/coffee within 1 hour.",
    };
    return {
      panel: "Iron", marker: "Ferritin",
      reference: "Ferritin 40–300 ng/mL (M) · 40–150 ng/mL (F)",
      status: "good",
      rationale: "No iron-deficiency drivers in your profile.",
      action: "Recheck only if you donate blood, change diet, or develop fatigue.",
    };
  })());

  // 25-OH Vitamin D
  rows.push((() => {
    if (sleep < 60 || stress > 65 || has(/pcos|thyroid|depression/)) return {
      panel: "Vitamin D", marker: "25-OH Vitamin D",
      reference: "Optimal 40–60 ng/mL · Deficient < 30",
      status: "act_now" as LabPanelStatus,
      rationale: "Sleep/stress/condition profile — low 25-OH D worsens all three.",
      action: "If < 30 ng/mL, loading dose 60,000 IU/week × 8 weeks then 2,000 IU daily. Retest at week 12.",
    };
    return {
      panel: "Vitamin D", marker: "25-OH Vitamin D",
      reference: "Optimal 40–60 ng/mL",
      status: "watch",
      rationale: "Indian baseline deficiency exceeds 70% — treat as a default-watch marker.",
      action: "Test once this quarter; if 30–40 ng/mL, maintenance 2,000 IU daily and recheck in 6 months.",
    };
  })());

  // HbA1c
  rows.push((() => {
    if (has(/diabetes/) || (has(/pcos/) && bmi >= 25)) return {
      panel: "HbA1c", marker: "Glycated hemoglobin",
      reference: "Optimal < 5.7% · Pre-diabetes 5.7–6.4%",
      status: "act_now" as LabPanelStatus,
      rationale: "Diabetes history or PCOS + elevated BMI — quarterly HbA1c drives both diet and meds.",
      action: "If HbA1c ≥ 5.7%, tighten carb timing, add inositol (PCOS) or metformin discussion (diabetes), retest at week 12.",
    };
    if (bmi >= 27 || wantsLoss || has(/pcos/)) return {
      panel: "HbA1c", marker: "Glycated hemoglobin",
      reference: "Optimal < 5.7%",
      status: "watch",
      rationale: "Body composition or PCOS marker raises insulin-resistance risk over 90 days.",
      action: "If HbA1c 5.5–5.7%, add 8,000 daily steps and 10-min post-meal walks; retest in 12 weeks.",
    };
    return {
      panel: "HbA1c", marker: "Glycated hemoglobin",
      reference: "Optimal < 5.7%",
      status: "good",
      rationale: "No insulin-resistance markers in your profile.",
      action: "Annual HbA1c is sufficient unless body composition or symptoms change.",
    };
  })());

  return rows;
}

function pickAddonLabInterpretation(profile: WellnessUserProfile): string {
  if (hasCondition(profile, /pcos/i)) return "pcos_panel";
  if (hasCondition(profile, /thyroid/i)) return "thyroid_panel";
  const goals = (profile.goals || []).join(",").toLowerCase();
  if (/lose|fat|weight/.test(goals)) return "metabolic_panel";
  return "default_panel";
}

function buildSupplementCandidates(profile: WellnessUserProfile): string[] {
  const c: string[] = [];
  // Foundation
  c.push("vitamin_d3", "magnesium_bisglycinate");
  // Omega-3 — pick algae if vegetarian/vegan/eggetarian or seafood-intolerant
  const dp = (profile.dietaryPreference || "").toLowerCase();
  const isVeg = /(veg|vegan|eggetarian)/.test(dp) && !/non.?veg/.test(dp);
  const seafoodIntol = hasIntolerance(profile, /seafood|fish/i);
  c.push(isVeg || seafoodIntol ? "omega3_algae" : "omega3_fish");
  c.push("b12_methyl");
  // Targeted
  if ((profile.stressScore ?? 50) > 60) c.push("ashwagandha_ksm66");
  if ((profile.sleepScore ?? 70) < 60 && (profile.stressScore ?? 50) > 50) c.push("l_theanine");
  if (gutSignal(profile).length > 0) c.push("probiotics_multi");
  // Condition-specific
  if (hasCondition(profile, /pcos/i)) c.push("myo_inositol");
  if (hasCondition(profile, /thyroid/i)) c.push("selenium");
  if (profile.gender === "female" && profile.age >= 35) c.push("iron_bisglycinate");
  // Maintenance
  c.push("zinc", "curcumin_piperine");
  return c;
}

export function selectVariants(profile: WellnessUserProfile, planAddons?: string[]): SectionDecisions {
  const variants: Record<SectionId, string> = {
    nutritionPrinciples:    pickNutritionVariant(profile),
    sleepProtocol:          pickSleepVariant(profile),
    stressProtocol:         pickStressVariant(profile),
    supplementStrategy:     pickSupplementVariant(profile),
    gutHealth:              pickGutVariant(profile),
    skinHealth:             pickSkinVariant(profile),
    mealTiming:             pickMealTiming(profile),
    movementBias:           pickMovementBias(profile),
    womensHormonal:         pickWomensHormonal(profile),
    addonDnaIntro:          pickAddonDnaIntro(profile),
    addonSupplementIntro:   pickAddonSupplementIntro(profile),
    addonAthleteIntro:      pickAddonAthleteIntro(profile),
    addonFamilyIntro:       pickAddonFamilyIntro(profile, planAddons),
    addonWomenHormoneIntro: pickAddonWomenHormoneIntro(profile),
    addonMenFitnessIntro:   pickAddonMenFitnessIntro(profile),
    addonLabInterpretation: pickAddonLabInterpretation(profile),
  };

  const candidateIds = buildSupplementCandidates(profile);
  const supplementResult = applyContraindications(
    candidateIds,
    profile.medicalConditions || [],
    profile.foodIntolerances || [],
  );

  return { variants, supplementCandidateIds: candidateIds, supplementResult };
}
