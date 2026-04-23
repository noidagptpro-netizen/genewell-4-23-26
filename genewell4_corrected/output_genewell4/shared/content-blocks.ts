/**
 * Content-block library for personalized PDF sections.
 *
 * Each section has a set of variants keyed by an opaque id. The decision
 * engine picks one id per section per user. Variants are bilingual EN/HI
 * and may carry small structured fields the renderer consumes.
 *
 * Sections that remain pure templates (medical disclaimer, methodology,
 * closing pages) are not represented here.
 */

export type SectionId =
  | "nutritionPrinciples"
  | "sleepProtocol"
  | "stressProtocol"
  | "supplementStrategy"
  | "gutHealth"
  | "skinHealth"
  | "mealTiming"
  | "movementBias"
  | "womensHormonal"
  | "addonDnaIntro"
  | "addonSupplementIntro"
  | "addonAthleteIntro"
  | "addonFamilyIntro"
  | "addonWomenHormoneIntro"
  | "addonMenFitnessIntro"
  | "addonLabInterpretation";

export interface BilingualText {
  en: string;
  hi: string;
}

export interface VariantBlock {
  id: string;
  /** Short label for variant in dev tooling / verification reports. */
  label: string;
  /** Body paragraphs to render. */
  body: BilingualText[];
  /** Optional bullet list to render after body. */
  bullets?: BilingualText[];
}

export type ContentBlockLibrary = Record<SectionId, Record<string, VariantBlock>>;

