/**
 * section-variants.ts
 * Branching content library for all report sections.
 * Each function takes a WellnessEngineProfile and returns the correct content variant.
 * Ported from genewell_complete/src/engine/sectionVariants.js
 */

import { filterFoodList, getFoodOrSubstitute } from "./supplement-builder";
import type { WellnessEngineProfile } from "./wellness-engine";

// ─── SLEEP ────────────────────────────────────────────────────────────────────
export function getSleepContent(profile: WellnessEngineProfile) {
  const { scores, sleepAdvice, flags } = profile;
  const score = scores.sleep;

  let urgency: string, primaryAction: string;

  if (score < 45) {
    urgency = "critical";
    primaryAction = "Sleep deprivation at this level elevates cortisol, impairs glucose metabolism, and accelerates cellular aging. This is your #1 health priority above all others.";
  } else if (score < 65) {
    urgency = "needs_work";
    primaryAction = "Consistent sleep improvement will produce the most noticeable energy and mood gains within 2 weeks.";
  } else {
    urgency = "good";
    primaryAction = "Your sleep duration is adequate. Focus on quality — deep sleep and REM cycles.";
  }

  const supplements: any[] = [];
  if (!flags.onAntidepressants) {
    supplements.push({ name: "Magnesium Bisglycinate", dose: "300–400mg", timing: "30–60 min before bed", why: "Deepens sleep, reduces cortisol" });
    if (score < 65) {
      supplements.push({ name: "L-Theanine", dose: "100–200mg", timing: "At bedtime", why: "Alpha brain waves — calm without drowsiness" });
    }
  }
  if (flags.highStress && !flags.onThyroidMeds && !flags.onAntidepressants) {
    supplements.push({ name: "Ashwagandha KSM-66", dose: "300mg", timing: "Before bed (stress-driven insomnia)", why: "Cortisol -23%, improves deep sleep (5 days on, 2 off)" });
  }

  return {
    score,
    urgency,
    sleepAdvice,
    primaryAction,
    supplements,
    pre_sleep_checklist: [
      "No caffeine after 2 PM (5–6 hour half-life disrupts sleep onset)",
      "Warm shower 90 min before bed (triggers core temperature drop, signals sleep onset)",
      "Phone on DND/silent — in another room if possible",
      "Dim all lights at least 1 hour before bed (blue light suppresses melatonin by 85%)",
      "Write tomorrow's top 3 tasks — offloads mental loops that cause racing thoughts",
    ],
    room_conditions: {
      temperature: "18–20°C (65–68°F) — your body needs to drop core temperature to initiate sleep",
      light: "Blackout curtains or sleep mask (<5 lux)",
      sound: "<30 dB — white noise machine if ambient noise is above this",
    },
  };
}

