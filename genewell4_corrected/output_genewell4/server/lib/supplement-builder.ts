/**
 * supplement-builder.ts
 * Hard constraint filter and supplement stack builder.
 * Every food, supplement, and product recommendation passes through here FIRST.
 * Ported from genewell_complete/src/engine/constraintFilter.js
 */

import {
  INTOLERANCE_INGREDIENT_MAP,
  MEDICATION_INTERACTIONS,
  OMEGA3_ALTERNATIVES,
  MedInteraction,
  MedInteractionAction,
} from "./wellness-constants";
import type { WellnessEngineProfile } from "./wellness-engine";

export interface SupplementInteraction {
  include: boolean;
  action: MedInteractionAction | "include";
  note: string | null;
  medication?: string;
}

export interface SupplementRecommendation {
  phase: number;
  name: string;
  dose?: string;
  timing?: string;
  why?: string;
  brand_india?: string;
  price_month?: string;
  interaction?: SupplementInteraction;
  evidence_tier?: number;
  intolerance_adapted?: boolean;
  supplement_note?: string;
  flag_note?: string;
  doctor_note?: string;
  condition_specific?: string;
  test_first?: boolean;
  excluded?: boolean;
  existing?: boolean;
  exclusion_reason?: string;
  note?: string;
  doctor_first?: boolean;
}

// ─── Safety checks ────────────────────────────────────────────────────────────

export function isItemSafe(itemKeywords: string | string[], profile: WellnessEngineProfile): { safe: boolean; reason: string | null } {
  const keywords = Array.isArray(itemKeywords) ? itemKeywords : [itemKeywords];
  const lowerKeywords = keywords.map((k) => k.toLowerCase());

  for (const intolerance of profile.food_intolerances) {
    if (intolerance === "none") continue;
    const blocked = INTOLERANCE_INGREDIENT_MAP[intolerance] ?? [];
    for (const blocked_ingredient of blocked) {
      for (const kw of lowerKeywords) {
        if (kw.includes(blocked_ingredient) || blocked_ingredient.includes(kw)) {
          return { safe: false, reason: `Contains ${blocked_ingredient} — blocked by your ${intolerance} intolerance` };
        }
      }
    }
  }
  return { safe: true, reason: null };
}

export function filterFoodList(items: string[], profile: WellnessEngineProfile): string[] {
  return items.filter((item) => isItemSafe([item], profile).safe);
}

export function getOmega3Recommendation(profile: WellnessEngineProfile) {
  if (profile.flags.seafoodIntolerant) {
    return OMEGA3_ALTERNATIVES.seafood_intolerant;
  }
  return OMEGA3_ALTERNATIVES.standard;
}

export function checkSupplementInteraction(supplementKey: string, profile: WellnessEngineProfile): SupplementInteraction {
  for (const med of profile.medications) {
    if (med === "none") continue;
    const interactions = MEDICATION_INTERACTIONS[med] ?? {};
    if (interactions[supplementKey]) {
      const ix = interactions[supplementKey];
      return {
        include: ix.action !== "exclude",
        action: ix.action,
        note: ix.note,
        medication: med,
      };
    }
  }
  return { include: true, action: "include", note: null };
}

// ─── Supplement stack builder ─────────────────────────────────────────────────