export const CONTENT_BLOCKS: ContentBlockLibrary = {} as ContentBlockLibrary;
Object.assign(CONTENT_BLOCKS, {
  nutritionPrinciples: {
    pcos_insulin: {
      id: "pcos_insulin",
      label: "PCOS / insulin-resistance focus",
      body: [
        { en: "Your PCOS profile points to insulin resistance as the primary lever. We anchor every meal in fibre + protein first, keep refined carbs out of breakfast, and pair any starch with healthy fat to flatten the post-meal glucose spike.",
          hi: "आपकी PCOS प्रोफ़ाइल इंसुलिन प्रतिरोध को मुख्य कारक बताती है। हर भोजन फाइबर + प्रोटीन से शुरू करें, नाश्ते में रिफाइंड कार्ब न लें, स्टार्च के साथ स्वस्थ वसा लें ताकि शर्करा का उछाल कम हो।" },
      ],
      bullets: [
        { en: "Glucose-spike control: protein/fat first, carbs last in each meal.", hi: "ग्लूकोज़ स्पाइक नियंत्रण: हर भोजन में प्रोटीन/वसा पहले, कार्ब अंत में।" },
        { en: "10-minute walk after lunch and dinner.", hi: "दोपहर/रात के भोजन के बाद 10 मिनट टहलें।" },
        { en: "Daily 30 g fibre target from vegetables, legumes, millets.", hi: "रोज 30 ग्राम फाइबर — सब्ज़ियों, दालों, मोटे अनाज से।" },
      ],
    },
    thyroid_focus: {
      id: "thyroid_focus",
      label: "Thyroid-supportive nutrition",
      body: [
        { en: "With your thyroid history, we prioritise nutrient density (selenium, zinc, iodine, iron) and steady energy intake over aggressive deficits — under-eating slows thyroid output further.",
          hi: "आपकी थायरॉइड स्थिति के कारण हम पोषक घनत्व (सेलेनियम, जिंक, आयोडीन, आयरन) और स्थिर ऊर्जा को प्राथमिकता देते हैं — बहुत कम खाना थायरॉइड को और धीमा करता है।" },
      ],
      bullets: [
        { en: "Eat at maintenance or modest 200 kcal deficit only.", hi: "रखरखाव या केवल 200 kcal की हल्की कमी पर खाएं।" },
        { en: "Brazil nuts (1–2/day) for selenium if no nut intolerance.", hi: "अगर नट्स से एलर्जी नहीं तो रोज 1-2 ब्राज़ील नट्स।" },
        { en: "Iron-rich greens with vitamin C; avoid coffee within 1 hr of meals.", hi: "विटामिन C के साथ आयरन-समृद्ध हरी सब्ज़ी; भोजन के 1 घंटे के भीतर कॉफ़ी नहीं।" },
      ],
    },
    weightloss_default: {
      id: "weightloss_default",
      label: "General weight-loss / metabolic profile",
      body: [
        { en: "Your fat-loss target is best served by a moderate (~450 kcal) deficit, high protein to protect lean mass, and consistent 3-meal timing — without skipped meals that drive evening overeating.",
          hi: "वसा-कमी के लिए मध्यम (~450 kcal) कमी, उच्च प्रोटीन और 3-भोजन का नियमित समय सर्वोत्तम है — भोजन छोड़ने से शाम को अधिक खाने की प्रवृत्ति बनती है।" },
      ],
      bullets: [
        { en: "1.6–2.0 g/kg protein per day spread across meals.", hi: "रोज 1.6–2.0 g/kg प्रोटीन भोजन में बाँटें।" },
        { en: "Half the plate non-starchy vegetables at lunch and dinner.", hi: "दोपहर/रात में आधा प्लेट गैर-स्टार्च वाली सब्ज़ी।" },
        { en: "No liquid calories (sweetened tea, soft drinks, fruit juice).", hi: "मीठा पेय/चाय/जूस नहीं।" },
      ],
    },
    musclegain_default: {
      id: "musclegain_default",
      label: "Lean mass-gain profile",
      body: [
        { en: "Muscle gain requires a 200–300 kcal surplus, 4 protein-anchored eating windows, and progressive resistance training 3–5×/week. Quality of food matters more than quantity once protein and total calories are met.",
          hi: "मांसपेशी वृद्धि के लिए 200–300 kcal अधिशेष, 4 प्रोटीन-केंद्रित भोजन और सप्ताह में 3-5 बार प्रतिरोध प्रशिक्षण आवश्यक है।" },
      ],
      bullets: [
        { en: "Pre-/post-workout protein: 25–35 g within 1 hour of training.", hi: "प्रशिक्षण के पहले/बाद 1 घंटे में 25–35g प्रोटीन।" },
        { en: "Carbs around workouts; less around sedentary blocks.", hi: "व्यायाम के आसपास कार्ब; गतिहीन समय में कम।" },
      ],
    },
    maintenance_default: {
      id: "maintenance_default",
      label: "General wellness / maintenance",
      body: [
        { en: "You are within a healthy range. The plan keeps you there: eat at maintenance, 25 g fibre daily, 80% whole foods, and one structured movement block per day.",
          hi: "आप स्वस्थ सीमा में हैं। योजना आपको वहीं बनाए रखती है: रखरखाव पर खाएं, रोज 25 ग्राम फाइबर, 80% साबुत आहार और रोज एक संरचित गतिविधि।" },
      ],
    },
  },

  sleepProtocol: {
    severe_disruption: {
      id: "severe_disruption",
      label: "Severe sleep disruption (<6 hrs / very low score)",
      body: [
        { en: "Your sleep score is in the high-risk band. The first job is rebuilding sleep pressure: fixed wake time every day (including weekends), no screens 60 min before bed, bedroom < 20°C, and a 60-min wind-down sequence.",
          hi: "आपका नींद स्कोर उच्च-जोखिम क्षेत्र में है। पहला कार्य नींद का दबाव पुनर्निर्माण है: हर दिन (सप्ताहांत भी) निश्चित जागने का समय, सोने से 60 मिनट पहले स्क्रीन नहीं, कमरा 20°C से कम, और 60 मिनट शांत करने की दिनचर्या।" },
      ],
      bullets: [
        { en: "Magnesium bisglycinate 300–400 mg, 60 min before bed.", hi: "सोने से 60 मिनट पहले मैग्नीशियम बिसग्लीसिनेट 300–400 mg।" },
        { en: "Caffeine cut-off: 10:00 AM.", hi: "कैफ़ीन सीमा: सुबह 10 बजे।" },
        { en: "Reassess in 2 weeks; if no gain, request sleep-medicine consult.", hi: "2 सप्ताह में पुनरावलोकन; सुधार न हो तो नींद-विशेषज्ञ से मिलें।" },
      ],
    },
    moderate_improvable: {
      id: "moderate_improvable",
      label: "Moderate sleep — improvable with hygiene",
      body: [
        { en: "Sleep duration is acceptable but quality has room to grow. Anchor the wake time, cool the bedroom, and front-load light + activity in the first 2 hours of the day to consolidate the circadian signal.",
          hi: "नींद की अवधि ठीक है, गुणवत्ता बढ़ा सकते हैं। निश्चित जागने का समय, ठंडा कमरा और दिन के पहले 2 घंटों में प्रकाश + गतिविधि सर्केडियन संकेत मज़बूत करते हैं।" },
      ],
    },
    healthy_maintain: {
      id: "healthy_maintain",
      label: "Healthy sleep — maintain",
      body: [
        { en: "Your sleep is already serving you. Maintain the consistent schedule, dark cool bedroom, and avoid late caffeine — these are the single biggest predictors of staying healthy here.",
          hi: "आपकी नींद अच्छी है। निरंतर समय, अंधेरा/ठंडा कमरा और देर से कैफीन से बचाव — यही दीर्घकालिक स्वास्थ्य सुनिश्चित करते हैं।" },
      ],
    },
  },

  stressProtocol: {
    high_burnout_risk: {
      id: "high_burnout_risk",
      label: "Very-high stress — burnout risk",
      body: [
        { en: "Your stress profile is in the high-cortisol burnout band. We pair daily nervous-system regulation (4-7-8 breath, 20-min walk) with reduced training volume for 2 weeks before adding adaptogens.",
          hi: "आपकी तनाव प्रोफ़ाइल उच्च-कोर्टिसोल बर्नआउट सीमा में है। दैनिक तंत्रिका-नियंत्रण (4-7-8 श्वास, 20-min चलना) के साथ 2 सप्ताह तक प्रशिक्षण कम करें, फिर एडाप्टोजेन जोड़ें।" },
      ],
    },
    moderate_buffering: {
      id: "moderate_buffering",
      label: "Moderate stress — buffer",
      body: [
        { en: "Your stress is manageable but unbuffered. A 10-min daily breathing or meditation block, plus 8,000 steps, will keep cortisol from climbing into burnout territory.",
          hi: "आपका तनाव प्रबंधनीय है पर सुरक्षा-कवच कमज़ोर है। रोज 10 मिनट श्वास/ध्यान + 8,000 कदम कोर्टिसोल को बढ़ने से रोकेंगे।" },
      ],
    },
    low_maintain: {
      id: "low_maintain",
      label: "Low stress — maintain",
      body: [
        { en: "Stress is currently low. Continue what's working — sleep, social connection, and weekly movement are your maintenance pillars here.",
          hi: "तनाव कम है। नींद, सामाजिक जुड़ाव और साप्ताहिक गतिविधि आपके रखरखाव स्तंभ हैं।" },
      ],
    },
  },

  supplementStrategy: {
    foundation_only: {
      id: "foundation_only",
      label: "Foundation stack only",
      body: [
        { en: "Your data does not justify advanced stacks. Start with foundation supplements (D3, magnesium, omega-3, B12 if vegetarian) for 8 weeks, retest deficiencies, then reassess.",
          hi: "आपके डेटा को उन्नत स्टैक की आवश्यकता नहीं। आधार सप्लीमेंट (D3, मैग्नीशियम, ओमेगा-3, शाकाहारी हो तो B12) 8 सप्ताह तक लें, फिर पुनः आकलन।" },
      ],
    },
    foundation_plus_targeted: {
      id: "foundation_plus_targeted",
      label: "Foundation + targeted (sleep / stress / gut)",
      body: [
        { en: "Beyond the foundation stack, your sleep / stress / gut signals justify targeted additions. Each is layered one at a time, never two new supplements within the same 14-day window.",
          hi: "आधार स्टैक के अलावा आपकी नींद/तनाव/आँत संकेत लक्षित सप्लीमेंट की मांग करते हैं। एक-एक करके जोड़ें, 14 दिन में दो नए कभी नहीं।" },
      ],
    },
    condition_specific: {
      id: "condition_specific",
      label: "Condition-specific (PCOS / thyroid)",
      body: [
        { en: "Your medical context (PCOS / thyroid) shifts the stack: condition-specific supplements move into Phase 1, generic adaptogens defer until labs are reviewed by your physician.",
          hi: "आपकी चिकित्सा स्थिति (PCOS/थायरॉइड) स्टैक बदलती है: स्थिति-विशिष्ट सप्लीमेंट चरण 1 में, सामान्य एडाप्टोजेन तब तक रोकें जब तक चिकित्सक लैब न देखें।" },
      ],
    },
  },

  gutHealth: {
    constipation_focus: {
      id: "constipation_focus",
      label: "Constipation-led",
      body: [
        { en: "Constipation is the dominant gut signal. We focus on hydration (2.5 L), insoluble fibre (vegetables, soaked overnight chia), magnesium citrate at night, and a daily walk after dinner.",
          hi: "कब्ज प्रमुख संकेत है। हाइड्रेशन (2.5 L), अघुलनशील फाइबर (सब्ज़ियाँ, रात भर भिगोए चिया), रात को मैग्नीशियम सिट्रेट और रात्रि भोजन के बाद टहलना।" },
      ],
    },
    bloating_focus: {
      id: "bloating_focus",
      label: "Bloating / gas-led",
      body: [
        { en: "Bloating is your dominant gut signal. We trial 2 weeks of low-FODMAP swaps, eat slowly, and add a multi-strain probiotic only if bloating persists past week 2.",
          hi: "सूजन प्रमुख है। 2 सप्ताह के लिए low-FODMAP, धीरे-धीरे खाएं और 2 सप्ताह बाद भी सूजन हो तो मल्टी-स्ट्रेन प्रोबायोटिक जोड़ें।" },
      ],
    },
    acidity_focus: {
      id: "acidity_focus",
      label: "Acidity / reflux-led",
      body: [
        { en: "Acidity points to upper-GI irritation. We finish dinner ≥ 3 hrs before bed, elevate the head of the bed 6 inches, and trial removal of trigger foods (chilli, coffee, NSAIDs) for 2 weeks.",
          hi: "अम्लता ऊपरी-GI जलन का संकेत है। रात्रि भोजन सोने से ≥ 3 घंटे पहले, सिर 6 इंच ऊँचा, और 2 सप्ताह तक मिर्च/कॉफ़ी/NSAID बंद करें।" },
      ],
    },
    no_issues: {
      id: "no_issues",
      label: "No active gut issues",
      body: [
        { en: "Gut symptoms are absent. Maintenance focus: 25–30 g fibre/day, 30+ plant varieties weekly, fermented foods 3×/week.",
          hi: "लक्षण नहीं हैं। रखरखाव: रोज 25-30g फाइबर, सप्ताह में 30+ पौधों के प्रकार, फरमेंटेड भोजन 3×/सप्ताह।" },
      ],
    },
  },

  skinHealth: {
    acne_focus: {
      id: "acne_focus",
      label: "Acne-led",
      body: [
        { en: "Acne pattern correlates with insulin and inflammation. We minimise high-glycaemic snacks, dairy load, and prioritise zinc and omega-3.",
          hi: "मुहांसे इंसुलिन और सूजन से जुड़े हैं। उच्च-GI स्नैक, डेयरी कम करें; जिंक और ओमेगा-3 प्राथमिकता।" },
      ],
    },
    pigmentation_focus: {
      id: "pigmentation_focus",
      label: "Pigmentation / aging-led",
      body: [
        { en: "Pigmentation responds to sun-discipline + antioxidants. Daily SPF 50, vitamin C topically AM, and dietary polyphenols (berries, green tea, dark leafy veg).",
          hi: "रंजकता धूप-अनुशासन और एंटीऑक्सिडेंट से सुधरती है। रोज SPF 50, सुबह विटामिन C, और बेरी/हरी चाय/हरी पत्तेदार सब्ज़ी।" },
      ],
    },
    dryness_focus: {
      id: "dryness_focus",
      label: "Dryness-led",
      body: [
        { en: "Dryness suggests barrier dysfunction. Add 2 L water, omega-3, ceramide-rich moisturiser AM/PM, and one weekly oil massage.",
          hi: "रूखापन त्वचा बैरियर की कमज़ोरी दर्शाता है। 2 L पानी, ओमेगा-3, सेरामाइड युक्त मॉइस्चराइज़र सुबह/रात और साप्ताहिक तेल मालिश।" },
      ],
    },
    none: {
      id: "none",
      label: "No skin concerns",
      body: [
        { en: "No active skin concerns. Maintenance: SPF 50 daily, gentle cleanser, and sleep ≥ 7 hrs.",
          hi: "त्वचा की कोई शिकायत नहीं। रखरखाव: रोज SPF 50, हल्का क्लींज़र, ≥ 7 घंटे नींद।" },
      ],
    },
  },

  mealTiming: {
    early_riser: {
      id: "early_riser",
      label: "Early riser (before 6 AM)",
      body: [
        { en: "Wake before 6 → eat first meal 6:30–7:30 AM, lunch 12:30–1:30 PM, dinner 7:00–8:00 PM, lights-out by 10:30 PM.",
          hi: "सुबह 6 से पहले उठते हैं → पहला भोजन 6:30-7:30 AM, दोपहर 12:30-1:30 PM, रात 7:00-8:00 PM, सोना 10:30 PM।" },
      ],
    },
    standard: {
      id: "standard",
      label: "Standard (6–8 AM wake)",
      body: [
        { en: "Standard schedule: breakfast 8–9 AM, lunch 1–2 PM, dinner 7:30–8:30 PM, sleep by 11 PM.",
          hi: "मानक: नाश्ता 8-9 AM, दोपहर 1-2 PM, रात 7:30-8:30 PM, सोना 11 PM।" },
      ],
    },
    late_riser: {
      id: "late_riser",
      label: "Late riser (8 AM+)",
      body: [
        { en: "Late wake → shift the eating window to 10 AM–8 PM and pull bedtime earlier each week by 15 min until you reach 11:30 PM lights-out.",
          hi: "देर से उठना → खाने का समय 10 AM-8 PM, और हर सप्ताह सोने का समय 15 मिनट पहले करते जाएं, लक्ष्य 11:30 PM।" },
      ],
    },
  },

  movementBias: {
    cardio_first: {
      id: "cardio_first",
      label: "Cardio-biased plan",
      body: [
        { en: "You enjoy cardio. We anchor 4 cardio sessions/week (zone 2 + 1 interval) with two short full-body strength sessions to protect lean mass.",
          hi: "आपको कार्डियो पसंद है। सप्ताह में 4 कार्डियो (zone 2 + 1 इंटरवल) और 2 छोटे फुल-बॉडी स्ट्रेंथ सत्र।" },
      ],
    },
    strength_first: {
      id: "strength_first",
      label: "Strength-biased plan",
      body: [
        { en: "Your preference and goals point to strength. 4 lifting sessions/week (upper-lower split) plus two 30-min walks for cardio coverage.",
          hi: "आपकी रुचि और लक्ष्य स्ट्रेंथ की ओर। सप्ताह में 4 लिफ्टिंग (अपर-लोअर) और 2 बार 30 मिनट टहलना।" },
      ],
    },
    yoga_walk: {
      id: "yoga_walk",
      label: "Yoga + walking",
      body: [
        { en: "Plan starts where you are: 5 days/week of 30-min walking + 2 yoga or mobility sessions. We add resistance bands by week 4.",
          hi: "योजना यहीं से शुरू: सप्ताह में 5 दिन 30 मिनट टहलें + 2 बार योग/गतिशीलता। 4वें सप्ताह में बैंड जोड़ें।" },
      ],
    },
    starter: {
      id: "starter",
      label: "Brand-new exerciser",
      body: [
        { en: "We start at 3×/week 20-min walks, add 2 sessions of bodyweight basics in week 3, and only progress load once form is consistent.",
          hi: "सप्ताह में 3 बार 20-मिनट टहलें, 3वें सप्ताह में 2 बार बॉडीवेट व्यायाम; फॉर्म स्थिर होने पर ही भार बढ़ाएं।" },
      ],
    },
  },

  womensHormonal: {
    pcos: {
      id: "pcos",
      label: "PCOS-specific cycle plan",
      body: [
        { en: "PCOS shifts the cycle plan: lower-glycaemic carbs throughout, inositol from Phase 1, and luteal-phase strength bias to support ovulation in subsequent cycles.",
          hi: "PCOS चक्र योजना बदलती है: हमेशा कम-GI कार्ब, चरण 1 से इनोसिटोल, और ल्यूटियल चरण में स्ट्रेंथ बायस।" },
      ],
    },
    standard_cycle: {
      id: "standard_cycle",
      label: "Standard 28-day cycle plan",
      body: [
        { en: "Standard cycle: lighter calories + lower-intensity training in luteal phase, peak strength in follicular, light yoga during menses.",
          hi: "सामान्य चक्र: ल्यूटियल में हल्की कैलोरी + कम तीव्रता, फॉलिक्युलर में चरम स्ट्रेंथ, मासिक धर्म में हल्का योग।" },
      ],
    },
    perimenopausal: {
      id: "perimenopausal",
      label: "Perimenopausal (40+)",
      body: [
        { en: "Perimenopausal stage: protein bumps to 1.6 g/kg, strength training 3×/week becomes non-negotiable, and bone-supporting calcium + D3 are core.",
          hi: "पेरिमेनोपॉज: प्रोटीन 1.6 g/kg, सप्ताह में 3 बार स्ट्रेंथ अनिवार्य, और हड्डी के लिए कैल्शियम + D3 केंद्रीय।" },
      ],
    },
  },
} satisfies Partial<ContentBlockLibrary>);

