/**
 * report-html-template.ts
 * Generates full A4 HTML wellness blueprint for Puppeteer PDF rendering.
 * Ported from genewell_complete/src/report/htmlTemplate.js and generatePDF.js
 */

import type { AssembledReport } from "./report-assembler";
import type { SupplementRecommendation } from "./supplement-builder";

// ── HTML builder helpers ───────────────────────────────────────────────────────

function supplementCard(supp: SupplementRecommendation): string {
  if (supp.excluded) {
    return `<div class="supplement-card excluded"><div class="name">${supp.name} — EXCLUDED</div><div class="why">${supp.exclusion_reason ?? ""}</div></div>`;
  }
  if (supp.existing) {
    return `<div class="supplement-card existing"><div class="name">${supp.name}</div><div class="why">${supp.note ?? ""}</div></div>`;
  }
  return `
    <div class="supplement-card">
      <div class="name">${supp.name}${supp.evidence_tier ? ` <span style="font-size:8pt; color:#666;">[Evidence Tier ${supp.evidence_tier}]</span>` : ""}</div>
      <div class="dose"><strong>Dose:</strong> ${supp.dose ?? ""}</div>
      <div class="dose"><strong>Timing:</strong> ${supp.timing ?? ""}</div>
      <div class="why"><strong>Why for you:</strong> ${supp.why ?? ""}</div>
      ${supp.intolerance_adapted ? `<div class="warning" style="margin-top:6px; font-size:9pt;">✓ Adapted for your seafood intolerance — this is the safe, scientifically equivalent alternative.</div>` : ""}
      ${supp.interaction?.note ? `<div class="info" style="margin-top:6px; font-size:9pt;"><strong>Note:</strong> ${supp.interaction.note}</div>` : ""}
      ${supp.brand_india ? `<div class="dose" style="margin-top:6px;"><strong>Brand (India):</strong> ${supp.brand_india} · <strong>Price:</strong> ${supp.price_month ?? ""}</div>` : ""}
    </div>`;
}

// ── Main HTML generator ────────────────────────────────────────────────────────

