export const PLAN_IDS = {
  FREE: "free_blueprint",
  ESSENTIAL: "essential_blueprint",
  PREMIUM: "premium_blueprint",
  COACHING: "coaching_blueprint",
  SUBSCRIPTION: "subscription_all_access",
} as const;

export const ADDON_IDS = {
  DNA: "addon_dna",
  SUPPLEMENT: "addon_supplement",
  ATHLETE: "addon_athlete",
  FAMILY_2: "addon_family_2",
  FAMILY_4: "addon_family_4",
  WOMEN_HORMONE: "addon_women_hormone",
  MEN_FITNESS: "addon_men_fitness",
  LAB_INTERPRETATION: "addon_lab_interpretation",
  // Legacy IDs — preserved so historic purchase rows still resolve.
  // Not offered for new purchases (filtered out of /api/addons + Pricing UI).
  FAMILY: "addon_family",
  PRODUCTS: "addon_products",
} as const;

// Add-ons that are no longer sold directly but kept for historic-order resolution.
export const DEPRECATED_ADDON_IDS: readonly string[] = [
  "addon_products",
  "addon_family",
];

// Products bundled into Pro+ tier and above (no separate add-on purchase).
export const PRODUCTS_BUNDLED_PLAN_IDS: readonly string[] = [
  "premium_blueprint",
  "coaching_blueprint",
  "subscription_all_access",
];

export interface Product {
  id: string;
  planId?: string;
  name: string;
  description: string;
  details: string[];
  price: number;
  originalPrice?: number;
  color: string;
  icon: string;
  link: string;
  pageCount: number;
  pdfContent?: string;
  badge?: string;
  popular?: boolean;
}

export interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  icon: string;
  features: string[];
  pageCountAddition: number;
  visible?: boolean;
}

/**
 * Per-add-on scope payload. Phase 3 — captures the structured choices
 * the user made when buying an add-on (family member count, lab cadence,
 * etc.) so order persistence and the PDF generator can use them.
 * Optional and forward-compatible: existing call sites that ignore it
 * keep working untouched.
 */
export interface AddOnScope {
  familyMemberCount?: 2 | 4;
  labReviewCadence?: "monthly" | "quarterly" | "semiannual";
  notes?: string;
}

export interface PlanConfiguration {
  planId: string;
  selectedAddOns: string[];
  /** Per-add-on scope keyed by add-on id (e.g. "addon_family_4"). */
  addOnScope?: Record<string, AddOnScope>;
  totalPrice: number;
  userName?: string;
  userEmail?: string;
}

export const FREE_BLUEPRINT: Product = {
  id: "free-blueprint",
  planId: PLAN_IDS.FREE,
  name: "Basic Plan",
  description: "Basic personalized insights from your core health inputs.",
  details: [
    "Health score dashboard",
    "Basic daily habits",
    "Circadian rhythm assessment",
    "Simple hydration plan",
    "Quick-start checklist",
  ],
  price: 0,
  originalPrice: 499,
  color: "gray",
  icon: "gift",
  link: "/quiz",
  pageCount: 10,
  badge: "Awareness",
};

export const ESSENTIAL_BLUEPRINT: Product = {
  id: "essential-blueprint",
  planId: PLAN_IDS.ESSENTIAL,
  name: "Personalized Pro",
  description: "Structured personalized foundation with custom macros, training plan, and meal timing.",
  price: 499,
  originalPrice: 699,
  color: "blue",
  icon: "star",
  link: "/quiz",
  pageCount: 14,
  badge: "Planning",
  details: [
    "Everything in Basic Plan",
    "Custom macronutrient targets (protein/carbs/fats)",
    "BMI & metabolic analysis",
    "Basic meal timing framework",
    "3-day structured training plan",
    "Stress management basics",
    "Lab test recommendations",
  ],
};

export const PREMIUM_BLUEPRINT: Product = {
  id: "premium-blueprint",
  planId: PLAN_IDS.PREMIUM,
  name: "Personalized Pro+",
  description: "Deep hyper-personalized system with full meal plan, supplement stack, daily schedule, and adaptive rules.",
  price: 999,
  originalPrice: 1799,
  color: "green",
  icon: "zap",
  link: "/quiz",
  pageCount: 19,
  badge: "Transformation",
  popular: true,
  details: [
    "Everything in Personalized Pro",
    "Full 7-day personalized meal plan",
    "Complete supplement stack with timing",
    "Curated India-specific product recommendations (included)",
    "Daily schedule integration",
    "Adaptive rules engine",
    "Digestive health protocol",
    "Gut microbiome restoration guide",
    "Personal tracking dashboard",
  ],
};