const ADDON_BLOCKS_PATCH: Partial<ContentBlockLibrary> = {};
ADDON_BLOCKS_PATCH.addonDnaIntro = {
  low_sleep_fast_caffeine: {
    id: "low_sleep_fast_caffeine",
    label: "Low-sleep + caffeine slow-metabolizer focus",
    body: [
      { en: "Your sleep score sits in a sensitive band, so the gene picks below are framed first around CYP1A2 (caffeine clearance) and MTHFR (energy/methylation). The combined IF/THEN matrix tells you what to change today, not someday.",
        hi: "आपकी नींद स्कोर संवेदनशील बैंड में है, इसलिए नीचे जीन-निर्णय पहले CYP1A2 (कैफीन क्लीयरेंस) और MTHFR (ऊर्जा/मेथिलेशन) पर केंद्रित हैं।" },
    ],
    bullets: [
      { en: "Cut caffeine after 12pm — slow CYP1A2 means stimulants linger 8+ hours.", hi: "दोपहर 12 बजे के बाद कैफीन बंद करें — धीमा CYP1A2 8+ घंटे तक उत्तेजक रखता है।" },
      { en: "Switch to methyl-folate (5-MTHF) instead of standard folic acid.", hi: "मानक फोलिक एसिड के बजाय मेथिल-फोलेट (5-MTHF) पर स्विच करें।" },
      { en: "Anchor sleep window 22:30–06:30 to compound MTHFR-driven repair.", hi: "MTHFR-आधारित मरम्मत के लिए 22:30-06:30 की नींद खिड़की पर टिकें।" },
    ],
  },
  overweight_fto_focus: {
    id: "overweight_fto_focus",
    label: "FTO appetite-regulation focus",
    body: [
      { en: "Your BMI flags FTO as the highest-leverage variant. The gene matrix below puts protein-first eating, sleep, and movement in the order that moves your composition fastest.",
        hi: "आपका BMI FTO को सबसे प्रभावशाली वेरिएंट बनाता है। नीचे की जीन-तालिका प्रोटीन-पहले भोजन, नींद और गतिविधि को प्राथमिकता देती है।" },
    ],
    bullets: [
      { en: "Lead every meal with 30g+ protein — FTO satiety is protein-sensitive.", hi: "हर भोजन 30g+ प्रोटीन से शुरू करें — FTO तृप्ति प्रोटीन-संवेदनशील है।" },
      { en: "Strength-train ≥3×/week to blunt the FTO BMI effect by ~30%.", hi: "FTO BMI प्रभाव ~30% तक कम करने के लिए सप्ताह में ≥3 बार स्ट्रेंथ करें।" },
      { en: "Fixed eating window (10–12h) reduces snacking-driven over-consumption.", hi: "निश्चित भोजन समय (10-12 घं) स्नैकिंग-आधारित अधिक सेवन कम करता है।" },
    ],
  },
  general_balance: {
    id: "general_balance",
    label: "Balanced gene-action default",
    body: [
      { en: "No single gene dominates your profile, so the matrix below balances MTHFR (folate), CYP1A2 (caffeine), ACTN3 (training type), and FTO (appetite) into one set of practical decisions.",
        hi: "कोई एक जीन प्रबल नहीं है, इसलिए मैट्रिक्स MTHFR (फोलेट), CYP1A2 (कैफीन), ACTN3 (प्रशिक्षण प्रकार) और FTO (भूख) को संतुलित निर्णयों में बदलता है।" },
    ],
    bullets: [
      { en: "Keep caffeine ≤300 mg/day and front-load before 2pm.", hi: "कैफीन ≤300 mg/दिन रखें और दोपहर 2 बजे से पहले लें।" },
      { en: "Mix endurance + strength weekly to hedge ACTN3 uncertainty.", hi: "ACTN3 अनिश्चितता को कवर करने के लिए साप्ताहिक सहनशक्ति + स्ट्रेंथ मिलाएं।" },
      { en: "Use a B-complex with active folate as a low-risk default.", hi: "कम-जोखिम विकल्प के रूप में सक्रिय फोलेट वाला B-कॉम्प्लेक्स लें।" },
    ],
  },
};