export function buildReportHTML(data: AssembledReport): string {
  const { profile, coverPage, dashboard, metabolics, sleep, nutrition, gut, skin, stress, training, womensHealth, labTests, supplements, projection, cityContext, flags } = data;

  const phase1Supps = supplements.filter((s) => s.phase === 1 && !s.excluded && !s.existing);
  const phase2Supps = supplements.filter((s) => s.phase === 2 && !s.excluded);
  const phase3Supps = supplements.filter((s) => s.phase === 3 && !s.excluded);
  const excludedSupps = supplements.filter((s) => s.excluded);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GeneWell Personalized Wellness Blueprint - ${coverPage.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 10pt; line-height: 1.6; color: #2c2c2a; }
    .page { page-break-after: always; padding: 20px; }
    .page:last-child { page-break-after: auto; }
    h1 { font-size: 22pt; font-weight: 600; color: #1a1a18; margin-bottom: 8px; }
    h2 { font-size: 16pt; font-weight: 600; color: #1a1a18; margin: 24px 0 12px; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px; }
    h3 { font-size: 13pt; font-weight: 600; color: #1a1a18; margin: 16px 0 8px; }
    p { margin-bottom: 10px; }
    ul, ol { margin: 10px 0 10px 20px; }
    li { margin-bottom: 6px; }
    .cover { text-align: center; padding: 80px 40px; background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%); min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; }
    .cover h1 { font-size: 32pt; margin-bottom: 20px; color: #185FA5; }
    .cover .subtitle { font-size: 18pt; color: #666; margin-bottom: 40px; }
    .cover .meta { font-size: 12pt; color: #888; margin-top: 60px; background: #f8f8f8; padding: 20px; border-radius: 8px; text-align: left; width: 100%; max-width: 500px; }
    .score-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; }
    .score-card { background: #f8f8f8; padding: 12px; border-radius: 8px; border-left: 4px solid #3B8BD4; }
    .score-card .label { font-size: 9pt; color: #666; margin-bottom: 4px; }
    .score-card .score { font-size: 18pt; font-weight: 600; color: #1a1a18; }
    .score-card .status { font-size: 9pt; color: #666; margin-top: 4px; }
    .priority-box { background: #E6F1FB; border-left: 4px solid #185FA5; padding: 12px; margin: 12px 0; border-radius: 4px; }
    .priority-box .number { font-size: 14pt; font-weight: 600; color: #185FA5; }
    .priority-box .title { font-size: 11pt; font-weight: 600; margin: 4px 0; }
    .table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .table th { background: #f0f0f0; padding: 8px; text-align: left; font-weight: 600; border-bottom: 2px solid #ddd; }
    .table td { padding: 8px; border-bottom: 1px solid #eee; }
    .supplement-card { background: #fafafa; padding: 10px; margin: 8px 0; border-radius: 6px; border-left: 3px solid #639922; }
    .supplement-card.excluded { border-left-color: #e24b4a; background: #fff0f0; }
    .supplement-card.existing { border-left-color: #639922; background: #f0fff0; }
    .supplement-card .name { font-weight: 600; font-size: 11pt; color: #1a1a18; }
    .supplement-card .dose { color: #666; font-size: 9pt; margin: 4px 0; }
    .supplement-card .why { font-size: 9pt; margin-top: 6px; }
    .warning { background: #FFF3CD; border-left: 4px solid #BA7517; padding: 10px; margin: 10px 0; border-radius: 4px; }
    .success { background: #EAF3DE; border-left: 4px solid #639922; padding: 10px; margin: 10px 0; border-radius: 4px; }
    .info { background: #E6F1FB; border-left: 4px solid #185FA5; padding: 10px; margin: 10px 0; border-radius: 4px; }
    .phase-badge { display: inline-block; background: #639922; color: white; padding: 2px 8px; border-radius: 12px; font-size: 8pt; font-weight: 600; margin-bottom: 8px; }
    .phase-badge.p2 { background: #BA7517; }
    .phase-badge.p3 { background: #185FA5; }
    .footnote { font-size: 8pt; color: #888; margin-top: 30px; padding-top: 10px; border-top: 1px solid #ddd; }
    .critical-box { background: #fff0f0; border-left: 4px solid #A32D2D; padding: 10px; margin: 10px 0; border-radius: 4px; }
    .tab-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
  </style>
</head>
<body>

<!-- COVER PAGE -->
<div class="page cover">
  <h1>GeneWell</h1>
  <div class="subtitle">Personalized Wellness Blueprint · ${coverPage.planTier.toUpperCase()} Edition</div>
  <h2 style="border:none; margin-top:40px; font-size:16pt; color:#666;">Prepared exclusively for</h2>
  <h1 style="font-size:30pt; margin-top:10px;">${coverPage.name.toUpperCase()}</h1>
  <p style="font-size:14pt; margin-top:20px; color:#555;">90-Day Health Transformation Blueprint</p>
  <div class="meta">
    <p><strong>CLIENT:</strong> ${coverPage.name} · ${profile.age} yrs · ${profile.gender}</p>
    <p><strong>BODY METRICS:</strong> ${profile.height_cm} cm · ${profile.weight_kg} kg · BMI ${profile.bmi} (${profile.bmiLabel})</p>
    <p><strong>REGION / DIET:</strong> ${profile.location} · ${profile.diet_type.replace(/_/g, "-")}</p>
    <p><strong>PRIMARY GOAL:</strong> ${profile.goalKey.replace(/_/g, " ")}</p>
    <p><strong>ORDER ID:</strong> ${coverPage.orderId}</p>
    <p><strong>GENERATED:</strong> ${coverPage.generatedDate}</p>
  </div>
  ${flags.hasCondition ? `<div class="warning" style="margin-top:30px; text-align:left; width:100%; max-width:500px;"><strong>CONDITIONS ADDRESSED:</strong> ${profile.medical_conditions.filter((c: string) => c !== "none").join(", ")}</div>` : ""}
  <div class="footnote" style="max-width:500px;">
    Medical Disclaimer: This report is for educational purposes only and is NOT medical advice. Always consult a qualified healthcare professional before making changes to diet, exercise, or supplementation.
  </div>
</div>

<!-- DASHBOARD -->
<div class="page">
  <h1>Personal Health Score Dashboard</h1>
  <p>Generated from your ${Object.keys(profile.scores).length - 1} health dimensions. <strong>Overall wellness score: ${dashboard.overallScore}/100</strong></p>
  
  <div class="score-grid">
    <div class="score-card"><div class="label">Sleep</div><div class="score">${dashboard.scores.sleep}/100</div><div class="status">${profile.sleepSlot.replace(/_/g, "–")} hrs · target 7–8</div></div>
    <div class="score-card"><div class="label">Hydration</div><div class="score">${dashboard.scores.hydration}/100</div><div class="status">Target: ${profile.waterTarget_L}L/day</div></div>
    <div class="score-card"><div class="label">Meal Frequency</div><div class="score">${dashboard.scores.meal_frequency}/100</div><div class="status">${profile.eatingWindow.window_hours}-hour eating window</div></div>
    <div class="score-card"><div class="label">Stress Management</div><div class="score">${dashboard.scores.stress}/100</div><div class="status">Stress level: ${profile.stressRating}/5</div></div>
    <div class="score-card"><div class="label">Gut Health</div><div class="score">${dashboard.scores.gut_health}/100</div><div class="status">${profile.digestive_issues.length > 0 && !profile.digestive_issues.includes("none") ? profile.digestive_issues.join(", ") : "No issues reported"}</div></div>
    <div class="score-card"><div class="label">Skin Health</div><div class="score">${dashboard.scores.skin_health}/100</div><div class="status">${profile.skin_concerns.length > 0 && !profile.skin_concerns.includes("none") ? profile.skin_concerns.join(", ") : "No concerns reported"}</div></div>
  </div>

  <div class="critical-box">
    <strong>YOUR #1 LIMITING FACTOR: ${dashboard.limitingFactor.label} (Score: ${dashboard.limitingFactor.score}/100)</strong><br>
    Fix this first and your other scores improve within 3 weeks. This is the single highest-leverage action in your entire blueprint.
  </div>

  <h2>Top 3 Priority Actions</h2>
  ${dashboard.topPriorities.map((p: any) => `
    <div class="priority-box">
      <span class="number">${p.number}.</span>
      <div class="title">${p.title}</div>
      <p>${p.description}</p>
      <p style="margin-top:6px; font-size:9pt; font-style:italic;">${p.impact}</p>
      <p style="font-size:9pt; margin-top:4px;"><strong>Start:</strong> ${p.week}</p>
    </div>
  `).join("")}
</div>

<!-- METABOLIC NUMBERS -->
<div class="page">
  <h1>Your Calculated Metabolic Numbers</h1>
  <p>Every number below is computed from your data — age, weight, height, activity level, goal. These are not estimates from a generic chart.</p>

  <h3>BMI: ${metabolics.bmi} kg/m² · ${metabolics.bmiLabel}</h3>
  <p>${metabolics.bmi > 25 ? "Focus on fat reduction, not muscle loss." : metabolics.bmi < 18.5 ? "Focus on building lean mass with resistance training and adequate protein." : "Healthy range — focus on body composition improvement."}</p>

  <h3>BMR (Basal Metabolic Rate): <span style="color:#185FA5">${metabolics.bmr} kcal/day</span></h3>
  <p>Calories your body burns at complete rest (Mifflin-St Jeor formula). Never eat below this.</p>

  <h3>TDEE (Total Daily Energy Expenditure): <span style="color:#185FA5">${metabolics.tdee} kcal/day</span></h3>
  <p>Total calories you burn on a typical day (BMR × ${profile.activityMultiplier} activity multiplier).</p>

  <h3>Goal Calorie Target: <span style="color:#185FA5; font-size:16pt;">${metabolics.goalCalories} kcal/day</span></h3>
  <p>${profile.goalKey === "lose_fat" ? "TDEE - 400 kcal = sustainable fat loss without muscle loss." : profile.goalKey === "build_muscle" ? "TDEE + 300 kcal = supports muscle building with minimal fat gain." : "TDEE + 100–200 kcal = supports gradual recomposition."}</p>

  <h3>Macro Targets</h3>
  <table class="table">
    <tr><th>Macro</th><th>Grams/Day</th><th>% of Calories</th><th>Top Sources</th></tr>
    <tr><td><strong>Protein</strong></td><td>${metabolics.macros.protein_g}g</td><td>${Math.round(metabolics.macros.protein_kcal / metabolics.goalCalories * 100)}%</td><td>Eggs, lentils, ${flags.seafoodIntolerant ? "tofu, soya chunks" : "chicken, fish"}, sprouts</td></tr>
    <tr><td><strong>Carbs</strong></td><td>${metabolics.macros.carb_g}g</td><td>${Math.round(metabolics.macros.carb_kcal / metabolics.goalCalories * 100)}%</td><td>Oats, brown rice, millets, sweet potato</td></tr>
    <tr><td><strong>Fats</strong></td><td>${metabolics.macros.fat_g}g</td><td>${Math.round(metabolics.macros.fat_kcal / metabolics.goalCalories * 100)}%</td><td>${flags.dairyIntolerant ? "Coconut oil" : "Ghee"}, ${flags.nutsIntolerant ? "flaxseeds" : "walnuts, almonds"}, olive oil</td></tr>
  </table>

  <div class="info"><strong>One Calorie Number, Used Everywhere:</strong> ${metabolics.goalCalories} kcal/day is your target across all sections of this report. No conflicting numbers.</div>
  <p><strong>Daily Water Target:</strong> ${metabolics.waterTarget_L}L/day (35ml/kg body weight, WHO recommendation)</p>
</div>

<!-- SLEEP -->
<div class="page">
  <h1>Sleep &amp; Energy Protocol</h1>
  <p><strong>Sleep Score: ${sleep.score}/100</strong> · Target: 7–8 hours nightly with good quality</p>

  <div class="${sleep.urgency === "critical" ? "critical-box" : sleep.urgency === "needs_work" ? "warning" : "success"}">
    <strong>${sleep.urgency === "critical" ? "🔴 CRITICAL:" : sleep.urgency === "needs_work" ? "🟡 NEEDS WORK:" : "✅ GOOD:"}</strong> ${sleep.primaryAction}
  </div>

  <h3>Your Sleep Pattern Analysis</h3>
  <p><strong>Issue:</strong> ${sleep.sleepAdvice.problem.replace(/_/g, " ")}</p>
  <p>${sleep.sleepAdvice.advice}</p>

  <h3>3 Non-Negotiable Sleep Rules</h3>
  <ol>
    <li><strong>Fixed Wake Time:</strong> Same wake time every day — even weekends. Variability &gt;60 min raises cardiac risk by 27%.</li>
    <li><strong>Dark + Cool Room:</strong> Blackout curtains or eye mask. Room at ${sleep.room_conditions.temperature}. Dim light cuts melatonin 50%.</li>
    <li><strong>Screen-Free Wind-Down:</strong> No screens 60–90 min before bed. Blue light suppresses melatonin by 85%.</li>
  </ol>

  <h3>Pre-Sleep Checklist</h3>
  <ul>${sleep.pre_sleep_checklist.map((item: string) => `<li>${item}</li>`).join("")}</ul>

  ${sleep.supplements && sleep.supplements.length > 0 ? `
  <h3>Sleep Supplements</h3>
  ${sleep.supplements.map((s: any) => `<div class="supplement-card"><div class="name">${s.name}</div><div class="dose"><strong>Dose:</strong> ${s.dose} · <strong>Timing:</strong> ${s.timing}</div><div class="why">${s.why}</div></div>`).join("")}
  <p class="footnote">Try the sleep hygiene protocol for 2 weeks before adding supplements. Add one at a time.</p>
  ` : ""}
</div>

<!-- NUTRITION -->
<div class="page">
  <h1>Nutrition Strategy &amp; Macros</h1>
  <p><strong>Goal Calories: ${nutrition.goalCalories} kcal/day</strong> | Protein: ${nutrition.macros.protein_g}g · Carbs: ${nutrition.macros.carb_g}g · Fats: ${nutrition.macros.fat_g}g</p>

  <h3>Protein Sources (for you)</h3>
  <p>${nutrition.proteinSources.join(", ")}</p>

  <h3>Carbohydrate Sources</h3>
  <p>${nutrition.carbSources.join(", ")}</p>

  <h3>Fat Sources</h3>
  <p>${nutrition.fatSources.join(", ")}</p>

  <h3>Eating Window Strategy</h3>
  <p>${nutrition.eatingWindowStrategy}</p>

  ${Object.keys(nutrition.cravingStrategies).length > 0 ? `
  <h3>Craving Management</h3>
  ${Object.entries(nutrition.cravingStrategies).map(([k, v]) => `<div class="info" style="margin-top:8px;"><strong>${k}:</strong> ${v}</div>`).join("")}
  ` : ""}

  ${nutrition.pcosNutritionNote ? `<div class="warning"><strong>PCOS Nutrition:</strong> ${nutrition.pcosNutritionNote}</div>` : ""}

  ${nutrition.eatingOutStrategy ? `
  <h3>${nutrition.eatingOutStrategy.title}</h3>
  <p>${nutrition.eatingOutStrategy.ordering_strategy}</p>
  <p><strong>Safe orders:</strong> ${nutrition.eatingOutStrategy.safe_orders.join(", ")}</p>
  <p><strong>Best meal sequence:</strong> ${nutrition.eatingOutStrategy.best_meal_sequence}</p>
  ` : ""}
</div>

<!-- STRESS & MOOD -->
<div class="page">
  <h1>Stress &amp; Mood Management</h1>
  <p><strong>Stress Score: ${stress.score}/100</strong> · Stress Rating: ${stress.stressRating}/5</p>

  <h3>Daily Protocol</h3>
  <p><strong>Morning:</strong> ${stress.dailyProtocol.morning}</p>
  <p><strong>Midday:</strong> ${stress.dailyProtocol.midday}</p>
  <p><strong>Evening:</strong> ${stress.dailyProtocol.evening}</p>
  <p><strong>Sleep prep:</strong> ${stress.dailyProtocol.sleep_prep}</p>

  ${Object.keys(stress.moodStrategies).length > 0 ? `
  <h3>Mood Pattern Solutions</h3>
  ${Object.entries(stress.moodStrategies).map(([k, v]) => `<div class="info" style="margin-top:8px;"><strong>${k}:</strong> ${v}</div>`).join("")}
  ` : ""}

  <h3>Emergency Stress Relief (Under 5 Minutes)</h3>
  ${stress.emergency_tools.map((t: any) => `<div class="success" style="margin-top:8px;"><strong>${t.name}</strong> (${t.time}): ${t.instructions}</div>`).join("")}
</div>

<!-- TRAINING -->
<div class="page">
  <h1>Training Program</h1>
  <h3>${training.programme.type}</h3>
  ${training.programme.week_plan.map((d: any) => `<div style="margin:10px 0; padding:8px; background:#fafafa; border-radius:6px;"><strong>${d.day}:</strong> ${d.activity}${d.notes ? `<br><span style="color:#666; font-size:9pt;">${d.notes}</span>` : ""}</div>`).join("")}
  ${training.pcosNote ? `<div class="warning"><strong>PCOS Note:</strong> ${training.pcosNote}</div>` : ""}
  <div class="info" style="margin-top:12px;"><strong>Progression Rule:</strong> ${training.progressionPrinciple}</div>
  <div class="success" style="margin-top:8px;"><strong>Minimum Viable:</strong> ${training.minimumViable}</div>
  <p style="margin-top:8px;"><strong>Goal Alignment:</strong> ${training.goalAlignment}</p>
</div>

<!-- GUT HEALTH -->
<div class="page">
  <h1>Gut Health Protocol</h1>
  <p><strong>Gut Health Score: ${gut.score}/100</strong></p>

  ${gut.phase1Protocol && gut.phase1Protocol.condition ? `
  <h3>${gut.phase1Protocol.condition}</h3>
  <p><strong>Approach:</strong> ${gut.phase1Protocol.approach}</p>
  <p><strong>Eat more:</strong> ${Array.isArray(gut.phase1Protocol.eat_more) ? gut.phase1Protocol.eat_more.join(", ") : gut.phase1Protocol.eat_more}</p>
  <p><strong>Avoid:</strong> ${Array.isArray(gut.phase1Protocol.avoid) ? gut.phase1Protocol.avoid.join(", ") : gut.phase1Protocol.avoid}</p>
  <p><strong>Supplement:</strong> ${gut.phase1Protocol.supplement}</p>
  ` : ""}

  ${gut.bloatingProtocol ? `<h3>Bloating Protocol</h3><ul>${gut.bloatingProtocol.strategies.map((s: string) => `<li>${s}</li>`).join("")}</ul>` : ""}
  ${gut.refluxProtocol ? `<h3>Acid Reflux Protocol</h3><ul>${gut.refluxProtocol.strategies.map((s: string) => `<li>${s}</li>`).join("")}</ul>` : ""}

  <h3>4-Week Recovery Plan</h3>
  ${gut.fourWeekPlan.map((p: any) => `<div class="info" style="margin-top:8px;"><strong>Weeks ${p.weeks} — ${p.phase}:</strong> ${p.description}</div>`).join("")}

  <p style="margin-top:12px;"><strong>Probiotics:</strong> ${gut.probioticNote}</p>
  <div class="info"><strong>Water Target:</strong> ${gut.waterTarget}</div>
</div>

<!-- SKIN HEALTH -->
<div class="page">
  <h1>Skin Health</h1>
  <p><strong>Skin Health Score: ${skin.score}/100</strong></p>

  <h3>Essential Nutrients for Your Skin</h3>
  <table class="table">
    <tr><th>Nutrient</th><th>Sources</th><th>Daily Target</th></tr>
    ${skin.skinNutrients.map((n: any) => `<tr><td><strong>${n.nutrient}</strong></td><td style="font-size:9pt;">${n.source}</td><td style="font-size:9pt;">${n.daily}</td></tr>`).join("")}
  </table>

  ${Object.entries(skin.protocols).map(([, p]: [string, any]) => `
  <h3>${p.title}</h3>
  ${p.internal ? `<p><strong>Internal:</strong> ${Array.isArray(p.internal) ? p.internal.join("; ") : p.internal}</p>` : ""}
  ${p.topical ? `<p><strong>Topical:</strong> ${Array.isArray(p.topical) ? p.topical.join("; ") : p.topical}</p>` : ""}
  ${p.supplement ? `<p><strong>Supplement:</strong> ${p.supplement}</p>` : ""}
  ${p.actions ? `<ul>${p.actions.map((a: string) => `<li>${a}</li>`).join("")}</ul>` : ""}
  `).join("")}

  <div class="info"><strong>Universal Rule:</strong> ${skin.universalRule}</div>
</div>

<!-- SUPPLEMENT STRATEGY -->
<div class="page">
  <h1>Supplement Strategy</h1>
  <p><strong>${coverPage.name}'s evidence-based stack</strong> — filtered by your intolerances and medication interactions. Start with Phase 1, then add one supplement every 2 weeks.</p>

  ${phase1Supps.length > 0 ? `
  <div class="phase-badge">Phase 1 — Foundation (Weeks 1–4)</div>
  ${phase1Supps.map(supplementCard).join("")}
  ` : ""}

  ${phase2Supps.length > 0 ? `
  <div class="phase-badge p2" style="margin-top:16px;">Phase 2 — Targeted (Weeks 5–8)</div>
  ${phase2Supps.map(supplementCard).join("")}
  ` : ""}

  ${phase3Supps.length > 0 ? `
  <div class="phase-badge p3" style="margin-top:16px;">Phase 3 — Maintenance (Weeks 9–12)</div>
  ${phase3Supps.map(supplementCard).join("")}
  ` : ""}

  ${excludedSupps.length > 0 ? `
  <div class="warning" style="margin-top:16px;">
    <strong>Supplements EXCLUDED from your stack (due to medication/safety):</strong>
    <ul style="margin-top:8px;">${excludedSupps.map((s) => `<li><strong>${s.name}:</strong> ${s.exclusion_reason ?? ""}</li>`).join("")}</ul>
  </div>
  ` : ""}

  <div class="footnote">Quality: Look for USP/NSF/FSSAI certification. Avoid proprietary blends. Store away from sunlight. Always consult your physician before starting, especially if on medication.<br>Where to buy: ${cityContext.supplement_stores}</div>
</div>

<!-- LAB TESTS -->
<div class="page">
  <h1>Recommended Lab Tests</h1>
  <p>Moving from guesswork to data-driven health requires clinical baselines. These tests are selected specifically for YOU based on your profile.</p>

  ${labTests.tests.filter((t: any) => t.priority === "critical").length > 0 ? `
  <h2 style="color:#A32D2D;">CRITICAL — Do This Week</h2>
  <table class="table">
    <tr><th>Test</th><th>Timing</th><th>Price Range</th><th>Why</th></tr>
    ${labTests.tests.filter((t: any) => t.priority === "critical").map((t: any) => `<tr><td><strong>${t.name}</strong></td><td>${t.timing}</td><td>${t.price}</td><td style="font-size:9pt;">${t.why}</td></tr>`).join("")}
  </table>
  ` : ""}

  ${labTests.tests.filter((t: any) => t.priority === "high").length > 0 ? `
  <h2 style="color:#BA7517;">HIGH PRIORITY — Before Week 2</h2>
  <table class="table">
    <tr><th>Test</th><th>Timing</th><th>Price Range</th><th>Why</th></tr>
    ${labTests.tests.filter((t: any) => t.priority === "high").map((t: any) => `<tr><td><strong>${t.name}</strong></td><td>${t.timing}</td><td>${t.price}</td><td style="font-size:9pt;">${t.why}</td></tr>`).join("")}
  </table>
  ` : ""}

  <div class="info">
    <strong>Lab chains in ${profile.location}:</strong> ${labTests.labChains}<br>
    <strong>Estimated total:</strong> Basic panel ${labTests.baseCost} · Comprehensive ${labTests.comprehensiveCost}<br>
    <strong>Protocol:</strong> ${labTests.fasting_protocol}
  </div>

  <h3>Testing Schedule</h3>
  <ul>
    <li><strong>Week 0 (NOW):</strong> All CRITICAL + HIGH tests — establish baseline before plan starts</li>
    <li><strong>Week 12 (Day 90):</strong> ${labTests.week12}</li>
    <li><strong>Annual:</strong> Full panel repeat for ongoing health monitoring</li>
  </ul>
</div>

${womensHealth && womensHealth.variant === "regular_cycle" && womensHealth.cycleSyncedPlan ? `
<!-- WOMEN'S HORMONAL HEALTH -->
<div class="page">
  <h1>Women's Hormonal Health</h1>
  <p><strong>28-Day Cycle-Synced Nutrition + Training</strong></p>
  ${womensHealth.note ? `<div class="info">${womensHealth.note}</div>` : ""}

  <table class="table">
    <tr><th>Phase</th><th>Days</th><th>Hormones</th><th>Calories</th><th>Training</th><th>Supplements</th></tr>
    ${womensHealth.cycleSyncedPlan.map((phase: any) => `
      <tr>
        <td><strong>${phase.phase}</strong></td><td>${phase.days}</td>
        <td style="font-size:8pt;">${phase.hormones}</td>
        <td style="font-size:9pt;">${phase.calorie_adjustment}</td>
        <td style="font-size:9pt;">${phase.training}</td>
        <td style="font-size:9pt;">${phase.supplements}</td>
      </tr>`).join("")}
  </table>

  ${womensHealth.condition_protocols?.insulin_control ? `
  <h3>PCOS-Specific Protocols</h3>
  <div class="warning">
    <strong>Insulin Control:</strong>
    <ul style="margin-top:6px;">${womensHealth.condition_protocols.insulin_control.diet_actions.map((a: string) => `<li>${a}</li>`).join("")}</ul>
    <p style="margin-top:8px;"><strong>Supplements:</strong> ${womensHealth.condition_protocols.insulin_control.supplements.join(", ")}</p>
    <p><strong>Labs:</strong> ${womensHealth.condition_protocols.insulin_control.labs}</p>
  </div>
  ` : ""}
</div>
` : ""}

${womensHealth && womensHealth.variant === "pcos_amenorrhea" ? `
<div class="page">
  <h1>${womensHealth.title}</h1>
  <div class="warning">${womensHealth.note}</div>
  <h3>Protocol Priorities</h3>
  <ul>${womensHealth.priorities.map((p: string) => `<li>${p}</li>`).join("")}</ul>
  <p style="margin-top:12px;"><em>Timeline: ${womensHealth.timeline}</em></p>
</div>
` : ""}

<!-- 90-DAY PROJECTION -->
<div class="page">
  <h1>90-Day Progress Projection</h1>
  <p>Based on: TDEE ${metabolics.tdee} kcal/day · Goal: ${profile.goalKey.replace(/_/g, " ")}</p>

  <table class="table">
    <tr><th>Checkpoint</th><th>Expected Weight</th><th>Change</th><th>Calorie Target</th><th>Action</th></tr>
    ${projection.checkpoints.map((cp: any) => `
      <tr>
        <td><strong>${cp.label}</strong></td>
        <td>${cp.weight_kg} kg</td>
        <td>${cp.change_kg >= 0 ? "+" : ""}${cp.change_kg} kg</td>
        <td>${cp.calorie_target} kcal/day</td>
        <td>${cp.action}</td>
      </tr>`).join("")}
  </table>

  <div class="info">${projection.note}</div>
</div>

<!-- CLOSING -->
<div class="page">
  <h1>Your Next Steps</h1>
  <p style="font-size:12pt; margin:20px 0;">${coverPage.name}, this blueprint is your evidence-based roadmap to better health. You don't need to be perfect — you need to be consistent. Start with the Top 3 Actions and build from there.</p>

  <div class="success" style="margin:20px 0; padding:16px;">
    <p style="font-size:12pt;"><strong>Week 1 focus:</strong> ${dashboard.topPriorities[0]?.title ?? "Fix your #1 limiting factor"}</p>
    <p style="font-size:11pt; margin-top:8px;">${dashboard.topPriorities[0]?.description ?? ""}</p>
  </div>

  <div class="info">
    <strong>Resources in ${profile.location}:</strong><br>
    Labs: ${cityContext.lab_chains}<br>
    Supplements: ${cityContext.supplement_stores}
  </div>

  <div class="footnote" style="margin-top:60px;">
    <strong>Disclaimer:</strong> This blueprint is for educational purposes and does not constitute medical advice. Always consult qualified healthcare professionals before making significant lifestyle changes. Individual results may vary based on adherence, genetics, and pre-existing conditions.<br><br>
    Generated by GeneWell Wellness Platform | Order: ${coverPage.orderId} | ${coverPage.generatedDate}<br>
    © 2026 GeneWell. All rights reserved. | www.genewell.in
  </div>
</div>

</body>
</html>`;
}
