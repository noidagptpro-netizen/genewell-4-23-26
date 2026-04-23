/**
 * report-assembler.ts
 * Assembles the complete report from a computed engine profile.
 * Ported from genewell_complete/src/report/reportBuilder.js and assembleReport.js
 */

import { computeWellnessProfile, WellnessEngineProfile } from "./wellness-engine";
import { buildSupplementStack, SupplementRecommendation } from "./supplement-builder";
import { validateEngineReport } from "./consistency-validator";
import {
  getSleepContent,
  getNutritionContent,
  getGutContent,
  getSkinContent,
  getStressContent,
  getTrainingContent,
  getWomensHealthContent,
  getLabTestsContent,
} from "./section-variants";

export interface TopPriority {
  number: number;
  title: string;
  description: string;
  impact: string;
  week: string;
}

export interface WeightCheckpoint {
  week: number;
  label: string;
  weight_kg: number;
  change_kg: number;
  calorie_target: number;
  action: string;
}

export interface AssembledReport {
  profile: WellnessEngineProfile;
  coverPage: any;
  dashboard: any;
  metabolics: any;
  sleep: any;
  nutrition: any;
  gut: any;
  skin: any;
  stress: any;
  training: any;
  womensHealth: any;
  labTests: any;
  supplements: SupplementRecommendation[];
  projection: any;
  cityContext: any;
  flags: any;
  generatedAt: string;
}

// ── Section builder ────────────────────────────────────────────────────────────

function formatDimensionName(key: string): string {
  const map: Record<string, string> = {
    sleep: "Sleep",
    hydration: "Hydration",
    meal_frequency: "Meal Frequency",
    stress: "Stress Management",
    gut_health: "Gut Health",
    skin_health: "Skin Health",
  };
  return map[key] ?? key;
}

function getTop3Priorities(profile: WellnessEngineProfile): TopPriority[] {
  const { limitingFactor, flags, scores } = profile;
  const priorities: TopPriority[] = [];

  // Priority 1: Limiting factor
  if (limitingFactor.key === "sleep") {
    priorities.push({
      number: 1,
      title: "Lock your wake-sleep schedule",
      description: `Your sleep score is ${limitingFactor.score}/100 — there's significant room for improvement. ${profile.sleepAdvice.advice}`,
      impact: "Consistent wake times improve sleep quality more than sleeping longer (Journal of Clinical Sleep Medicine, 2023).",
      week: "Start this week",
    });
  } else if (limitingFactor.key === "meal_frequency") {
    priorities.push({
      number: 1,
      title: "Structure your eating window",
      description: `You eat ${profile.eatingWindow.window_hours} hours/day. ${profile.eatingWindow.is_time_restricted ? "This is excellent — maintain it." : "Compress to a 10–12 hour window."}`,
      impact: "Time-restricted eating improved metabolic markers by 15–25% independent of calorie changes (Cell Metabolism, 2023).",
      week: "Start in Week 2",
    });
  } else if (limitingFactor.key === "stress") {
    priorities.push({
      number: 1,
      title: "Daily stress management protocol",
      description: `Your stress score is ${limitingFactor.score}/100. Start with 5 min box breathing before checking your phone each morning.`,
      impact: "Even 20 minutes of moderate activity reduces all-cause mortality by 30% (JAMA Internal Medicine, 2022).",
      week: "Start this week",
    });
  } else if (limitingFactor.key === "hydration") {
    priorities.push({
      number: 1,
      title: "Hit your daily water target",
      description: `Target: ${profile.waterTarget_L}L/day. Start each morning with 500ml warm water before any food or coffee.`,
      impact: "Proper hydration improves digestion, reduces constipation, boosts energy, and supports skin health.",
      week: "Start this week",
    });
  } else {
    priorities.push({
      number: 1,
      title: "Move for 20–30 minutes daily",
      description: flags.prefersDance ? "Start with dance-based activities based on your preferences." : "Start with 15-minute walks after your largest meal.",
      impact: "Even 20 minutes of moderate activity reduces all-cause mortality by 30% (JAMA Internal Medicine, 2022).",
      week: "Start this week",
    });
  }

  // Priority 2: PCOS-specific or intolerance
  if (flags.hasPCOS) {
    priorities.push({
      number: 2,
      title: "PCOS insulin control stack",
      description: "Myo-Inositol 2g + D-Chiro 50mg twice daily + low-GI diet + 12-hour overnight fast.",
      impact: "Highest-evidence intervention for PCOS. Improves insulin sensitivity, reduces androgens, supports ovulation.",
      week: "Start Week 1",
    });
  } else if (flags.hasIntolerances) {
    priorities.push({
      number: 2,
      title: "Eliminate intolerance triggers",
      description: `You have ${profile.food_intolerances.join(", ")} intolerance(s). All recommendations in this report are filtered — nothing blocked will appear.`,
      impact: "Eliminating triggers reduces gut inflammation, improves nutrient absorption, and boosts energy within 2 weeks.",
      week: "Immediate",
    });
  } else if (scores.hydration < 65) {
    priorities.push({
      number: 2,
      title: "Hit your daily water target",
      description: `Target: ${profile.waterTarget_L}L/day. Start each morning with 500ml warm water before food or coffee.`,
      impact: "Proper hydration improves digestion, reduces constipation, boosts energy, and supports skin health.",
      week: "Start this week",
    });
  } else {
    priorities.push({
      number: 2,
      title: "Daily stress management",
      description: `Stress score: ${scores.stress}/100. Start with 5 min box breathing before checking your phone each morning.`,
      impact: "Even brief morning breathwork sets your cortisol rhythm for the entire day.",
      week: "Start this week",
    });
  }

  // Priority 3: Supplement or movement
  if (flags.budgetLow) {
    priorities.push({
      number: 3,
      title: "Start with Phase 1 supplements only",
      description: "Your budget tier is low. Prioritise Vitamin D3 and Magnesium — highest impact per rupee.",
      impact: "Phase 1 supplements address the most common deficiencies in India.",
      week: "Week 1",
    });
  } else {
    priorities.push({
      number: 3,
      title: `Eat ${profile.macros.protein_g}g protein daily`,
      description: `Eating protein first at each meal reduces glucose spike by 30%. Spread across 3+ meals.`,
      impact: "Protein supports muscle maintenance, satiety, and blood sugar stability.",
      week: "Start Week 1",
    });
  }

  return priorities.slice(0, 3);
}