ADDON_BLOCKS_PATCH.addonSupplementIntro = {
  high_stress_phased: {
    id: "high_stress_phased",
    label: "High-stress phased protocol",
    body: [
      { en: "Your stress profile justifies starting Phase 2 adaptogens (KSM-66 ashwagandha) earlier than the default. Phase 1 still anchors D3, magnesium, and omega-3 for 4 weeks before stacking targeted stress agents on top.",
        hi: "आपका तनाव प्रोफ़ाइल चरण 2 के एडाप्टोजेन (KSM-66 अश्वगंधा) को सामान्य से पहले शुरू करने को सही ठहराता है। चरण 1 में D3, मैग्नीशियम और ओमेगा-3 रहेंगे।" },
    ],
    bullets: [
      { en: "KSM-66 ashwagandha 600 mg/day starts Week 3 (not Week 8).", hi: "KSM-66 अश्वगंधा 600 mg/दिन सप्ताह 3 से शुरू (सप्ताह 8 नहीं)।" },
      { en: "Magnesium glycinate 300 mg at bedtime — improves HRV under stress.", hi: "मैग्नीशियम ग्लाइसिनेट 300 mg सोते समय — तनाव में HRV सुधारता है।" },
      { en: "Re-test cortisol AM + PM at Week 8; titrate adaptogens off the data.", hi: "सप्ताह 8 में कॉर्टिसोल AM+PM दोहराएं; डेटा के अनुसार एडाप्टोजेन समायोजित करें।" },
    ],
  },
  thyroid_priority: {
    id: "thyroid_priority",
    label: "Thyroid-priority stack",
    body: [
      { en: "Your thyroid history shifts the protocol: selenium and zinc move into Phase 1 (T4→T3 conversion support), and Phase 3 generic adaptogens are paused until your TSH/T3/T4 panel is reviewed by a clinician.",
        hi: "आपकी थायरॉइड स्थिति प्रोटोकॉल बदलती है: सेलेनियम और जिंक चरण 1 में जाते हैं, और सामान्य एडाप्टोजेन चरण 3 तब तक रोकें जब तक चिकित्सक TSH/T3/T4 न देखें।" },
    ],
    bullets: [
      { en: "Selenium 200 mcg/day (selenomethionine) supports T4→T3 conversion.", hi: "सेलेनियम 200 mcg/दिन T4→T3 रूपांतरण समर्थन करता है।" },
      { en: "Zinc picolinate 15 mg with food — co-factor for thyroid hormone synthesis.", hi: "ज़िंक पिकोलिनेट 15 mg भोजन के साथ — थायरॉइड हार्मोन संश्लेषण का सह-कारक।" },
      { en: "HOLD ashwagandha until anti-TPO confirmed negative (autoimmune risk).", hi: "एंटी-TPO निगेटिव पुष्ट होने तक अश्वगंधा रोकें (ऑटोइम्यून जोखिम)।" },
    ],
  },
  default_phased: {
    id: "default_phased",
    label: "Default 12-week phased",
    body: [
      { en: "Your data does not push any single supplement to urgent priority, so the protocol follows the standard 12-week phased plan: foundation in Phase 1, targeted layers in Phase 2, condition-aware maintenance in Phase 3.",
        hi: "आपके डेटा में कोई एक सप्लीमेंट तत्काल प्राथमिकता नहीं माँगता, इसलिए प्रोटोकॉल मानक 12-सप्ताह योजना का पालन करता है।" },
    ],
    bullets: [
      { en: "Phase 1 (Wk 1–4): D3 2000 IU + magnesium glycinate 200 mg + omega-3 1g.", hi: "चरण 1 (सप्ताह 1-4): D3 2000 IU + मैग्नीशियम ग्लाइसिनेट 200 mg + ओमेगा-3 1g।" },
      { en: "Phase 2 (Wk 5–8): add B-complex with active folate; review tolerance.", hi: "चरण 2 (सप्ताह 5-8): सक्रिय फोलेट के साथ B-कॉम्प्लेक्स जोड़ें; सहनशीलता देखें।" },
      { en: "Phase 3 (Wk 9–12): retain only what moved your symptoms / labs.", hi: "चरण 3 (सप्ताह 9-12): वही रखें जो लक्षण/लैब बदल पाए।" },
    ],
  },
};