// ─── NUTRITION ────────────────────────────────────────────────────────────────
export function getNutritionContent(profile: WellnessEngineProfile) {
  const { flags, macros, goalCalories, cravings } = profile;

  let proteinSources: string[] = [];
  if (!flags.isVegetarian) {
    proteinSources = filterFoodList(["Eggs", "Chicken breast", "Turkey", "Lean red meat (2x/week max)"], profile);
  }
  if (!flags.seafoodIntolerant && !flags.isVegetarian && !flags.isVegan) {
    proteinSources.push("Fish (pomfret, rohu, katla)");
  }
  proteinSources = [...proteinSources, ...filterFoodList(["Paneer", "Greek yogurt", "Low-fat curd"], profile)];
  proteinSources = [...proteinSources, "Lentils (dal)", "Chickpeas (chana)", "Moong beans", "Soya chunks", "Tofu", "Sprouts"];
  if (!flags.nutsIntolerant) proteinSources.push("Peanut butter (unsweetened)", "Almonds", "Walnuts");

  let carbSources = ["Oats", "Brown rice", "Millets (bajra, jowar, ragi)", "Sweet potato", "Banana"];
  if (!flags.glutenIntolerant) carbSources.push("Whole wheat roti (2–3/meal)");
  else carbSources.push("Rice roti", "Jowar roti (gluten-free)");
  if (flags.hasPCOS || flags.hasDiabetes || flags.familyDiabetes) {
    carbSources = ["Millets (low-GI)", "Oats", "Sweet potato", "Brown rice (portion-controlled)", "Lentils (dual protein + carb)"];
  }

  let fatSources = filterFoodList(["Ghee (1 tsp/meal, if not dairy intolerant)", "Coconut oil", "Olive oil (cold use)", "Flaxseeds", "Chia seeds"], profile);
  if (!flags.nutsIntolerant) fatSources = [...fatSources, ...filterFoodList(["Walnuts", "Almonds", "Peanut butter"], profile)];
  if (!flags.seafoodIntolerant) fatSources.push("Fatty fish (salmon, mackerel)");

  const cravingStrategies: Record<string, string> = {};
  if (cravings.includes("salty_snacks")) {
    cravingStrategies["Salty snacks"] = "Replace with: roasted makhana (fox nuts), homemade chaat without fried puri, cucumber with rock salt + lemon, boiled chana chaat. Salty cravings often signal dehydration or electrolyte imbalance — try 500ml water first.";
  }
  if (cravings.includes("sweet_foods")) {
    cravingStrategies["Sweet cravings"] = "Replace with: 1–2 dates (medjool), a small piece of dark chocolate (70%+), fruit with cinnamon (cinnamon reduces glucose spike), or sweet potato. If PCOS-related: prioritise Inositol supplement — reduces insulin-driven sweet cravings over 4–6 weeks.";
  }
  if (cravings.includes("fried")) {
    cravingStrategies["Fried foods"] = "Replace with: air-fried or baked versions of the same food. The craving is for fat + salt + crunch — air-fried bhindi, makhana, or roasted chickpeas satisfy the same pattern.";
  }
  if (cravings.includes("caffeine")) {
    cravingStrategies["Caffeine"] = "If energy crashes are driving caffeine cravings, the root cause is blood sugar — address with regular meals and protein. Limit to 1–2 cups before 1 PM. Replace afternoon coffee with green tea (L-theanine reduces jitteriness).";
  }

  const ewStrategy = profile.eatingWindow.overnight_fast_hrs >= 12
    ? `Your current eating pattern creates a ${profile.eatingWindow.overnight_fast_hrs}-hour overnight fast — this is excellent for insulin sensitivity and metabolic health. Maintain this.`
    : `Target a 12-hour overnight fast. If your first meal is at ${profile.eatingWindow.first_meal_time}, aim to finish eating by ${profile.eatingWindow.last_meal_approx}. Time-restricted eating improves metabolic markers by 15–25% independent of calorie changes (Cell Metabolism, 2023).`;

  return {
    goalCalories,
    macros,
    proteinSources: [...new Set(proteinSources)].slice(0, 10),
    carbSources: [...new Set(carbSources)].slice(0, 8),
    fatSources: [...new Set(fatSources)].slice(0, 8),
    cravingStrategies,
    eatingWindowStrategy: ewStrategy,
    pcosNutritionNote: flags.hasPCOS
      ? "PCOS insulin strategy: prioritise low-GI carbohydrates, eat protein first at each meal (reduces glucose spike by 30%), avoid refined sugar and white rice as your primary carb. Target 100–120g carbs/day from whole-food sources."
      : null,
    eatingOutStrategy: profile.flags.eatsOutOften ? getEatingOutGuide(profile) : null,
  };
}

function getEatingOutGuide(profile: WellnessEngineProfile) {
  const safeOrders = filterFoodList([
    "Dal tadka or dal makhani (protein + fibre)",
    "Grilled or tandoor chicken/paneer (if no intolerance)",
    "Roti (2 max) over naan (3x the calories of roti)",
    "Raita or plain curd (gut-friendly, adds protein)",
    "Tandoori dishes (minimal oil vs. curries)",
    "Salad or soup before main meal (reduces total calorie intake by ~20%)",
  ], profile);

  return {
    title: "Eating out guide (you eat out often — this section is your cheat sheet)",
    ordering_strategy: "Eat a small protein snack before going out — reduces ordering impulsively and slows glucose spike.",
    safe_orders: safeOrders,
    always_avoid: ["Maida-based dishes (naan, paratha from bakeries)", "Deep-fried starters as a meal base", "Sweetened drinks with the meal (glucose spike doubles)"],
    best_meal_sequence: "Salad/soup → protein dish → carb (roti/rice) → NOT the reverse. This sequence reduces blood glucose spike by 35–40%.",
    smart_swaps: {
      "Naan → Roti": "Save ~150 kcal and ~20g refined carbs per piece",
      "Paneer curry → Grilled paneer tikka": "Save ~200 kcal, same protein",
      "Biryani → Dal + roti": "More protein, more fibre, lower glycaemic load",
      "Mango lassi → Salted lassi or plain buttermilk": "Save ~30g sugar",
    },
  };
}