function build90DayProjection(profile: WellnessEngineProfile) {
  const { weight_kg, goalCalories, tdee, goalKey } = profile;
  const checkpoints: WeightCheckpoint[] = [];

  checkpoints.push({
    week: 0,
    label: "Now",
    weight_kg: weight_kg,
    change_kg: 0,
    calorie_target: goalCalories,
    action: "Weigh in (Monday AM, before eating). Take progress photos.",
  });

  const weeklyChange = goalKey === "lose_fat" ? -0.3 : goalKey === "build_muscle" ? 0.15 : 0.1;

  for (const week of [4, 8, 12]) {
    const totalChange = weeklyChange * week;
    checkpoints.push({
      week,
      label: `Week ${week}`,
      weight_kg: parseFloat((weight_kg + totalChange).toFixed(1)),
      change_kg: parseFloat(totalChange.toFixed(1)),
      calorie_target: goalCalories,
      action: week === 4 ? "Assess energy levels + adjust" : week === 8 ? "Progress photos + measurements" : "Bloodwork retest + plan adjustment",
    });
  }

  return {
    checkpoints,
    goal: goalKey,
    note: goalKey === "maintain"
      ? "Goal is recomposition — scale may not change significantly, but body composition will improve."
      : goalKey === "lose_fat"
        ? "Target: 0.3–0.5kg/week for sustainable fat loss without muscle loss."
        : "Target: slow lean mass gain. Scale will increase but body composition improves.",
  };
}

// ── Main assembler ─────────────────────────────────────────────────────────────

/**
 * Assembles a complete report from raw quiz data.
 * Validates cross-section consistency before returning.
 */
export function assembleWellnessReport(quizData: Record<string, any>): AssembledReport {
  // Step 1: Compute canonical profile
  const profile = computeWellnessProfile(quizData);

  // Step 2: Build supplement stack (with all filters applied)
  const supplements = buildSupplementStack(profile);

  // Step 3: Generate all section content
  const sleep     = getSleepContent(profile);
  const nutrition = getNutritionContent(profile);
  const gut       = getGutContent(profile);
  const skin      = getSkinContent(profile);
  const stress    = getStressContent(profile);
  const training  = getTrainingContent(profile);
  const womensHealth = getWomensHealthContent(profile);
  const labTests  = getLabTestsContent(profile);

  const reportData: AssembledReport = {
    profile,

    coverPage: {
      name: profile.name,
      age: profile.age,
      gender: profile.gender,
      orderId: profile.orderId,
      generatedDate: new Date().toLocaleDateString("en-GB"),
      planTier: profile.planTier,
    },

    dashboard: {
      overallScore: profile.scores.overall,
      scores: profile.scores,
      limitingFactor: profile.limitingFactor,
      topPriorities: getTop3Priorities(profile),
      dimensions: Object.entries(profile.scores)
        .filter(([k]) => k !== "overall")
        .map(([key, score]) => ({
          dimension: formatDimensionName(key),
          score,
          status: score >= 75 ? "good" : score >= 55 ? "work" : "critical",
        })),
    },

    metabolics: {
      bmi: profile.bmi,
      bmiLabel: profile.bmiLabel,
      bmr: profile.bmr,
      tdee: profile.tdee,
      goalCalories: profile.goalCalories,
      macros: profile.macros,
      waterTarget_L: profile.waterTarget_L,
      activityKey: profile.activityKey,
      goalKey: profile.goalKey,
    },

    sleep,
    nutrition,
    gut,
    skin,
    stress,
    training,
    womensHealth,
    labTests,
    supplements,
    projection: build90DayProjection(profile),
    cityContext: profile.cityContext,
    flags: profile.flags,
    generatedAt: new Date().toISOString(),
  };

  // Step 4: Validate cross-section consistency
  const validation = validateEngineReport(profile, {
    nutrition,
    ...Object.entries(profile.scores)
      .filter(([k]) => k !== "overall")
      .reduce((acc, [k, v]) => ({ ...acc, [k]: { score: v } }), {}),
    supplements,
  });

  if (!validation.valid) {
    console.error("❌ Report validation failed:", validation.errors);
    throw new Error("Report contains consistency errors: " + validation.errors.join("; "));
  }
  if (validation.warnings.length > 0) {
    console.warn("⚠️  Report warnings:", validation.warnings);
  }

  return reportData;
}