ADDON_BLOCKS_PATCH.addonAthleteIntro = {
  endurance_bias: {
    id: "endurance_bias",
    label: "Endurance / cardio bias",
    body: [
      { en: "Your training preference points to endurance work, so the periodization below front-loads aerobic base + zone-2 mileage and adds two short strength sessions to keep lean mass and joint integrity intact.",
        hi: "आपकी पसंद सहनशक्ति की है, इसलिए नीचे आवधिकता एरोबिक आधार + ज़ोन-2 दूरी पर केंद्रित है और दो छोटे स्ट्रेंथ सत्र जोड़ती है।" },
    ],
    bullets: [
      { en: "Weeks 1–6: 4× zone-2 (45–75 min) + 2× full-body strength (45 min).", hi: "सप्ताह 1-6: 4× ज़ोन-2 (45-75 मि) + 2× पूर्ण-शरीर स्ट्रेंथ (45 मि)।" },
      { en: "Carb intake 5–7 g/kg on long-session days; 3–4 g/kg on rest days.", hi: "लंबे सत्र वाले दिनों पर 5-7 g/kg कार्ब; आराम के दिन 3-4 g/kg।" },
      { en: "Iron + ferritin recheck Week 12 — endurance loads deplete iron stores.", hi: "सप्ताह 12 में आयरन + फेरिटिन दोबारा देखें — सहनशक्ति आयरन घटाती है।" },
    ],
  },
  strength_bias: {
    id: "strength_bias",
    label: "Strength / power bias",
    body: [
      { en: "Your preference is strength-leaning. The 12-week block below uses upper/lower splits with progressive overload, plus two short cardio sessions for vascular health and recovery.",
        hi: "आपकी पसंद स्ट्रेंथ है। नीचे 12-सप्ताह ब्लॉक अपर/लोअर स्प्लिट और प्रगतिशील भार पर केंद्रित है, साथ में दो छोटे कार्डियो सत्र।" },
    ],
    bullets: [
      { en: "4-day upper/lower split; +2.5 kg/week on compound lifts (linear).", hi: "4-दिन अपर/लोअर स्प्लिट; कंपाउंड लिफ्ट पर +2.5 kg/सप्ताह (रैखिक)।" },
      { en: "Protein 2.0 g/kg + creatine monohydrate 5 g/day for hypertrophy.", hi: "हाइपरट्रॉफी के लिए प्रोटीन 2.0 g/kg + क्रिएटिन मोनोहाइड्रेट 5 g/दिन।" },
      { en: "Zone-2 cycling 2×30 min keeps cardiovascular base without interference.", hi: "ज़ोन-2 साइक्लिंग 2×30 मिनट हस्तक्षेप के बिना कार्डियो आधार बनाए रखता है।" },
    ],
  },
  general_athlete: {
    id: "general_athlete",
    label: "General athlete (mixed)",
    body: [
      { en: "You don't bias to one modality, so the program below alternates strength and aerobic blocks across 12 weeks with sport-specific fueling and recovery science layered onto your TDEE.",
        hi: "आप किसी एक मोडैलिटी की ओर नहीं झुकते, इसलिए नीचे कार्यक्रम 12 सप्ताह में स्ट्रेंथ और एरोबिक ब्लॉक के बीच बदलता है।" },
    ],
    bullets: [
      { en: "3 strength + 2 conditioning sessions/week with one full rest day.", hi: "सप्ताह में 3 स्ट्रेंथ + 2 कंडीशनिंग सत्र, एक पूर्ण आराम दिन।" },
      { en: "Track session RPE; deload Week 4 / 8 / 12 to avoid plateau.", hi: "सत्र RPE ट्रैक करें; ठहराव से बचने के लिए सप्ताह 4/8/12 में डीलोड।" },
      { en: "Match carbs to training day intensity; sleep 7.5–8.5 h for recovery.", hi: "कार्ब को प्रशिक्षण दिन की तीव्रता से मिलाएं; रिकवरी के लिए 7.5-8.5 घं सोएं।" },
    ],
  },
};

