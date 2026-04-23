/**
 * Supplement catalog with evidence tiers.
 *
 * Tier 1 — Multiple RCTs / meta-analyses support the use.
 * Tier 2 — Mechanistic + observational evidence; some RCTs.
 * Tier 3 — Traditional / emerging; mechanistic plausibility only.
 */

export type EvidenceTier = "Tier 1" | "Tier 2" | "Tier 3";

export interface SupplementSpec {
  id: string;
  name: string;
  nameHi?: string;
  dose: string;
  doseHi?: string;
  timing: string;
  timingHi?: string;
  evidenceTier: EvidenceTier;
  evidenceSummary: string;
  evidenceSummaryHi?: string;
  category: "foundation" | "targeted" | "maintenance" | "condition-specific";
  approxCostInr: string;
  /** ingredient tags so contraindication matrix can match */
  tags: string[];
}

export const SUPPLEMENT_CATALOG: Record<string, SupplementSpec> = {
  vitamin_d3: {
    id: "vitamin_d3",
    name: "Vitamin D3 (cholecalciferol)",
    nameHi: "विटामिन D3",
    dose: "60,000 IU once weekly × 8 wks, then 2,000 IU daily with fat",
    doseHi: "60,000 IU सप्ताह में एक बार × 8 सप्ताह, फिर 2,000 IU रोज वसा के साथ",
    timing: "With largest fat-containing meal",
    timingHi: "सबसे बड़े वसायुक्त भोजन के साथ",
    evidenceTier: "Tier 1",
    evidenceSummary: "Multiple RCTs: corrects deficiency, supports bone, immune, mood. >70% Indians deficient.",
    evidenceSummaryHi: "कई RCTs: कमी सुधार, हड्डी, प्रतिरक्षा, मूड। 70%+ भारतीयों में कमी।",
    category: "foundation",
    approxCostInr: "₹150–200/mo",
    tags: ["vitamin-d", "fat-soluble"],
  },
  magnesium_bisglycinate: {
    id: "magnesium_bisglycinate",
    name: "Magnesium bisglycinate",
    nameHi: "मैग्नीशियम बिसग्लीसिनेट",
    dose: "300–400 mg",
    doseHi: "300–400 mg",
    timing: "60 min before bed",
    timingHi: "सोने से 60 मिनट पहले",
    evidenceTier: "Tier 1",
    evidenceSummary: "RCTs: improves sleep onset and quality; reduces nocturnal cortisol. Bisglycinate form is gentlest on gut.",
    evidenceSummaryHi: "RCTs: नींद की गुणवत्ता और कोर्टिसोल कम। बिसग्लीसिनेट रूप पेट पर सौम्य।",
    category: "foundation",
    approxCostInr: "₹350–500/mo",
    tags: ["magnesium", "mineral"],
  },
  omega3_fish: {
    id: "omega3_fish",
    name: "Omega-3 fish oil (EPA + DHA)",
    nameHi: "ओमेगा-3 (मछली का तेल)",
    dose: "1,000–2,000 mg combined EPA+DHA",
    doseHi: "1,000–2,000 mg EPA+DHA",
    timing: "With largest meal",
    timingHi: "सबसे बड़े भोजन के साथ",
    evidenceTier: "Tier 1",
    evidenceSummary: "Strong RCT evidence for triglycerides, anti-inflammatory effect, cardiovascular protection.",
    evidenceSummaryHi: "ट्राइग्लिसराइड, सूजन-रोधी, हृदय सुरक्षा के लिए मजबूत RCT साक्ष्य।",
    category: "foundation",
    approxCostInr: "₹500–800/mo",
    tags: ["omega-3", "fish", "seafood"],
  },
  omega3_algae: {
    id: "omega3_algae",
    name: "Omega-3 algal oil (EPA + DHA, vegan)",
    nameHi: "ओमेगा-3 (शैवाल-आधारित, शाकाहारी)",
    dose: "1,000–2,000 mg combined EPA+DHA",
    doseHi: "1,000–2,000 mg EPA+DHA",
    timing: "With largest meal",
    timingHi: "सबसे बड़े भोजन के साथ",
    evidenceTier: "Tier 1",
    evidenceSummary: "Bioequivalent to fish oil for EPA/DHA delivery in RCTs; suitable for vegetarians and seafood-intolerant users.",
    evidenceSummaryHi: "RCTs में मछली के तेल के बराबर। शाकाहारी और समुद्री-असहिष्णु के लिए उपयुक्त।",
    category: "foundation",
    approxCostInr: "₹800–1,200/mo",
    tags: ["omega-3", "algae", "vegan"],
  },
  b12_methyl: {
    id: "b12_methyl",
    name: "Vitamin B12 (methylcobalamin)",
    nameHi: "विटामिन B12 (मिथाइलकोबालामिन)",
    dose: "500 mcg sublingual daily",
    doseHi: "500 mcg सबलिंगुअल रोज",
    timing: "Morning, away from food",
    timingHi: "सुबह, भोजन से पहले",
    evidenceTier: "Tier 1",
    evidenceSummary: "Verified deficiency prevalent in vegetarians; supplementation reverses fatigue and neurologic symptoms.",
    evidenceSummaryHi: "शाकाहारियों में कमी आम; पूरक थकान/तंत्रिका लक्षण ठीक करता है।",
    category: "foundation",
    approxCostInr: "₹200–400/mo",
    tags: ["b12", "vitamin-b"],
  },
  ashwagandha_ksm66: {
    id: "ashwagandha_ksm66",
    name: "Ashwagandha (KSM-66)",
    nameHi: "अश्वगंधा KSM-66",
    dose: "300 mg morning + 300 mg evening (cycle 5 on / 2 off)",
    doseHi: "सुबह 300mg + शाम 300mg (5 दिन ON, 2 दिन OFF)",
    timing: "With food",
    timingHi: "भोजन के साथ",
    evidenceTier: "Tier 2",
    evidenceSummary: "Multiple smaller RCTs show ~23% cortisol reduction and improved sleep; long-term safety still under study.",
    evidenceSummaryHi: "RCTs में ~23% कोर्टिसोल कम, नींद सुधार; दीर्घकालिक सुरक्षा पर अध्ययन जारी।",
    category: "targeted",
    approxCostInr: "₹400–600/mo",
    tags: ["ashwagandha", "adaptogen", "thyroid-modulator"],
  },
  probiotics_multi: {
    id: "probiotics_multi",
    name: "Probiotics (multi-strain)",
    nameHi: "प्रोबायोटिक (मल्टी-स्ट्रेन)",
    dose: "10–50 billion CFU",
    doseHi: "10–50 अरब CFU",
    timing: "Empty stomach, morning",
    timingHi: "सुबह खाली पेट",
    evidenceTier: "Tier 2",
    evidenceSummary: "RCT support for IBS, constipation, antibiotic-associated diarrhea; strain-specific effects vary.",
    evidenceSummaryHi: "IBS, कब्ज, एंटीबायोटिक-दस्त के लिए RCT समर्थन; प्रभाव स्ट्रेन-विशिष्ट।",
    category: "targeted",
    approxCostInr: "₹400–700/mo",
    tags: ["probiotic", "gut"],
  },
  myo_inositol: {
    id: "myo_inositol",
    name: "Myo-Inositol + D-Chiro-Inositol (4:1)",
    nameHi: "Myo-इनोसिटोल + D-Chiro (4:1)",
    dose: "Myo 2 g + D-Chiro 50 mg twice daily",
    doseHi: "Myo 2g + D-Chiro 50mg दिन में दो बार",
    timing: "With meals",
    timingHi: "भोजन के साथ",
    evidenceTier: "Tier 1",
    evidenceSummary: "Strong RCT evidence in PCOS: improves insulin sensitivity, reduces androgens, restores ovulation.",
    evidenceSummaryHi: "PCOS में मजबूत RCT साक्ष्य: इंसुलिन संवेदनशीलता, एण्ड्रोजन कम, अंडोत्सर्ग सुधार।",
    category: "condition-specific",
    approxCostInr: "₹800–1,200/mo",
    tags: ["inositol", "pcos"],
  },
  selenium: {
    id: "selenium",
    name: "Selenium (selenomethionine)",
    nameHi: "सेलेनियम",
    dose: "200 mcg daily (max 400 mcg)",
    doseHi: "200 mcg/दिन (अधिकतम 400 mcg)",
    timing: "With food",
    timingHi: "भोजन के साथ",
    evidenceTier: "Tier 2",
    evidenceSummary: "RCTs: supports T4→T3 conversion and reduces TPO antibody titres in autoimmune thyroid disease.",
    evidenceSummaryHi: "RCTs: T4→T3 रूपांतरण समर्थन; ऑटोइम्यून थायरॉइड में TPO एंटीबॉडी कम।",
    category: "condition-specific",
    approxCostInr: "₹300–500/mo",
    tags: ["selenium", "thyroid"],
  },
  zinc: {
    id: "zinc",
    name: "Zinc (citrate or picolinate)",
    nameHi: "जिंक",
    dose: "25 mg elemental (max 40 mg/day)",
    doseHi: "25mg (अधिकतम 40mg/दिन)",
    timing: "With food, away from magnesium",
    timingHi: "भोजन के साथ, मैग्नीशियम से अलग",
    evidenceTier: "Tier 2",
    evidenceSummary: "RCT support for immune function and skin healing; competes with magnesium absorption when co-dosed.",
    evidenceSummaryHi: "प्रतिरक्षा/त्वचा के लिए RCT समर्थन; मैग्नीशियम के साथ अवशोषण प्रतिस्पर्धा।",
    category: "maintenance",
    approxCostInr: "₹200–350/mo",
    tags: ["zinc", "mineral"],
  },
  curcumin_piperine: {
    id: "curcumin_piperine",
    name: "Curcumin + piperine",
    nameHi: "कर्क्यूमिन + पिपेरिन",
    dose: "500–1,000 mg curcumin + 20 mg piperine",
    doseHi: "500–1,000 mg कर्क्यूमिन + 20 mg पिपेरिन",
    timing: "With food, 2 hrs apart from iron",
    timingHi: "भोजन के साथ, आयरन से 2 घंटे पहले/बाद",
    evidenceTier: "Tier 3",
    evidenceSummary: "Mechanistic anti-inflammatory; piperine boosts bioavailability ~20×. Limited large RCTs.",
    evidenceSummaryHi: "सूजन-रोधी; पिपेरिन से ~20× अवशोषण। बड़े RCT सीमित।",
    category: "maintenance",
    approxCostInr: "₹400–600/mo",
    tags: ["curcumin", "anti-inflammatory"],
  },
  l_theanine: {
    id: "l_theanine",
    name: "L-Theanine",
    nameHi: "L-थियानिन",
    dose: "100–200 mg",
    doseHi: "100–200 mg",
    timing: "Evening or with caffeine",
    timingHi: "शाम को या कैफीन के साथ",
    evidenceTier: "Tier 2",
    evidenceSummary: "Small RCTs: promotes alpha-wave relaxation and mitigates caffeine jitters.",
    evidenceSummaryHi: "छोटे RCTs: शांति बढ़ाता है, कैफीन प्रभाव संतुलित करता है।",
    category: "targeted",
    approxCostInr: "₹250–500/mo",
    tags: ["theanine"],
  },
  iron_bisglycinate: {
    id: "iron_bisglycinate",
    name: "Iron bisglycinate",
    nameHi: "आयरन बिसग्लीसिनेट",
    dose: "25 mg elemental iron",
    doseHi: "25 mg एलिमेंटल आयरन",
    timing: "Empty stomach with vitamin C; only if labs confirm deficiency",
    timingHi: "खाली पेट विटामिन C के साथ; केवल लैब-पुष्ट कमी पर",
    evidenceTier: "Tier 1",
    evidenceSummary: "Reverses iron-deficiency anemia in RCTs; bisglycinate is better tolerated than sulphate.",
    evidenceSummaryHi: "आयरन-कमी एनीमिया में RCT-प्रमाणित; बिसग्लीसिनेट सहनीय।",
    category: "condition-specific",
    approxCostInr: "₹250–400/mo",
    tags: ["iron"],
  },
};

export function getSupplement(id: string): SupplementSpec | undefined {
  return SUPPLEMENT_CATALOG[id];
}