// ─── GUT HEALTH ───────────────────────────────────────────────────────────────
export function getGutContent(profile: WellnessEngineProfile) {
  const { digestive_issues, scores } = profile;
  const hasLooseMotions = digestive_issues.includes("loose_stools");
  const hasConstipation = digestive_issues.includes("constipation");
  const hasBloating     = digestive_issues.includes("bloating");
  const hasReflux       = digestive_issues.includes("acid_reflux");

  let phase1Protocol: any = {};
  if (hasLooseMotions) {
    phase1Protocol = {
      condition: "Loose stools / diarrhoea",
      approach: "Remove & repair — avoid fibre loading (opposite of constipation protocol)",
      eat_more: filterFoodList(["Bone broth / vegetable broth", "Rice congee (kanji)", "Banana (ripe)", "Cooked white rice", "Boiled potato", "Stewed apple without skin", "Ghee (1 tsp in rice)"], profile),
      avoid: ["Raw vegetables", "High-fibre foods", "Spicy food", "Caffeine", "Gluten (temporarily)", "Dairy (temporarily, even if not intolerant)"],
      supplement: "Electrolyte replacement (ORS or coconut water with pinch of salt). Probiotics ONLY after acute phase resolves.",
      food_diary: "Track meals for 2 weeks to identify personal triggers. Common culprits: gluten, dairy, high-FODMAP foods, artificial sweeteners.",
    };
  } else if (hasConstipation) {
    phase1Protocol = {
      condition: "Constipation",
      approach: "Increase fibre gradually (sudden increase worsens bloating)",
      eat_more: filterFoodList(["Isabgol (psyllium husk) 1 tsp in warm water before bed", "Flaxseeds (ground, 1 tbsp/day)", "Papaya (morning, empty stomach)", "Prunes (4–5 soaked overnight)", "Ghee in warm water (morning)"], profile),
      avoid: ["White rice as primary carb", "Excess dairy", "Processed foods", "Low water intake"],
      supplement: "Probiotics (10–50 billion CFU, morning on empty stomach) + Isabgol",
      water_note: "Increase water by 500ml/day before adding fibre — fibre without water worsens constipation.",
    };
  }

  const bloatingProtocol = hasBloating ? {
    strategies: [
      "Eat slowly — put your fork down between bites. Swallowing air causes 40% of bloating.",
      "Avoid carbonated drinks entirely during the 4-week protocol.",
      "Fennel seeds (saunf) or ajwain water after meals — natural carminative.",
      "Identify your personal bloating triggers with a 2-week food diary.",
      "Reduce raw cruciferous vegetables (cabbage, broccoli) temporarily — cook them instead.",
    ],
  } : null;

  const refluxProtocol = hasReflux ? {
    strategies: [
      "Avoid eating within 3 hours of bedtime — stomach acid flows back when lying down.",
      "Elevate head of bed by 6 inches (use books under mattress, not extra pillow).",
      "Identify trigger foods: citrus, tomato, coffee, chocolate, fatty foods, spicy food.",
      "Small, frequent meals — large meals increase stomach pressure.",
      "Avoid lying down for 30 min after eating.",
    ],
    foods_to_reduce: ["Coffee", "Citrus", "Tomato-based dishes", "Chocolate", "Fried foods", "Peppermint (relaxes lower oesophageal sphincter)"],
  } : null;

  return {
    score: scores.gut_health,
    conditions: digestive_issues,
    phase1Protocol,
    bloatingProtocol,
    refluxProtocol,
    fourWeekPlan: [
      { weeks: "1–2", phase: "Remove & repair", description: "Eliminate gut irritants. Stick to easy-to-digest foods. Add bone/vegetable broth daily." },
      { weeks: "3–4", phase: "Repopulate & rebalance", description: "Introduce fermented foods (homemade curd, kanji, idli). Probiotic supplement (10–50B CFU, morning on empty stomach)." },
    ],
    probioticNote: hasLooseMotions
      ? "Start probiotics ONLY after the acute loose motion phase resolves (typically Week 2). Starting too early can worsen symptoms."
      : "Probiotics: 10–50 billion CFU, Lactobacillus rhamnosus GG or Bifidobacterium longum strains. Morning on empty stomach.",
    waterTarget: `${profile.waterTarget_L}L/day. Start each morning with 500ml warm water before any food or coffee — this alone improves gut motility significantly.`,
  };
}

