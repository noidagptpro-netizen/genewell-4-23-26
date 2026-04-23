/**
 * Phase 3 — effective add-on resolution.
 *
 * "Effective" add-ons are the union of:
 *   - what the user explicitly purchased (selected),
 *   - what the plan tier bundles for free (e.g. Pro+ bundles addon_products),
 *   - what the user's profile auto-includes (e.g. Women's Hormonal Health
 *     for PCOS / thyroid / perimenopausal female profiles).
 *
 * Pure shared module — no DOM, no DB, no network.
 */

import type { WellnessUserProfile } from "./wellness-types";

export const PRODUCTS_BUNDLED_PLAN_IDS: readonly string[] = [
  "premium_blueprint",
  "coaching_blueprint",
  "subscription_all_access",
];

export const ADDON_PRODUCTS_ID = "addon_products";
export const ADDON_WOMEN_HORMONE_ID = "addon_women_hormone";
export const ADDON_LAB_INTERPRETATION_ID = "addon_lab_interpretation";

export interface EffectiveAddOnEntry {
  id: string;
  source: "selected" | "tier_bundled" | "auto_included";
  reason?: string;
}

export interface EffectiveAddOnsResult {
  ids: string[];                    // de-duplicated union
  entries: EffectiveAddOnEntry[];   // per-id provenance
  autoIncluded: string[];           // subset added by profile rules
  tierBundled: string[];            // subset bundled by plan tier
}

function hasCondition(profile: WellnessUserProfile, pattern: RegExp): boolean {
  return (profile.medicalConditions || []).some(c => pattern.test(c));
}

/**
 * Add-ons that should be silently included (₹0) for matching profiles,
 * even when the user did not select them on the pricing page.
 */
export function autoIncludedAddOns(profile: WellnessUserProfile): EffectiveAddOnEntry[] {
  const out: EffectiveAddOnEntry[] = [];

  // Women's Hormonal Health auto-inclusion: per Phase 3 product spec,
  // free inclusion is gated strictly on explicit clinical markers in
  // medicalConditions (PCOS, thyroid history, or a (peri)menopause
  // marker). Age is intentionally NOT used as a proxy — preventive
  // women without a marker remain on the paid path.
  const isFemale = profile.gender === "female";
  if (isFemale) {
    const pcos = hasCondition(profile, /pcos/i);
    const thyroid = hasCondition(profile, /thyroid/i);
    const explicitMeno = hasCondition(profile, /(peri[\s-]?menopaus|menopaus)/i);
    if (pcos || thyroid || explicitMeno) {
      const reasons: string[] = [];
      if (pcos) reasons.push("PCOS");
      if (thyroid) reasons.push("thyroid");
      if (explicitMeno) reasons.push("(peri)menopausal marker");
      out.push({
        id: ADDON_WOMEN_HORMONE_ID,
        source: "auto_included",
        reason: `Auto-included: ${reasons.join(" / ")}`,
      });
    }
  }

  return out;
}

/**
 * Add-ons that the plan tier bundles for free (no separate purchase).
 */
export function tierBundledAddOns(planId: string): EffectiveAddOnEntry[] {
  const out: EffectiveAddOnEntry[] = [];
  if (PRODUCTS_BUNDLED_PLAN_IDS.includes(planId)) {
    out.push({
      id: ADDON_PRODUCTS_ID,
      source: "tier_bundled",
      reason: "Included with Pro+ tier",
    });
  }
  return out;
}

export function computeEffectiveAddOns(
  selected: string[],
  profile: WellnessUserProfile,
  planId: string,
): EffectiveAddOnsResult {
  const seen = new Set<string>();
  const entries: EffectiveAddOnEntry[] = [];

  for (const id of selected) {
    if (!seen.has(id)) {
      seen.add(id);
      entries.push({ id, source: "selected" });
    }
  }

  const tierBundled = tierBundledAddOns(planId);
  for (const entry of tierBundled) {
    if (!seen.has(entry.id)) {
      seen.add(entry.id);
      entries.push(entry);
    }
  }

  const autoIncluded = autoIncludedAddOns(profile);
  for (const entry of autoIncluded) {
    if (!seen.has(entry.id)) {
      seen.add(entry.id);
      entries.push(entry);
    }
  }

  return {
    ids: entries.map(e => e.id),
    entries,
    autoIncluded: autoIncluded.map(e => e.id),
    tierBundled: tierBundled.map(e => e.id),
  };
}