ADDON_BLOCKS_PATCH.addonFamilyIntro = {
  family_2_focus: {
    id: "family_2_focus",
    label: "2-report family bundle (couple / parent + child)",
    body: [
      { en: "This bundle covers two personalized reports — typically a couple, or a parent + child. The age-stratified table below tells you exactly how to adjust shared meals so each person hits their own targets.",
        hi: "यह बंडल दो व्यक्तिगत रिपोर्ट कवर करता है — आमतौर पर एक जोड़ा, या माता-पिता + बच्चा। आयु-स्तरीकृत तालिका साझा भोजन में समायोजन बताती है।" },
    ],
    bullets: [
      { en: "Plan one weekly grocery list, then split portions per the modifier table.", hi: "एक साप्ताहिक किराना सूची बनाएं, फिर मॉडिफायर तालिका के अनुसार भाग बाँटें।" },
      { en: "Same recipe, different portions: 1.5× protein for the active adult.", hi: "एक ही रेसिपी, अलग भाग: सक्रिय वयस्क के लिए 1.5× प्रोटीन।" },
    ],
  },
  family_4_focus: {
    id: "family_4_focus",
    label: "4-report family bundle (full household)",
    body: [
      { en: "This bundle covers four personalized reports — a full household. The shared-meal modifier table below is the operating manual for one shopping list, four sets of nutritional needs.",
        hi: "यह बंडल चार व्यक्तिगत रिपोर्ट कवर करता है — एक पूरा घर। नीचे साझा-भोजन तालिका एक खरीद-सूची, चार पोषण आवश्यकताओं का संचालन मैनुअल है।" },
    ],
    bullets: [
      { en: "Children 2–12: do NOT calorie-restrict; protect iron + calcium intake.", hi: "बच्चे 2-12: कैलोरी सीमित न करें; आयरन + कैल्शियम सुरक्षित रखें।" },
      { en: "Teens 13–19: peak bone-mass window; calcium 1,300 mg + D3 600 IU.", hi: "किशोर 13-19: चरम अस्थि खिड़की; कैल्शियम 1,300 mg + D3 600 IU।" },
      { en: "Elderly 55+: protect protein 1.2 g/kg to prevent sarcopenia.", hi: "बुजुर्ग 55+: सार्कोपेनिया रोकने के लिए प्रोटीन 1.2 g/kg बनाए रखें।" },
      { en: "Weekly grocery budget ₹2,500–3,500 covers all 4 members in India.", hi: "साप्ताहिक किराना बजट ₹2,500-3,500 भारत में चारों सदस्यों को कवर करता है।" },
    ],
  },
  family_default: {
    id: "family_default",
    label: "Generic family extension",
    body: [
      { en: "Your personal plan is built for you. This add-on extends the same evidence base to your household with age-stratified targets and a shared-meal modifier table.",
        hi: "आपकी व्यक्तिगत योजना आपके लिए बनी है। यह ऐड-ऑन उसी साक्ष्य-आधार को आपके परिवार तक विस्तारित करता है।" },
    ],
    bullets: [
      { en: "Confirm bundle size with support@genewell.in to receive the right report count.", hi: "सही रिपोर्ट संख्या के लिए support@genewell.in से बंडल आकार पुष्ट करें।" },
    ],
  },
};