// ─── SKIN HEALTH ──────────────────────────────────────────────────────────────
export function getSkinContent(profile: WellnessEngineProfile) {
  const { skin_concerns, flags, scores } = profile;
  const hasDryness = skin_concerns.includes("dryness");
  const hasAcne    = skin_concerns.includes("acne");
  const hasHairFall = skin_concerns.includes("hair_fall");

  const omega3FoodSource = flags.seafoodIntolerant
    ? "Flaxseeds + chia seeds + walnuts (plant-based omega-3). Note: ALA converts poorly to EPA+DHA — algae oil supplement is strongly recommended for skin barrier repair."
    : "Fatty fish (salmon, mackerel) 2x/week + flaxseeds + walnuts";

  const skinNutrients = [
    { nutrient: "Omega-3", source: omega3FoodSource, function: "Barrier repair, anti-inflammatory (reduces acne and dryness)", daily: flags.seafoodIntolerant ? "Algae oil supplement 1000–2000mg" : "2g EPA+DHA from food + supplement" },
    { nutrient: "Vitamin C", source: "Amla (highest Vitamin C in nature), guava, lemon, citrus, bell peppers", function: "Collagen synthesis, brightening, antioxidant", daily: "65–90mg+ (1 amla = ~600mg Vitamin C)" },
    { nutrient: "Vitamin A", source: filterFoodList(["Sweet potato, carrots, spinach, eggs, liver"], profile).join(", "), function: "Cell turnover, anti-ageing, acne control", daily: "700–900mcg RAE" },
    { nutrient: "Zinc", source: filterFoodList(["Pumpkin seeds, chickpeas, lentils, sesame (til), eggs"], profile).join(", "), function: "Wound healing, acne control, hair growth", daily: "8–11mg" },
    { nutrient: "Hydration", source: "Water + coconut water + herbal teas", function: "Plumpness, elasticity, toxin flush", daily: `${profile.waterTarget_L}L/day target` },
  ];

  const protocols: Record<string, any> = {};
  if (hasDryness) {
    protocols.dryness = {
      title: "Dry skin — inside-out protocol",
      internal: ["Add 1 tsp flaxseed oil to salads daily", "Eat walnuts (6–8/day)", "Increase water intake by 500ml (dehydration is the most common cause of skin dryness)"],
      topical: ["Apply coconut or almond oil WHILE skin is still damp (within 3 min of bathing — this seals moisture in)", "Avoid hot showers (strip natural skin oils)", "Use a humidifier in dry seasons"],
      supplement: "Vitamin E (400 IU, with largest meal) + Algae/Fish oil Omega-3",
    };
  }
  if (hasAcne) {
    protocols.acne = {
      title: "Acne — nutrition and hormonal approach",
      internal: ["Reduce dairy temporarily (casein and IGF-1 in dairy increase sebum production)", "Reduce high-GI foods (white rice, bread, sugar) — insulin spike increases androgen → sebum", "Add spearmint tea 2x/day (reduces free testosterone — relevant for PCOS-related acne)", "Zinc 25mg/day (anti-inflammatory, sebum-reducing)"],
      topical: ["Niacinamide 5% serum (reduces sebum, minimises pores)", "Salicylic acid cleanser 2% (clears pores)", "SPF 50 PA+++ daily (no matter how dark your skin — UV worsens acne marks)"],
      supplement: "Zinc 25mg + Vitamin A from food (not supplements unless tested deficient)",
    };
  }
  if (hasHairFall) {
    protocols.hair_fall = {
      title: "Hair fall — nutritional root causes",
      common_deficiencies: ["Iron/Ferritin (most common cause in Indian women)", "Vitamin D", "Zinc", "Biotin (if vegans)", "Protein (inadequate intake)"],
      actions: ["Test ferritin first (target >30 ng/mL for hair growth)", "Ensure protein target is met (hair is primarily keratin — a protein)", "Add foods: eggs, pumpkin seeds, lentils, drumstick leaves (moringa)", "Scalp massage 5 min daily (improves dermal papilla cell activation by 68% — Journal of Dermatology 2016)"],
      supplement: "Test before supplementing: Iron + Ferritin, Vitamin D, Zinc, B12. Supplement only what is deficient.",
    };
  }

  return {
    score: scores.skin_health,
    concerns: skin_concerns,
    skinNutrients,
    protocols,
    universalRule: "Skin reflects internal health. Nutrition, sleep, and hydration impact skin more than topical products alone (JAAD 2023). Address the root cause first.",
  };
}