export const COMPLETE_COACHING: Product = {
  id: "complete-coaching",
  planId: PLAN_IDS.COACHING,
  name: "Done-With-You System",
  description: "Guided implementation system with weekly execution plan, accountability, and habit change framework.",
  price: 2999,
  originalPrice: 5999,
  color: "orange",
  icon: "heart",
  link: "/quiz",
  pageCount: 24,
  badge: "Execution",
  details: [
    "Everything in Personalized Pro+",
    "Weekly execution plan & roadmap",
    "Accountability & progress worksheets",
    "Habit formation framework",
    "Coaching methodology guide",
    "Obstacle-overcoming playbook",
    "90-day transformation timeline",
    "Priority implementation support",
  ],
};

export const ALL_ACCESS_SUBSCRIPTION: Product = {
  id: "all-access-subscription",
  planId: PLAN_IDS.SUBSCRIPTION,
  name: "All Access — 45-Day Launch Offer",
  description: "Everything GeneWell offers. Every core plan + every add-on, unlocked for one user. Limited launch pricing.",
  price: 1999,
  originalPrice: 6499,
  color: "purple",
  icon: "crown",
  link: "/quiz",
  pageCount: 35,
  badge: "All Access",
  popular: false,
  details: [
    "All 4 core plans included (Basic → Coaching)",
    "All add-ons unlocked (DNA, Supplements, Athlete, Family-2/4, Women's Health, Men's Performance, Lab-Test Interpretation)",
    "35+ page personalized blueprint",
    "90-day weight projection + adaptive logic",
    "PCOS, thyroid & condition-specific protocols",
    "Cycle-synced women's hormonal health plan",
    "Advanced supplement protocol (12-week phased)",
    "Lab test panel with Indian lab pricing",
    "Priority delivery — report in 30 seconds",
    "Valid for 45 days from purchase (launch offer)",
  ],
};

export const products: Product[] = [
  FREE_BLUEPRINT,
  ESSENTIAL_BLUEPRINT,
  PREMIUM_BLUEPRINT,
  COMPLETE_COACHING,
  ALL_ACCESS_SUBSCRIPTION,
];

export const getProductById = (id: string): Product | undefined => {
  return products.find((p) => p.id === id);
};

export const getProductByPlanId = (planId: string): Product | undefined => {
  return products.find((p) => p.planId === planId);
};

