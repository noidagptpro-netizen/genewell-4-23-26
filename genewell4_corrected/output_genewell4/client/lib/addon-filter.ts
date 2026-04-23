import type { AddOn } from "./products";
import { DEPRECATED_ADDON_IDS } from "./products";

// Gender-based addon filtering rules (mirrors shared/addon_rules.json).
// Deprecated add-ons are also hidden universally regardless of gender.
const GENDER_HIDE: Record<string, string[]> = {
  male: ["addon_women_hormone", "addon_women_hormonal"],
  female: ["addon_men_fitness"],
  other: [],
  "non-binary": [],
};

// Addons that are MALE-ONLY (shown for male, other, non-binary only)
const MALE_ONLY_ADDONS = new Set(["addon_men_fitness"]);
// Addons that are FEMALE-ONLY (shown for female, other, non-binary only)
const FEMALE_ONLY_ADDONS = new Set(["addon_women_hormone", "addon_women_hormonal"]);

/**
 * Filters the addon list based on the user's gender.
 * Returns only addons applicable for the given gender.
 */
export function filterAddonsByGender(addOns: AddOn[], gender: string | null | undefined): AddOn[] {
  // Always strip deprecated add-ons regardless of gender (Phase 3).
  const live = addOns.filter(a => !DEPRECATED_ADDON_IDS.includes(a.id));
  if (!gender) return live; // No gender stored yet → show all live (quiz not completed)

  const g = gender.toLowerCase().trim();
  const hiddenIds = GENDER_HIDE[g] ?? [];

  return live.filter(addon => !hiddenIds.includes(addon.id));
}

/**
 * Validates a set of selected addon IDs against a gender.
 * Returns { valid: boolean, rejectedAddons: string[], message: string }
 */
export function validateAddonGenderMatch(
  selectedAddonIds: string[],
  gender: string | null | undefined
): { valid: boolean; rejectedAddons: string[]; message: string } {
  if (!gender) return { valid: true, rejectedAddons: [], message: "" };

  const g = gender.toLowerCase().trim();
  const hiddenIds = GENDER_HIDE[g] ?? [];
  const rejectedAddons = selectedAddonIds.filter(id => hiddenIds.includes(id));

  if (rejectedAddons.length === 0) {
    return { valid: true, rejectedAddons: [], message: "" };
  }

  const isMale = g === "male";
  const isFemale = g === "female";

  let message = "";
  if (isMale && rejectedAddons.some(id => FEMALE_ONLY_ADDONS.has(id))) {
    message = "Women's Hormonal Health add-on is not applicable for male profiles and has been removed.";
  } else if (isFemale && rejectedAddons.some(id => MALE_ONLY_ADDONS.has(id))) {
    message = "Men's Performance Pack is not applicable for female profiles and has been removed.";
  } else {
    message = `The following add-ons are not compatible with your profile and have been removed: ${rejectedAddons.join(", ")}`;
  }

  return { valid: false, rejectedAddons, message };
}

/**
 * Removes gender-incompatible addons from the selected list.
 * Returns the cleaned list of addon IDs.
 */
export function removeIncompatibleAddons(
  selectedAddonIds: string[],
  gender: string | null | undefined
): string[] {
  if (!gender) return selectedAddonIds;
  const g = gender.toLowerCase().trim();
  const hiddenIds = GENDER_HIDE[g] ?? [];
  return selectedAddonIds.filter(id => !hiddenIds.includes(id));
}

/**
 * Get the gender stored in localStorage from quiz data.
 * Returns null if not found.
 */
export function getStoredGender(): string | null {
  try {
    const quizData = JSON.parse(localStorage.getItem("quizData") || "null");
    return quizData?.gender ?? null;
  } catch {
    return null;
  }
}

/**
 * Phase 3 — derive the minimal profile fields needed for
 * `computeEffectiveAddOns` (gender, age, medicalConditions) from
 * the quiz data persisted in localStorage. Returns null when no quiz
 * has been completed yet.
 */
export interface StoredProfileShape {
  gender: string | null;
  age: number | null;
  medicalConditions: string[];
}

export function getStoredProfile(): StoredProfileShape | null {
  try {
    const quizData = JSON.parse(localStorage.getItem("quizData") || "null");
    if (!quizData) return null;
    const conds: string[] = [];
    const raw = quizData.medicalConditions ?? quizData.healthConditions ?? quizData.conditions;
    if (Array.isArray(raw)) {
      for (const c of raw) if (typeof c === "string") conds.push(c);
    } else if (typeof raw === "string" && raw.length > 0) {
      conds.push(raw);
    }
    // Age may arrive as either number or numeric string (the quiz
    // captures it as a string in some locales). Coerce defensively so
    // the perimenopausal auto-include rule does not silently fail.
    let age: number | null = null;
    if (typeof quizData.age === "number" && Number.isFinite(quizData.age)) {
      age = quizData.age;
    } else if (typeof quizData.age === "string" && quizData.age.trim() !== "") {
      const n = Number(quizData.age);
      if (Number.isFinite(n)) age = n;
    }
    return {
      gender: quizData.gender ?? null,
      age,
      medicalConditions: conds,
    };
  } catch {
    return null;
  }
}