// ─── STRESS & MOOD ────────────────────────────────────────────────────────────
export function getStressContent(profile: WellnessEngineProfile) {
  const { stressRating, mood_patterns, scores } = profile;
  const score = scores.stress;

  let variant: string, dailyProtocol: Record<string, string>;

  if (stressRating >= 4) {
    variant = "high";
    dailyProtocol = {
      morning: "10 min breathwork BEFORE phone/email. Then 10 min walk. This sets cortisol rhythm for the day.",
      midday: "5-min walk every 90 min of seated work. Prevents cortisol accumulation from prolonged sitting.",
      evening: "20 min tech-free. Write 3 gratitude items (anxiety -23% in 2 weeks, European Journal of Social Psychology).",
      sleep_prep: "Magnesium bisglycinate 400mg + Ashwagandha KSM-66 300mg (if not contraindicated) 30 min before bed.",
    };
  } else if (stressRating >= 3) {
    variant = "moderate";
    dailyProtocol = {
      morning: "5–10 min meditation or box breathing before checking phone.",
      midday: "5 min outdoor walk if possible. Even 2 min changes cortisol.",
      evening: "15 min tech-free. Journal or gratitude practice 3x/week.",
      sleep_prep: "Consistent bedtime routine — same time every night.",
    };
  } else {
    variant = "low";
    dailyProtocol = {
      morning: "Continue current low-stress patterns. Morning light exposure (10 min) optimises cortisol awakening response.",
      midday: "Maintain movement breaks.",
      evening: "Protect sleep window — your low stress is an asset, sleep compounds it.",
      sleep_prep: "Consistent bedtime.",
    };
  }

  const moodStrategies: Record<string, string> = {};
  if (mood_patterns.includes("irritability")) {
    moodStrategies["Irritability"] = "Often driven by blood sugar fluctuations (eating too few meals) or sleep deprivation. Fix meal frequency and sleep first before adding supplements. Magnesium deficiency is a common physiological cause.";
  }
  if (mood_patterns.includes("brain_fog")) {
    moodStrategies["Brain fog"] = "Top causes: dehydration, poor sleep, B12 deficiency, thyroid dysfunction, low iron. Start with: 500ml water on waking, test B12 and ferritin, fix sleep. Omega-3 EPA+DHA supports cognitive function.";
  }
  if (mood_patterns.includes("emotional_eating")) {
    moodStrategies["Emotional eating"] = "Pause before eating: identify if the hunger is physical (stomach) or emotional (stress/boredom). Keep a hunger-mood journal for 1 week. Having pre-portioned healthy snacks reduces impulsive choices by 60%.";
  }
  if (mood_patterns.includes("mood_swings")) {
    moodStrategies["Mood swings"] = profile.flags.hasPCOS
      ? "PCOS-related mood swings are often driven by oestrogen/progesterone imbalance and insulin resistance. Myo-Inositol supplementation, low-GI diet, and cycle-synced training reduce mood volatility over 8–12 weeks."
      : "Track patterns against your cycle and meals. If post-meal, blood sugar is the cause. If cyclical, hormonal — get hormonal panel (Day 2–5 of cycle).";
  }

  return {
    score,
    variant,
    stressRating,
    dailyProtocol,
    moodStrategies,
    emergency_tools: [
      { name: "Box breathing", instructions: "Inhale 4 sec → hold 4 sec → exhale 4 sec → hold 4 sec. Repeat 4–6 cycles. Activates parasympathetic nervous system in under 5 minutes.", time: "< 5 min" },
      { name: "Physiological sigh", instructions: "2 short inhales through nose + 1 long exhale through mouth. Fastest known real-time stress reducer (Stanford, 2023).", time: "30 sec" },
      { name: "5-4-3-2-1 grounding", instructions: "5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. Breaks anxiety spiral by engaging sensory cortex.", time: "2 min" },
    ],
  };
}