export const defaultAddOns: AddOn[] = [
  {
    id: ADDON_IDS.DNA,
    name: "DNA & Genetics Guide",
    description: "Understand how your genes affect nutrition, caffeine metabolism, and exercise response",
    price: 149,
    originalPrice: 299,
    icon: "dna",
    pageCountAddition: 3,
    features: [
      "MTHFR methylation status (folate processing)",
      "CYP1A2 caffeine metabolism (fast vs. slow)",
      "ACTN3 muscle fiber type (power vs. endurance)",
      "Gene limitations explained honestly",
      "Practical training & nutrition modifications",
      "Gene-specific lab test recommendations",
    ],
  },
  {
    id: ADDON_IDS.SUPPLEMENT,
    name: "Advanced Supplement Protocol",
    description: "12-week periodized supplement strategy with brand recommendations and lab-based dosing",
    price: 199,
    originalPrice: 349,
    icon: "pill",
    pageCountAddition: 3,
    features: [
      "Deficiency testing interpretation guide",
      "12-week periodized supplement protocol",
      "Trusted Indian brand recommendations",
      "Timing & stacking strategy",
      "Loading, maintenance & deload phases",
      "Lab tests to determine necessity",
    ],
  },
  {
    id: ADDON_IDS.ATHLETE,
    name: "Athletic Performance Pack",
    description: "Sport-specific training, energy systems, and competition fueling strategy",
    price: 149,
    originalPrice: 299,
    icon: "target",
    pageCountAddition: 2,
    features: [
      "Sport-specific 12-week periodization",
      "Energy system training (aerobic, lactate, alactic)",
      "Competition fueling strategy",
      "Post-competition recovery protocols",
      "Performance metrics (HRV, VO2max, time trials)",
      "Advanced lab testing for athletes",
    ],
  },
  {
    id: ADDON_IDS.FAMILY_2,
    name: "Family Plan — 2 Reports",
    description: "Two personalized reports — typically a couple, or a parent + child — with shared-meal modifier table",
    price: 199,
    originalPrice: 299,
    icon: "users",
    pageCountAddition: 4,
    features: [
      "2 personalized reports (one per profile)",
      "Age-stratified target adjustments",
      "Shared-meal modifier table",
      "One grocery list, two sets of needs",
      "Shared vs. individual lab tests",
    ],
  },
  {
    id: ADDON_IDS.FAMILY_4,
    name: "Family Plan — 4 Reports",
    description: "Four personalized reports for a full household with shared-meal modifier table and per-person targets",
    price: 349,
    originalPrice: 499,
    icon: "users",
    pageCountAddition: 6,
    features: [
      "4 personalized reports (one per profile)",
      "Age-stratified targets per household member",
      "Shared-meal modifier table",
      "One shopping list, four nutrition profiles",
      "Shared vs. individual lab tests",
    ],
  },
  {
    id: ADDON_IDS.WOMEN_HORMONE,
    name: "Women's Hormonal Health",
    description: "Cycle-synced nutrition, PCOS support, and hormone-aware training protocols",
    price: 199,
    originalPrice: 349,
    icon: "heart",
    pageCountAddition: 2,
    features: [
      "Menstrual cycle-synced nutrition (follicular/luteal)",
      "PCOS insulin-sensitivity strategies",
      "Thyroid-supporting nutrition protocols",
      "Training adjustments by cycle phase",
      "Hormonal health explained simply",
      "Priority hormone lab tests (TSH, LH/FSH, prolactin)",
    ],
  },
  {
    id: ADDON_IDS.MEN_FITNESS,
    name: "Men's Performance Pack",
    description: "Muscle-building framework, testosterone support, and advanced strength programming",
    price: 199,
    originalPrice: 349,
    icon: "zap",
    pageCountAddition: 2,
    features: [
      "Muscle-building nutrition (surplus, protein timing)",
      "Testosterone-supporting habits & training",
      "12-week progressive overload programming",
      "Plateau-breaking strategies",
      "Recovery & strength progression",
      "Relevant lab tests (lipid, glucose, testosterone)",
    ],
  },
  {
    id: ADDON_IDS.LAB_INTERPRETATION,
    name: "Quarterly Lab-Test Interpretation",
    description: "Quarterly lab panel personalized to your profile, with each marker translated into a concrete adjustment to your plan",
    price: 249,
    originalPrice: 449,
    icon: "flask-conical",
    pageCountAddition: 3,
    features: [
      "Quarterly panel scoped to your conditions & goals",
      "Each marker mapped to a plan adjustment (not generic ranges)",
      "PCOS / thyroid / metabolic-specific interpretation paths",
      "Indian lab pricing & where-to-test guidance",
      "Re-test cadence and next-quarter targets",
    ],
  },
];

export let addOns: AddOn[] = [...defaultAddOns];

export function setAddOns(newAddOns: AddOn[]) {
  addOns = newAddOns;
}

/**
 * Display-only fallbacks for add-on ids that have been removed from the
 * sellable catalog but are still referenced as tier-bundled or
 * auto-included entries (Phase 3). Lets checkout, order summaries, and
 * the PDF renderer always show a human-readable name even though the
 * SKU can no longer be purchased standalone.
 */
const VIRTUAL_ADDONS: Record<string, AddOn> = {
  addon_products: {
    id: "addon_products",
    name: "Curated Product Recommendations",
    description: "Personalised supplement, food, and equipment picks. Bundled free with Pro+ and above.",
    price: 0,
    icon: "Package",
    features: [
      "Curated supplement brands matched to your profile",
      "Food + equipment picks tied to your plan",
      "No separate purchase needed on Pro+",
    ],
    pageCountAddition: 4,
    visible: false,
  },
};

export const getAddOnById = (id: string): AddOn | undefined => {
  return addOns.find((ao) => ao.id === id) ?? VIRTUAL_ADDONS[id];
};
