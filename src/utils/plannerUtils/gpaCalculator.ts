import type { PlannerModule } from "@/types";
import { GRADE_DICTIONARY } from "@/config/grades";

export interface GPAResult {
    gpa: number | null; // Null if no graded modules taken yet
    totalEarnedUnits: number; // Includes CS/S and Exemptions
    gpaAttemptedUnits: number; // Only units that impact GPA (A-F)
    suUsedCount: number;
}

export function calculateStatistics(modules: PlannerModule[]): GPAResult {
    let totalQualityPoints = 0; // Numerator: (Grade * Credits)
    let gpaAttemptedUnits = 0;  // Denominator: Credits that impact GPA
    let totalEarnedUnits = 0;   // Credits that count towards graduation
    let suUsedCount = 0;

    modules.forEach((mod) => {
        // If excluded by user, skip entirely
        if (mod.excludeFromTotal) return;

        // If module has no grade yet, skip it
        if (!mod.grade) {
            return; 
        }

        const gradeDef = GRADE_DICTIONARY[mod.grade.toUpperCase()];

        if (!gradeDef) return;

        // Calculate GPA: Attempted Units (The Denominator) & Quality Points (The Numerator)
        if (gradeDef.countsTowardsGPA) {
            gpaAttemptedUnits += mod.moduleCredit;
            totalQualityPoints += (gradeDef.pointValue * mod.moduleCredit);
        }

        if (gradeDef.grantsUnits) {
            totalEarnedUnits += mod.moduleCredit;
        }

        if (gradeDef.isSU) {
            suUsedCount += 1;
        }
    });

    let gpa: number | null = null;
    if (gpaAttemptedUnits > 0) {
        gpa = Number((totalQualityPoints / gpaAttemptedUnits).toFixed(2));
    }

    return {
        gpa,
        totalEarnedUnits,
        gpaAttemptedUnits,
        suUsedCount
    };
}