ADDON_BLOCKS_PATCH.addonWomenHormoneIntro = {
  pcos: {
    id: "pcos",
    label: "PCOS-specific cycle plan",
    body: [
      { en: "Because PCOS is in your profile, the 28-day plan below leads with insulin control: lower-glycaemic carbs across all phases, inositol from Phase 1, and luteal-phase strength bias to encourage ovulation in subsequent cycles.",
        hi: "PCOS आपकी प्रोफ़ाइल में है, इसलिए नीचे 28-दिन योजना इंसुलिन नियंत्रण से शुरू होती है: सभी चरणों में कम-GI कार्ब, चरण 1 से इनोसिटोल, और ल्यूटियल चरण में स्ट्रेंथ बायस।" },
    ],
    bullets: [
      { en: "Myo-inositol 2 g + D-chiro-inositol 50 mg twice daily (40:1 ratio).", hi: "मायो-इनोसिटोल 2 g + D-चिरो-इनोसिटोल 50 mg दिन में दो बार (40:1 अनुपात)।" },
      { en: "Carbs <40% of calories; prefer millets, lentils, low-GI fruit.", hi: "कार्ब कैलोरी का <40%; बाजरा, दाल, कम-GI फल को प्राथमिकता दें।" },
      { en: "Strength training 3×/week — single most effective non-drug lever for ovulation.", hi: "सप्ताह में 3 बार स्ट्रेंथ — ओवुलेशन के लिए सबसे प्रभावी गैर-दवा लीवर।" },
    ],
  },
  thyroid: {
    id: "thyroid",
    label: "Thyroid-aware cycle plan",
    body: [
      { en: "Your thyroid history shapes the cycle plan: TSH/T3/T4 stay tracked across phases, ashwagandha is gated until labs are reviewed, and selenium + zinc anchor each phase.",
        hi: "आपकी थायरॉइड स्थिति चक्र योजना को आकार देती है: सभी चरणों में TSH/T3/T4 ट्रैक रखें, अश्वगंधा लैब के बाद ही, सेलेनियम + जिंक हर चरण में।" },
    ],
    bullets: [
      { en: "Track TSH every 8 weeks while titrating training/nutrition load.", hi: "प्रशिक्षण/पोषण भार समायोजित करते समय हर 8 सप्ताह TSH ट्रैक करें।" },
      { en: "Avoid raw cruciferous goitrogens; lightly cook to deactivate.", hi: "कच्चे क्रूसिफेरस गोइट्रोजन से बचें; निष्क्रिय करने के लिए हल्का पकाएं।" },
      { en: "Iodised salt only — no extra iodine supplements without a doctor.", hi: "केवल आयोडीनयुक्त नमक — डॉक्टर के बिना अतिरिक्त आयोडीन सप्लीमेंट नहीं।" },
    ],
  },
  perimenopausal: {
    id: "perimenopausal",
    label: "Perimenopausal (40+) plan",
    body: [
      { en: "Cycles are becoming irregular at your stage. The plan below shifts emphasis from rigid 28-day phases to bone (calcium + D3), muscle (1.6 g/kg protein, 3×/week strength), and sleep — the levers that age the slowest with hormonal change.",
        hi: "आपके चरण में चक्र अनियमित हो रहे हैं। योजना सख्त 28-दिन चरणों से हटकर हड्डी (कैल्शियम + D3), मांसपेशी (1.6 g/kg प्रोटीन, सप्ताह में 3 बार स्ट्रेंथ) और नींद पर केंद्रित है।" },
    ],
    bullets: [
      { en: "Calcium 1,200 mg/day (food-first) + D3 2,000 IU to protect bone.", hi: "हड्डी की रक्षा के लिए कैल्शियम 1,200 mg/दिन (भोजन-पहले) + D3 2,000 IU।" },
      { en: "Heavy compound lifts 2×/week to defend lean mass against estrogen decline.", hi: "एस्ट्रोजन गिरावट के बीच मांसपेशी बचाने के लिए भारी कंपाउंड लिफ्ट सप्ताह में 2 बार।" },
      { en: "DEXA scan baseline + repeat every 24 months to track bone density.", hi: "अस्थि घनत्व ट्रैक करने के लिए DEXA स्कैन आधार + हर 24 महीने दोहराएं।" },
    ],
  },
  standard_cycle: {
    id: "standard_cycle",
    label: "Standard 28-day cycle plan",
    body: [
      { en: "Female hormones follow a 28-day cycle across 4 distinct phases. The table below gives you phase-specific calorie adjustments, training, and supplement timing — completely absent from the general plan.",
        hi: "महिला हार्मोन 4 अलग चरणों में 28-दिन चक्र का पालन करते हैं। नीचे की तालिका चरण-विशिष्ट कैलोरी, प्रशिक्षण और सप्लीमेंट टाइमिंग देती है।" },
    ],
    bullets: [
      { en: "Follicular (Day 1–14): higher carb tolerance, push intensity sessions.", hi: "फॉलिक्युलर (दिन 1-14): अधिक कार्ब सहन, तीव्र सत्रों पर जोर।" },
      { en: "Luteal (Day 15–28): +100 kcal, magnesium 200 mg, gentler training.", hi: "ल्यूटियल (दिन 15-28): +100 kcal, मैग्नीशियम 200 mg, हल्का प्रशिक्षण।" },
    ],
  },
};

ADDON_BLOCKS_PATCH.addonMenFitnessIntro = {
  low_sleep_t_risk: {
    id: "low_sleep_t_risk",
    label: "Low-sleep testosterone risk",
    body: [
      { en: "Your sleep deficit is the single biggest hidden tax on testosterone in your profile. The audit and protocol below put sleep restoration ahead of training tweaks — the maths simply do not work otherwise.",
        hi: "आपकी नींद की कमी टेस्टोस्टेरोन पर सबसे बड़ा छिपा कर है। नीचे ऑडिट प्रशिक्षण से पहले नींद को प्राथमिकता देता है।" },
    ],
    bullets: [
      { en: "Aim for 7.5–8.5 h sleep BEFORE optimizing training — biggest T-lever.", hi: "प्रशिक्षण अनुकूलन से पहले 7.5-8.5 घं नींद का लक्ष्य — सबसे बड़ा T-लीवर।" },
      { en: "Magnesium glycinate 300 mg + zinc 15 mg at bedtime to support T synthesis.", hi: "T संश्लेषण समर्थन के लिए सोते समय मैग्नीशियम ग्लाइसिनेट 300 mg + ज़िंक 15 mg।" },
      { en: "Cap alcohol at 3 drinks/week — direct suppressor of nocturnal T pulse.", hi: "शराब सप्ताह में 3 ड्रिंक तक सीमित — रात्रिकालीन T पल्स को सीधे दबाती है।" },
    ],
  },
  overweight_recomp: {
    id: "overweight_recomp",
    label: "Overweight body-recomposition focus",
    body: [
      { en: "Your body fat is in the range where aromatase converts testosterone to estrogen. The audit below targets a 400–500 kcal deficit + 4 strength sessions/week as the highest-leverage levers.",
        hi: "आपका शरीर वसा उस सीमा में है जहाँ एरोमेटेज़ टेस्टोस्टेरोन को एस्ट्रोजन में बदलता है। नीचे ऑडिट 400-500 kcal की कमी + सप्ताह में 4 स्ट्रेंथ सत्र पर केंद्रित है।" },
    ],
    bullets: [
      { en: "Hold 400–500 kcal deficit for 12 weeks; protein 2.0 g/kg target body weight.", hi: "12 सप्ताह तक 400-500 kcal की कमी रखें; प्रोटीन 2.0 g/kg लक्ष्य वजन।" },
      { en: "4 strength sessions/week prioritising compound lifts to preserve LBM.", hi: "LBM बचाने के लिए सप्ताह में 4 स्ट्रेंथ सत्र, कंपाउंड लिफ्ट प्राथमिकता।" },
      { en: "Re-check fasting insulin + SHBG at Week 12 to track recomp progress.", hi: "रिकम्प प्रगति ट्रैक करने के लिए सप्ताह 12 में फास्टिंग इंसुलिन + SHBG दोबारा देखें।" },
    ],
  },
  fit_optimize: {
    id: "fit_optimize",
    label: "Already-fit optimization",
    body: [
      { en: "Sleep, body fat, and training are already aligned. The audit below moves to the next layer: micronutrients (zinc, magnesium, D3), recovery quality, and progressive overload programming.",
        hi: "नींद, शरीर वसा और प्रशिक्षण पहले से संरेखित हैं। नीचे ऑडिट अगली परत पर जाता है: सूक्ष्म पोषक (जिंक, मैग्नीशियम, D3), रिकवरी और प्रगतिशील भार।" },
    ],
    bullets: [
      { en: "Periodise volume in 4-week blocks; track HRV to time deload weeks.", hi: "4-सप्ताह ब्लॉक में वॉल्यूम आवधिक करें; डीलोड के लिए HRV ट्रैक करें।" },
      { en: "D3 2,000 IU + zinc picolinate 15 mg + magnesium glycinate 300 mg.", hi: "D3 2,000 IU + ज़िंक पिकोलिनेट 15 mg + मैग्नीशियम ग्लाइसिनेट 300 mg।" },
      { en: "Add 1 mobility / soft-tissue session weekly to protect long-term progress.", hi: "दीर्घकालिक प्रगति बचाने के लिए साप्ताहिक 1 मोबिलिटी/सॉफ्ट-टिश्यू सत्र जोड़ें।" },
    ],
  },
};