// ─── TRAINING ─────────────────────────────────────────────────────────────────
export function getTrainingContent(profile: WellnessEngineProfile) {
  const { flags, goalKey } = profile;

  let programme: any;
  if (flags.prefersDance) {
    programme = {
      type: "Dance-based",
      week_plan: [
        { day: "Day 1", activity: "Zumba or Bollywood dance — 40 min moderate intensity", notes: "YouTube: BollyX, Doonya, Shilpa Shetty dance workouts. MET value ~5.0 — equals brisk jogging." },
        { day: "Day 2", activity: "Yoga or stretching — 30 min", notes: "Yoga with Adriene (YouTube) — stress-reducing, improves flexibility" },
        { day: "Day 3", activity: "Dance — 40 min + 10 min resistance band workout", notes: "Resistance bands: glute bridges, rows, shoulder press" },
        { day: "Day 4", activity: "Rest or 20 min walk", notes: "Active recovery. Walking after meals specifically reduces post-meal glucose spike." },
        { day: "Day 5", activity: "Dance — 45–50 min", notes: "Increase intensity every 2 weeks by 5 min or adding a second song" },
        { day: "Day 6", activity: "Bodyweight strength — 20–30 min", notes: "Squats, push-ups, plank, reverse lunges — 3 sets of 10–12 reps" },
        { day: "Day 7", activity: "Complete rest", notes: "Recovery is when adaptation happens. Protect this day." },
      ],
    };
  } else if (flags.prefersYoga) {
    programme = {
      type: "Yoga-based",
      week_plan: [
        { day: "Day 1", activity: "Vinyasa yoga — 45 min", notes: "Moderate intensity. Downdog, warrior sequences." },
        { day: "Day 2", activity: "Strength-focused yoga (Ashtanga primary series elements)", notes: "Plank hold, chaturanga, boat pose." },
        { day: "Day 3", activity: "20 min walk + 20 min yin yoga", notes: "Low-intensity recovery." },
        { day: "Day 4", activity: "Vinyasa yoga — 45 min", notes: "" },
        { day: "Day 5", activity: "Resistance band workout — 25 min", notes: "Add resistance training to your yoga practice for bone density and PCOS management." },
        { day: "Day 6", activity: "Power yoga — 50 min", notes: "" },
        { day: "Day 7", activity: "Restorative / yin yoga — 30 min or rest", notes: "" },
      ],
    };
  } else if (flags.prefersGym) {
    programme = {
      type: "Gym / weight training",
      week_plan: [
        { day: "Day 1", activity: "Push (chest, shoulders, triceps) — 45 min", notes: "Compound first: bench press / push-up progression, shoulder press, tricep dips" },
        { day: "Day 2", activity: "Cardio — 30 min moderate intensity", notes: "Treadmill incline walk or elliptical at 60–70% max HR" },
        { day: "Day 3", activity: "Pull (back, biceps) — 45 min", notes: "Lat pulldown, cable row, face pulls, bicep curl" },
        { day: "Day 4", activity: "Rest or yoga", notes: "" },
        { day: "Day 5", activity: "Legs (quads, hamstrings, glutes) — 50 min", notes: "Squats, Romanian deadlift, leg press, glute bridges" },
        { day: "Day 6", activity: "HIIT or functional — 30 min", notes: flags.hasPCOS ? "Avoid HIIT during luteal phase (Days 17–28). Substitute steady-state cardio." : "Burpees, jump squats, mountain climbers — 30 sec on, 30 off" },
        { day: "Day 7", activity: "Rest", notes: "" },
      ],
    };
  } else {
    programme = {
      type: "Progressive walking (starter programme)",
      week_plan: [
        { day: "Week 1–2", activity: "15 min walk, 5 days/week", notes: "Walk after your largest meal. Post-meal walking reduces glucose spike by 30% — directly relevant to insulin resistance." },
        { day: "Week 3–4", activity: "20–25 min walk, 5 days/week", notes: "Add 5 min every 2 weeks." },
        { day: "Week 5–6", activity: "30 min walk + 10 min bodyweight exercises", notes: "Squats, wall push-ups, seated leg raises." },
        { day: "Week 7–8", activity: "30 min walk + 15 min bodyweight", notes: "Begin adding resistance bands." },
      ],
    };
  }

  const pcosNote = flags.hasPCOS
    ? "PCOS exercise principle: resistance training is more effective than cardio alone for PCOS symptom management (improves insulin sensitivity and lowers androgens). Minimum 2 resistance sessions/week. Avoid high-intensity training in the luteal phase (Days 17–28) when cortisol is already elevated."
    : null;

  return {
    programme,
    pcosNote,
    progressionPrinciple: "Increase workout duration or intensity by no more than 10% per week. This is the rule that prevents overuse injuries.",
    minimumViable: "Even 20 minutes of moderate activity reduces all-cause mortality by 30% (JAMA Internal Medicine, 2022). On your busiest days, a 20-min walk counts.",
    goalAlignment: goalKey === "lose_fat"
      ? "For fat loss: 150–300 min moderate cardio/week + 2–3 resistance sessions. Create the calorie deficit through food, not exercise alone — exercise is for health and body composition."
      : goalKey === "build_muscle"
        ? `For muscle building: resistance training 3–4 days/week takes priority over cardio. Protein timing matters — eat 20–30g protein within 2 hours of training.`
        : `For recomposition: consistent resistance training + adequate protein (your target: ${profile.macros.protein_g}g/day) is the formula. The scale may not change but body composition improves.`,
  };
}

// ─── WOMEN'S HORMONAL HEALTH ──────────────────────────────────────────────────
export function getWomensHealthContent(profile: WellnessEngineProfile): any | null {
  if (!profile.flags.isFemale) return null;

  const { flags, tdee } = profile;

  if (flags.hasPCOS && flags.cycleAbsent) {
    return {
      variant: "pcos_amenorrhea",
      title: "PCOS — cycle restoration protocol",
      note: "You indicated your menstrual cycle is absent. A cycle-synced training plan is not applicable until ovulation is restored. This section focuses on the root-cause protocol for cycle restoration.",
      priorities: [
        "Insulin sensitisation: Myo-Inositol 2g + D-Chiro 50mg twice daily (most important intervention)",
        "Low-GI diet: eliminate refined sugar, white flour, sweetened drinks",
        "Weight management: even 5% body weight reduction restores ovulation in ~60% of PCOS women with anovulation",
        "Stress reduction: chronic stress elevates cortisol, which suppresses GnRH and blocks ovulation",
        "12-hour overnight fast: reduces fasting insulin levels, which is the primary driver of PCOS in most cases",
      ],
      lab_priority: { lh_fsh_ratio: "Critical", amh: "High", fasting_insulin: "Critical", testosterone: "Critical" },
      timeline: "Expect 3–6 months of consistent intervention before cycle restoration in moderate PCOS. Track with BBT thermometer or ovulation predictor kits.",
    };
  }

  if (flags.hasPCOS && flags.cycleIrregular) {
    return {
      variant: "pcos_irregular",
      title: "PCOS — cycle-synced protocol (irregular cycle)",
      note: "Your cycle is present but irregular. The phase-based plan below uses a 28-day template. Track your own cycle length with an app (Flo, Clue) and adjust phase windows to your actual pattern.",
      cycleSyncedPlan: buildCycleSyncedPlan(profile),
      tracking_advice: "Use BBT (basal body temperature) to identify your actual ovulation day. Your follicular phase may be longer than 14 days.",
    };
  }

  if (flags.onContraceptives) {
    return {
      variant: "on_ocp",
      title: "Hormonal health on oral contraceptives",
      note: "Oral contraceptives suppress the natural estrogen/progesterone cycle. Phase-based nutrition and training differences are therefore reduced. Instead, focus on replenishing the nutrients OCPs deplete.",
      ocp_depletions: [
        { nutrient: "Vitamin B6 (P5P form)", dose: "50mg daily (Days 14–28)", why: "OCP strongly depletes B6. Supplementation reduces mood symptoms." },
        { nutrient: "Vitamin B12 (Methylcobalamin)", dose: "500mcg sublingual", why: "OCP impairs B12 absorption." },
        { nutrient: "Zinc", dose: "25mg with food", why: "OCP depletes zinc. Supports skin and immune function." },
        { nutrient: "Magnesium Bisglycinate", dose: "400mg before bed", why: "OCP depletes magnesium. Reduces PMS and improves sleep." },
        { nutrient: "Folate (Methylfolate form)", dose: "400–800mcg daily", why: "OCP depletes folate. Critical if considering pregnancy within 6 months of stopping." },
      ],
    };
  }

  return {
    variant: "regular_cycle",
    title: "28-day cycle-synced wellness plan",
    cycleSyncedPlan: buildCycleSyncedPlan(profile),
    condition_protocols: flags.hasPCOS ? getPCOSProtocol(profile) : null,
  };
}