export function buildSupplementStack(profile: WellnessEngineProfile): SupplementRecommendation[] {
  const stack: SupplementRecommendation[] = [];
  const { flags } = profile;

  // ── Phase 1: Foundation ────────────────────────────────────────────────────

  // Vitamin D3
  if (!flags.takesVitaminD) {
    const interaction = checkSupplementInteraction("vitamin_d3", profile);
    stack.push({
      phase: 1,
      name: "Vitamin D3 + K2",
      dose: "60,000 IU once/week × 8 weeks, then 2,000 IU daily with a fat-containing meal",
      timing: "With largest meal",
      why: "Over 70% of Indians are deficient, directly affecting mood, immunity, muscle function, and sleep.",
      brand_india: "HealthKart D3+K2 / NOW Foods D3+K2",
      price_month: "₹250–450",
      interaction,
      evidence_tier: 1,
    });
  } else {
    stack.push({
      phase: 1,
      name: "Vitamin D3",
      note: "Already in your supplement routine — continue. Retest 25-OH Vitamin D levels at Week 12.",
      existing: true,
    });
  }

  // Magnesium Bisglycinate
  const mgInteraction = checkSupplementInteraction("magnesium_bisglycinate", profile);
  if (mgInteraction.include) {
    stack.push({
      phase: 1,
      name: "Magnesium Bisglycinate",
      dose: "300–400mg, 30–60 min before bed. Use Bisglycinate form ONLY — Citrate and Oxide forms do not cross the blood-brain barrier effectively.",
      timing: "Before bed",
      why: `Your sleep score is ${profile.scores.sleep}/100. Magnesium bisglycinate promotes GABA — the primary sleep neurotransmitter.`,
      brand_india: "NOW Foods Magnesium Bisglycinate / HealthKart Mg",
      price_month: "₹350–550",
      interaction: mgInteraction,
      evidence_tier: 1,
    });
  }

  // Omega-3
  if (!flags.takesOmega3) {
    const omega3 = getOmega3Recommendation(profile);
    const omega3Interaction = checkSupplementInteraction("omega3_epa_dha", profile);
    if (omega3Interaction.include) {
      stack.push({
        phase: 1,
        name: flags.seafoodIntolerant ? "Algae Oil EPA+DHA (Omega-3)" : "Omega-3 Fish Oil (EPA+DHA)",
        dose: "1,000–2,000mg combined EPA+DHA with largest meal",
        timing: "With largest meal",
        why: flags.seafoodIntolerant
          ? `You have a seafood intolerance, so fish oil is excluded. Algae oil is the scientifically validated alternative — clinically equivalent EPA+DHA with no fish derivative. ${omega3.note ?? ""}`
          : "Omega-3 deficiency is near-universal in India. Anti-inflammatory, supports brain function, skin, and cardiovascular health.",
        supplement_note: omega3.supplement,
        brand_india: flags.seafoodIntolerant
          ? "Nordic Naturals Algae Omega / iWi Omega-3 Algae (Amazon India)"
          : "Himalaya Omega / Carlson Elite Omega (Amazon India)",
        price_month: "₹500–900",
        interaction: omega3Interaction,
        evidence_tier: 1,
        intolerance_adapted: flags.seafoodIntolerant,
      });
    } else {
      stack.push({ phase: 1, name: "Omega-3", note: omega3Interaction.note ?? undefined, doctor_first: true });
    }
  }

  // Vitamin B12
  const b12Interaction = checkSupplementInteraction("vitamin_b12", profile);
  if (flags.isVegetarian || flags.onMetformin || flags.onContraceptives) {
    stack.push({
      phase: 1,
      name: "Vitamin B12 (Methylcobalamin)",
      dose: "500mcg sublingual daily (dissolve under tongue for best absorption)",
      timing: "Morning, before food",
      why: flags.onMetformin
        ? `${b12Interaction.note} Methylcobalamin is the bioactive form.`
        : flags.onContraceptives
          ? "Oral contraceptives deplete B12 absorption. Sublingual methylcobalamin bypasses this."
          : "Vegetarian and vegan diets provide no reliable B12. Deficiency causes irreversible neurological damage — do not skip this.",
      brand_india: "Jarrow Methyl B12 / Amazon India methylcobalamin sublinguals",
      price_month: "₹200–400",
      interaction: b12Interaction,
      evidence_tier: 1,
      flag_note: b12Interaction.note ?? undefined,
    });
  }

  // PCOS: Myo-Inositol
  if (flags.hasPCOS) {
    const inositolInteraction = checkSupplementInteraction("myo_inositol", profile);
    const inositolEntry: SupplementRecommendation = {
      phase: 1,
      name: "Myo-Inositol + D-Chiro-Inositol (4:1 ratio)",
      dose: "Myo-Inositol 2g + D-Chiro-Inositol 50mg, twice daily with meals",
      timing: "With breakfast and dinner",
      why: "The highest-evidence supplement for PCOS. Improves insulin sensitivity, reduces androgens, and supports ovulation. Evidence tier 1 (JCEM 2022, multiple RCTs).",
      brand_india: flags.budgetLow
        ? "Myo-Inositol powder (generic, Netmeds) — start with Myo-Inositol only at ₹800–1,200/month if budget is a constraint"
        : "Ovasitol (Myo + D-Chiro 4:1, Netmeds) / Inofolic (Netmeds)",
      price_month: flags.budgetLow ? "₹800–1,200 (Myo-Inositol only)" : "₹1,200–1,800 (4:1 combination)",
      interaction: inositolInteraction,
      evidence_tier: 1,
      condition_specific: "PCOS",
    };
    if (inositolInteraction.action === "doctor_first") {
      inositolEntry.doctor_note = inositolInteraction.note ?? undefined;
    }
    stack.push(inositolEntry);
  }

  // ── Phase 2: Targeted ──────────────────────────────────────────────────────

  // Ashwagandha KSM-66
  const ashwaInteraction = checkSupplementInteraction("ashwagandha_ksm66", profile);
  if (profile.stressRating >= 3 && ashwaInteraction.include && !flags.budgetLow) {
    stack.push({
      phase: 2,
      name: "Ashwagandha KSM-66",
      dose: "300mg morning + 300mg evening with food. Cycle: 5 days on, 2 days off.",
      timing: "With meals, morning and evening",
      why: `Your stress rating is ${profile.stressRating}/5. KSM-66 is the only Ashwagandha extract with 24 clinical trials. Reduces cortisol by 23%, improves sleep and energy.`,
      brand_india: "OZiva KSM-66 / Himalaya Ashwagandha KSM-66 (verify KSM-66 extract on label)",
      price_month: "₹400–700",
      interaction: ashwaInteraction,
      evidence_tier: 2,
    });
  } else if (!ashwaInteraction.include) {
    stack.push({ phase: 2, name: "Ashwagandha KSM-66", excluded: true, exclusion_reason: ashwaInteraction.note ?? "Excluded due to medication interaction" });
    stack.push({
      phase: 2,
      name: "Rhodiola Rosea (Ashwagandha alternative)",
      dose: "200–400mg standardised extract, morning only",
      timing: "Morning with food",
      why: `Ashwagandha is excluded because ${ashwaInteraction.note ?? "of a medication interaction"}. Rhodiola Rosea is a safe adaptogenic alternative that reduces stress and fatigue without thyroid interaction.`,
      brand_india: "Himalaya Rhodiola / NOW Foods Rhodiola (Amazon India)",
      price_month: "₹350–600",
      interaction: { include: true, action: "include", note: null },
      evidence_tier: 2,
    });
  }

  // ── Phase 3: Maintenance ───────────────────────────────────────────────────

  if (!flags.budgetLow) {
    stack.push({
      phase: 3,
      name: "Zinc",
      dose: "25mg elemental zinc with food (NOT on empty stomach). Do NOT exceed 40mg/day.",
      timing: "With a meal (separate from Magnesium by 2+ hours)",
      why: flags.hasPCOS
        ? "Zinc has anti-androgenic properties — directly relevant to PCOS. Also supports immune function and skin repair."
        : flags.onContraceptives
          ? "OCPs deplete zinc. Supplementation restores depleted levels."
          : "Supports immune function, wound healing, and hormonal balance.",
      brand_india: "HealthKart Zinc / Carbamide Forte Zinc (Amazon India)",
      price_month: "₹200–350",
      interaction: checkSupplementInteraction("zinc", profile),
      evidence_tier: 2,
    });
  }

  if (!flags.budgetLow && !flags.budgetMedium) {
    const curcuminInteraction = checkSupplementInteraction("curcumin_piperine", profile);
    if (curcuminInteraction.include) {
      stack.push({
        phase: 3,
        name: "Curcumin + Piperine (Bioperine)",
        dose: "500–1,000mg curcumin + 20mg piperine (black pepper extract). Take at least 2 hours apart from iron supplements.",
        timing: "With a meal",
        why: "Anti-inflammatory. Piperine increases curcumin absorption by 2,000%. Relevant for PCOS inflammation and gut healing.",
        brand_india: "Organic India Turmeric / Carbamide Forte Curcumin (Amazon India)",
        price_month: "₹400–600",
        interaction: curcuminInteraction,
        evidence_tier: 2,
      });
    }
  }

  // L-Theanine for anxiety/mood
  if (flags.hasAnxiety || profile.mood_patterns.includes("anxiety")) {
    const theanineInteraction = checkSupplementInteraction("l_theanine", profile);
    if (theanineInteraction.include) {
      stack.push({
        phase: 2,
        name: "L-Theanine",
        dose: "100–200mg at bedtime or as needed for anxiety",
        timing: "Before bed or during stressful periods",
        why: "Promotes alpha brain waves — calm focus without drowsiness. Particularly relevant for your anxiety/mood patterns.",
        brand_india: "NOW Foods L-Theanine / Natrol L-Theanine (Amazon India)",
        price_month: "₹300–500",
        interaction: theanineInteraction,
        evidence_tier: 2,
      });
    }
  }

  // Iron for vegetarians or women
  if (!flags.takesIron && (flags.isVegetarian || flags.isFemale)) {
    const urgency = flags.isVegetarian ? "high" : "medium";
    stack.push({
      phase: urgency === "high" ? 1 : 3,
      name: "Iron Bisglycinate (verify via blood test first)",
      dose: "25–30mg elemental iron on Days 1–7 of cycle (menstrual replacement) OR as directed by blood test (ferritin target > 30 ng/mL)",
      timing: "Morning, on empty stomach with Vitamin C source (amla juice, lemon water)",
      why: "Iron deficiency is the most common nutrient deficiency in India, causing fatigue and hair loss. Bisglycinate form causes no constipation (unlike Ferrous Sulfate). TEST FIRST — do not supplement without ferritin result.",
      brand_india: "HealthKart Iron Bisglycinate / Carbamide Forte Iron (Amazon India)",
      price_month: "₹250–400",
      interaction: { include: true, action: "include", note: "Must test serum ferritin first. Over-supplementation of iron is harmful." },
      test_first: true,
      evidence_tier: 1,
    });
  }

  return stack;
}

export function getFoodOrSubstitute(item: string, substitute: string, profile: WellnessEngineProfile): string {
  const check = isItemSafe([item], profile);
  return check.safe ? item : substitute;
}
