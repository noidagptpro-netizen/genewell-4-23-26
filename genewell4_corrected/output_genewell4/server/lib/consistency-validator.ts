/**
 * consistency-validator.ts
 * Validates that all cross-section values are consistent before PDF render.
 * Catches errors like two different calorie targets or two different stress scores.
 * Ported from genewell_complete/src/engine/consistencyValidator.js
 */

import { INTOLERANCE_INGREDIENT_MAP } from "./wellness-constants";
import type { WellnessEngineProfile } from "./wellness-engine";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEngineReport(profile: WellnessEngineProfile, reportData: Record<string, any>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Rule 1: All calorie references must match profile.goalCalories
  const cal = profile.goalCalories;
  if (reportData.nutrition && reportData.nutrition.goalCalories !== cal) {
    errors.push(`Calorie mismatch: nutrition section has ${reportData.nutrition.goalCalories}, profile has ${cal}`);
  }

  // Rule 2: All score references must match profile.scores
  for (const [dim, score] of Object.entries(profile.scores)) {
    if (dim === "overall") continue;
    if (reportData[dim] && reportData[dim].score && reportData[dim].score !== score) {
      errors.push(`Score mismatch in ${dim}: section has ${reportData[dim].score}, profile has ${score}`);
    }
  }

  // Rule 3: No blocked ingredient appears anywhere
  for (const intolerance of profile.food_intolerances) {
    if (intolerance === "none") continue;
    const blocked = INTOLERANCE_INGREDIENT_MAP[intolerance] ?? [];
    if (reportData.supplements) {
      for (const supp of reportData.supplements) {
        if (!supp || supp.excluded || supp.existing) continue;
        const suppName = (supp.name || "").toLowerCase();
        for (const ingredient of blocked) {
          if (suppName.includes(ingredient)) {
            errors.push(`SAFETY: Blocked ingredient "${ingredient}" found in supplement "${supp.name}" — intolerance: ${intolerance}`);
          }
        }
      }
    }
  }

  // Rule 5: Protein target consistency
  if (reportData.nutrition && reportData.nutrition.macros) {
    if (reportData.nutrition.macros.protein_g !== profile.macros.protein_g) {
      warnings.push(`Protein target: nutrition section (${reportData.nutrition.macros.protein_g}g) differs from profile (${profile.macros.protein_g}g)`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