function buildCycleSyncedPlan(profile: WellnessEngineProfile) {
  const { tdee } = profile;
  return [
    {
      phase: "Menstrual", days: "1–5", hormones: "Estrogen + Progesterone LOW",
      calorie_adjustment: `-100 to 0 kcal (${tdee - 100}–${tdee} kcal)`,
      training: "Light yoga, gentle walking. Avoid high-intensity training — cortisol is elevated, recovery is slower.",
      nutrition: "Iron-rich foods: lentils, spinach, sesame seeds. Warm foods — avoid cold/raw foods which slow digestion.",
      supplements: "Iron Bisglycinate 25mg (Days 1–7), Omega-3 2g, Magnesium 400mg for cramps",
    },
    {
      phase: "Follicular", days: "6–13", hormones: "Estrogen RISING",
      calorie_adjustment: `+100–200 kcal (${tdee + 100}–${tdee + 200} kcal)`,
      training: "Peak performance window. Personal records, high-intensity, strength PRs. Estrogen enhances muscle repair.",
      nutrition: "Balanced macros. Probiotic foods (curd, idli, dosa). Cruciferous vegetables (broccoli, cabbage) support estrogen metabolism.",
      supplements: "B-complex, Zinc, Magnesium. Reduce iron (day 8 onwards).",
    },
    {
      phase: "Ovulatory", days: "14–16", hormones: "LH + Estrogen PEAK",
      calorie_adjustment: `+150–250 kcal (${tdee + 150}–${tdee + 250} kcal)`,
      training: "Highest energy of the cycle. HIIT, strength, max output. Best time for fitness tests.",
      nutrition: "Antioxidant-rich: berries, amla, colourful vegetables. Anti-inflammatory: turmeric, ginger.",
      supplements: "Vitamin C 500mg, Vitamin E 200 IU, CoQ10 100mg",
    },
    {
      phase: "Luteal", days: "17–28", hormones: "Progesterone PEAK → drops",
      calorie_adjustment: `+100–300 kcal (${tdee + 100}–${tdee + 300} kcal) — progesterone raises metabolism`,
      training: "Moderate intensity. Steady-state cardio, yoga, stretching. Avoid pushing to failure — injury risk higher.",
      nutrition: "Complex carbs (reduce cravings). Dark chocolate 70%+ (magnesium + mood support). Reduce sodium (reduces bloating). Avoid alcohol (worsens PMS symptoms).",
      supplements: "Magnesium 400mg + Calcium 500mg + Vitamin B6 (P5P) 50mg — PMS symptom reduction",
    },
  ];
}

function getPCOSProtocol(profile: WellnessEngineProfile) {
  return {
    insulin_control: {
      diet_actions: [
        "12-hour overnight fast (10 PM – 10 AM target)",
        "Millets over white rice as primary carb source",
        "Low-GI throughout the day (glycaemic index < 55)",
        "Eat protein first at each meal (reduces glucose spike by ~30%)",
      ],
      supplements: ["Myo-Inositol 2g + D-Chiro-Inositol 50mg × 2 daily", "Berberine 500mg 2× after meals (if Metformin not prescribed)"],
      labs: "Fasting insulin + AMH — test before starting protocol, retest at 90 days",
    },
    androgen_reduction: {
      diet_actions: ["Spearmint tea 2× daily (reduces free testosterone 30% — Phytotherapy Research)", "Reduce dairy (IGF-1 in milk increases androgen production)", "Increase zinc-rich foods (anti-androgenic)"],
      supplements: ["Zinc 30mg/day", "Spearmint tea (food-grade, not supplement)"],
      labs: "LH/FSH ratio + Free testosterone (Day 2–5 of cycle)",
    },
  };
}

