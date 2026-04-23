/**
 * Condition × supplement contraindication matrix.
 *
 * Each entry is a (conditionPattern, supplementTag) → action with reason.
 * Patterns are matched case-insensitively against the user's medicalConditions
 * and the supplement's `tags` field from supplement-catalog.ts.
 *
 * Actions:
 *  - "exclude"      : never include this supplement.
 *  - "doctor-first" : include but display a "talk to doctor first" warning.
 *  - "reduce"       : include at reduced dose (caller must apply).
 *  - "swap"         : include the suggested replacement instead.
 */

import { SUPPLEMENT_CATALOG, type SupplementSpec, type EvidenceTier } from "./supplement-catalog";

export type ContraindicationAction = "exclude" | "doctor-first" | "reduce" | "swap";

export interface ContraindicationRule {
  conditionPattern: RegExp;
  supplementTag: RegExp;
  action: ContraindicationAction;
  reason: string;
  reasonHi?: string;
  swapTo?: string;
}

export interface IntoleranceRule {
  intolerancePattern: RegExp;
  supplementTag: RegExp;
  action: ContraindicationAction;
  reason: string;
  reasonHi?: string;
  swapTo?: string;
}

export const CONDITION_CONTRAINDICATIONS: ContraindicationRule[] = [
  {
    conditionPattern: /thyroid/i,
    supplementTag: /thyroid-modulator|ashwagandha/i,
    action: "doctor-first",
    reason: "Ashwagandha modulates thyroid; medicated thyroid users need physician input on TSH monitoring.",
    reasonHi: "अश्वगंधा थायरॉइड को बदलती है; दवा पर TSH निगरानी के लिए चिकित्सक से सलाह लें।",
  },
  {
    conditionPattern: /pregnan|breastfeed/i,
    supplementTag: /ashwagandha|curcumin/i,
    action: "exclude",
    reason: "Insufficient safety data in pregnancy/lactation.",
    reasonHi: "गर्भावस्था/स्तनपान में सुरक्षा डेटा अपर्याप्त।",
  },
  {
    conditionPattern: /blood.thinner|warfarin|aspirin/i,
    supplementTag: /omega-3|curcumin/i,
    action: "doctor-first",
    reason: "Mild antiplatelet effect can compound prescription anticoagulants.",
    reasonHi: "हल्का एंटीप्लेटलेट प्रभाव दवाओं के साथ संयुक्त होता है।",
  },
  {
    conditionPattern: /kidney|ckd/i,
    supplementTag: /magnesium|potassium/i,
    action: "doctor-first",
    reason: "Impaired clearance can cause accumulation; serum levels should be checked.",
    reasonHi: "गुर्दे की कार्यक्षमता घटने पर संचय हो सकता है; सीरम स्तर जांचें।",
  },
  {
    conditionPattern: /hemochromatosis|iron.overload/i,
    supplementTag: /iron/i,
    action: "exclude",
    reason: "Existing iron overload contraindicates additional iron.",
    reasonHi: "लोह अधिभार में अतिरिक्त आयरन वर्जित।",
  },
  {
    conditionPattern: /diabetes/i,
    supplementTag: /inositol/i,
    action: "doctor-first",
    reason: "May further lower blood glucose; coordinate with anti-diabetic medication.",
    reasonHi: "रक्त शर्करा और कम कर सकता है; दवा के साथ समन्वय करें।",
  },
];

export const INTOLERANCE_CONTRAINDICATIONS: IntoleranceRule[] = [
  {
    intolerancePattern: /seafood|^fish$/i,
    supplementTag: /\bfish\b|\bseafood\b/i,
    action: "swap",
    reason: "Fish-derived omega-3 is contraindicated for seafood intolerance.",
    reasonHi: "मछली-व्युत्पन्न ओमेगा-3 समुद्री-असहिष्णुता में वर्जित।",
    swapTo: "omega3_algae",
  },
];

export interface ContraindicationDecision {
  supplement: SupplementSpec;
  action: ContraindicationAction | "include";
  reason?: string;
  reasonHi?: string;
}

export interface RejectedSupplement {
  supplementId: string;
  supplementName: string;
  reason: string;
  reasonHi?: string;
}

export interface FilteredSupplements {
  included: ContraindicationDecision[];
  rejected: RejectedSupplement[];
}

/**
 * Walk a list of candidate supplement IDs through the matrix.
 * Returns the surviving (included or annotated) list plus a log of rejections.
 */
export function applyContraindications(
  candidateIds: string[],
  conditions: string[],
  intolerances: string[],
): FilteredSupplements {
  const included: ContraindicationDecision[] = [];
  const rejected: RejectedSupplement[] = [];

  for (const id of candidateIds) {
    let supp = SUPPLEMENT_CATALOG[id];
    if (!supp) continue;

    let action: ContraindicationAction | "include" = "include";
    let reason: string | undefined;
    let reasonHi: string | undefined;

    for (const rule of INTOLERANCE_CONTRAINDICATIONS) {
      if (!intolerances.some(i => rule.intolerancePattern.test(i))) continue;
      if (!supp.tags.some(t => rule.supplementTag.test(t))) continue;
      if (rule.action === "swap" && rule.swapTo && SUPPLEMENT_CATALOG[rule.swapTo]) {
        supp = SUPPLEMENT_CATALOG[rule.swapTo];
        reason = rule.reason; reasonHi = rule.reasonHi;
        action = "swap";
        continue;
      }
      if (rule.action === "exclude") {
        rejected.push({ supplementId: supp.id, supplementName: supp.name, reason: rule.reason, reasonHi: rule.reasonHi });
        action = "exclude";
        break;
      }
      action = rule.action;
      reason = rule.reason; reasonHi = rule.reasonHi;
    }
    if (action === "exclude") continue;

    for (const rule of CONDITION_CONTRAINDICATIONS) {
      if (!conditions.some(c => rule.conditionPattern.test(c))) continue;
      if (!supp.tags.some(t => rule.supplementTag.test(t))) continue;
      if (rule.action === "exclude") {
        rejected.push({ supplementId: supp.id, supplementName: supp.name, reason: rule.reason, reasonHi: rule.reasonHi });
        action = "exclude";
        break;
      }
      if (rule.action === "swap" && rule.swapTo && SUPPLEMENT_CATALOG[rule.swapTo]) {
        supp = SUPPLEMENT_CATALOG[rule.swapTo];
        reason = rule.reason; reasonHi = rule.reasonHi;
        action = "swap";
        continue;
      }
      if (action === "include" || rule.action === "doctor-first") {
        action = rule.action;
        reason = rule.reason; reasonHi = rule.reasonHi;
      }
    }
    if (action === "exclude") continue;

    included.push({ supplement: supp, action, reason, reasonHi });
  }

  return { included, rejected };
}

export function tierBadge(tier: EvidenceTier): string {
  switch (tier) {
    case "Tier 1": return "[T1 · RCT]";
    case "Tier 2": return "[T2 · Mech]";
    case "Tier 3": return "[T3 · Trad]";
  }
}