ADDON_BLOCKS_PATCH.addonLabInterpretation = {
  pcos_panel: {
    id: "pcos_panel",
    label: "PCOS quarterly panel",
    body: [
      { en: "Because PCOS is in your profile, your quarterly panel centres on fasting insulin, HOMA-IR, AMH, LH/FSH ratio, free testosterone, and 25-OH vitamin D. The interpretation block below shows what each number means and what action it triggers in your plan.",
        hi: "PCOS आपकी प्रोफ़ाइल में है, इसलिए तिमाही पैनल फास्टिंग इंसुलिन, HOMA-IR, AMH, LH/FSH अनुपात, मुक्त टेस्टोस्टेरोन और 25-OH विटामिन D पर केंद्रित है।" },
    ],
    bullets: [
      { en: "Fasting insulin > 10 µIU/mL → tighten carbs, add inositol Phase 1.", hi: "फास्टिंग इंसुलिन > 10 µIU/mL → कार्ब कम करें, चरण 1 में इनोसिटोल जोड़ें।" },
      { en: "Free T elevated → add spearmint tea 2×/day, reduce dairy 4 weeks.", hi: "मुक्त T उच्च → स्पियरमिंट चाय 2×/दिन, 4 सप्ताह डेयरी कम करें।" },
      { en: "25-OH D < 30 ng/mL → 60,000 IU weekly D3 for 8 weeks then retest.", hi: "25-OH D < 30 ng/mL → 8 सप्ताह तक 60,000 IU D3 साप्ताहिक, फिर पुनः परीक्षण।" },
    ],
  },
  thyroid_panel: {
    id: "thyroid_panel",
    label: "Thyroid quarterly panel",
    body: [
      { en: "Your thyroid history sets the panel: TSH, free T3, free T4, anti-TPO, plus a metabolic baseline (fasting glucose, lipid panel). The interpretation block below converts each result into a concrete plan adjustment.",
        hi: "आपकी थायरॉइड स्थिति पैनल तय करती है: TSH, मुक्त T3, मुक्त T4, एंटी-TPO, और चयापचय आधार (फास्टिंग ग्लूकोज़, लिपिड पैनल)।" },
    ],
    bullets: [
      { en: "TSH > 4.5 → flag for endocrinology review, do not start ashwagandha.", hi: "TSH > 4.5 → एंडोक्रिनोलॉजी समीक्षा, अश्वगंधा शुरू न करें।" },
      { en: "Free T3 low / T4 normal → selenium 200 mcg/day (T4→T3 conversion).", hi: "मुक्त T3 कम / T4 सामान्य → सेलेनियम 200 mcg/दिन।" },
      { en: "Anti-TPO positive → reduce raw goitrogens, increase selenium-rich foods.", hi: "एंटी-TPO धनात्मक → कच्चे गोइट्रोजन कम, सेलेनियम-समृद्ध आहार बढ़ाएं।" },
    ],
  },
  metabolic_panel: {
    id: "metabolic_panel",
    label: "Metabolic / weight-loss panel",
    body: [
      { en: "For your fat-loss / metabolic profile, the quarterly panel covers fasting glucose, HbA1c, lipid panel, fasting insulin, vitamin D, and B12. The interpretation block converts each marker into a plan adjustment.",
        hi: "आपकी वसा-कमी / चयापचय प्रोफ़ाइल के लिए तिमाही पैनल: फास्टिंग ग्लूकोज़, HbA1c, लिपिड पैनल, फास्टिंग इंसुलिन, विटामिन D, B12।" },
    ],
    bullets: [
      { en: "HbA1c 5.7–6.4 → pre-diabetes; tighten meal-window + walks after meals.", hi: "HbA1c 5.7-6.4 → प्री-डायबिटीज़; भोजन-समय कस लें + भोजन के बाद टहलें।" },
      { en: "LDL > 130 → cut refined-oil + ultra-processed foods 8 weeks, retest.", hi: "LDL > 130 → 8 सप्ताह तक रिफाइंड तेल + अत्यधिक प्रसंस्कृत भोजन कम।" },
      { en: "B12 < 300 pg/mL → methyl-B12 1000 mcg/day 12 weeks (esp. if vegetarian).", hi: "B12 < 300 pg/mL → 12 सप्ताह तक मेथिल-B12 1000 mcg/दिन।" },
    ],
  },
  default_panel: {
    id: "default_panel",
    label: "General quarterly panel",
    body: [
      { en: "Your baseline panel covers CBC, fasting glucose, HbA1c, lipid panel, vitamin D, B12, ferritin, and TSH. The interpretation block below ties each result back to the actions already in your plan.",
        hi: "आपका आधारभूत पैनल: CBC, फास्टिंग ग्लूकोज़, HbA1c, लिपिड पैनल, विटामिन D, B12, फेरिटिन और TSH।" },
    ],
    bullets: [
      { en: "Vitamin D < 30 ng/mL → loading-dose D3 8 weeks then maintenance.", hi: "विटामिन D < 30 ng/mL → 8 सप्ताह लोडिंग-डोज़ D3, फिर रखरखाव।" },
      { en: "Ferritin < 30 ng/mL → iron bisglycinate + vitamin C-rich meals.", hi: "फेरिटिन < 30 ng/mL → आयरन बिसग्लीसिनेट + विटामिन C समृद्ध भोजन।" },
      { en: "Lipid panel out-of-range → 8-week dietary trial before any medication.", hi: "लिपिड पैनल असामान्य → किसी दवा से पहले 8-सप्ताह आहार परीक्षण।" },
    ],
  },
};

for (const key of Object.keys(ADDON_BLOCKS_PATCH) as SectionId[]) {
  const value = ADDON_BLOCKS_PATCH[key];
  if (value) {
    (CONTENT_BLOCKS as Record<SectionId, Record<string, VariantBlock>>)[key] = value;
  }
}

export function getVariant(section: SectionId, id: string): VariantBlock | undefined {
  return CONTENT_BLOCKS[section]?.[id];
}