// ─── LAB TESTS ────────────────────────────────────────────────────────────────
export function getLabTestsContent(profile: WellnessEngineProfile) {
  const { flags } = profile;
  const tests: any[] = [];

  // Critical — always
  tests.push({ priority: "critical", name: "Vitamin D (25-hydroxyvitamin D)", timing: "Week 0 — before starting plan", price: "₹600–1,200", why: "76% urban Indians are deficient. Affects mood, immunity, muscle function, and sleep quality." });
  tests.push({ priority: "critical", name: "Complete Blood Count (CBC)", timing: "Week 0", price: "₹200–400", why: "Baseline immune health, anaemia screening, and infection markers." });
  tests.push({ priority: "critical", name: "Thyroid Panel (TSH, T3, T4, Anti-TPO)", timing: "Week 0 — before 10 AM for accuracy", price: "₹400–800", why: flags.hasThyroid ? "You have a thyroid condition — quarterly monitoring is essential." : "Low energy is a key thyroid symptom. Rules out or confirms thyroid dysfunction." });

  if (flags.hasPCOS) {
    tests.push({ priority: "critical", name: "Hormonal Panel (LH, FSH, Testosterone, Estradiol)", timing: "Day 2–5 of cycle (this timing is non-negotiable — results are meaningless at other times)", price: "₹800–1,500", why: "PCOS baseline. LH/FSH ratio and testosterone are the key diagnostic markers." });
    tests.push({ priority: "critical", name: "HbA1c + Fasting Insulin + Fasting Glucose", timing: "Week 0", price: "₹450–850", why: "PCOS is primarily an insulin-resistance condition. This test determines severity and guides supplement dosing." });
    tests.push({ priority: "high", name: "AMH (Anti-Müllerian Hormone)", timing: "Week 0", price: "₹800–1,200", why: "Indicates ovarian reserve. Important for family planning decisions." });
  }

  if (!flags.hasPCOS && (flags.familyDiabetes || profile.bmi >= 25 || flags.hasDiabetes)) {
    tests.push({ priority: "high", name: "HbA1c + Fasting Glucose", timing: "Week 0", price: "₹300–600", why: flags.familyDiabetes ? "Family history of diabetes elevates your risk. HbA1c shows 3-month blood sugar history." : `Your BMI (${profile.bmi}) indicates elevated insulin resistance risk.` });
  }

  if (flags.isVegetarian || flags.isFemale || profile.skin_concerns.includes("hair_fall")) {
    tests.push({ priority: "high", name: "Iron + Ferritin + TIBC", timing: "Week 0–4", price: "₹400–700", why: "Iron deficiency is the most common nutrient deficiency in India — causes fatigue and hair loss. Ferritin target for hair growth: > 30 ng/mL." });
  }

  tests.push({ priority: "medium", name: "Lipid Profile (LDL, HDL, Triglycerides)", timing: "Week 0–2", price: "₹200–500", why: flags.familyHeart ? "Family history of heart disease — annual lipid monitoring is essential." : "Baseline cardiovascular health. Triglycerides are elevated in PCOS and insulin resistance." });
  tests.push({ priority: "medium", name: "hs-CRP (High-Sensitivity C-Reactive Protein)", timing: "Week 0", price: "₹300–600", why: "Measures systemic inflammation. Elevated in PCOS, autoimmune conditions, and poor gut health. Tracks the impact of your protocol." });

  if (flags.isVegetarian) {
    tests.push({ priority: "high", name: "Vitamin B12 (Serum Cobalamin)", timing: "Week 0", price: "₹300–600", why: "Vegetarian and vegan diets provide no reliable B12. Test before supplementing to establish baseline." });
  }

  tests.sort((a, b) => {
    const order: Record<string, number> = { critical: 0, high: 1, medium: 2 };
    return order[a.priority] - order[b.priority];
  });

  return {
    tests,
    labChains: profile.cityContext.lab_chains,
    fasting_protocol: "Fast for 10–12 hours before blood tests (water is fine). Collect thyroid blood before 10 AM for accuracy.",
    baseCost: "₹1,500–3,500",
    comprehensiveCost: "₹3,500–6,500",
    week12: "Retest: Vitamin D, CBC, Thyroid (if applicable), PCOS panel (if applicable). Compare to baseline to measure 90-day impact.",
  };
}
