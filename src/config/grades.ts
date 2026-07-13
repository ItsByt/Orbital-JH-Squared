export interface GradeDefinition {
    pointValue: number;        // The number used for GPA math (e.g., 5.0)
    countsTowardsGPA: boolean; // Denominator inclusion (True for A-F, False for CS/CU/S/U)
    grantsUnits: boolean;      // Does it give earned credits? (True for A-D/CS/S, False for F/CU/U)
    isSU: boolean;             // Does it consume an S/U option?
}

// Single Source of Truth for all Grading Logic
export const GRADE_DICTIONARY: Record<string, GradeDefinition> = {
    "A+": { pointValue: 5.0, countsTowardsGPA: true, grantsUnits: true, isSU: false },
    "A":  { pointValue: 5.0, countsTowardsGPA: true, grantsUnits: true, isSU: false },
    "A-": { pointValue: 4.5, countsTowardsGPA: true, grantsUnits: true, isSU: false },
    "B+": { pointValue: 4.0, countsTowardsGPA: true, grantsUnits: true, isSU: false },
    "B":  { pointValue: 3.5, countsTowardsGPA: true, grantsUnits: true, isSU: false },
    "B-": { pointValue: 3.0, countsTowardsGPA: true, grantsUnits: true, isSU: false },
    "C+": { pointValue: 2.5, countsTowardsGPA: true, grantsUnits: true, isSU: false },
    "C":  { pointValue: 2.0, countsTowardsGPA: true, grantsUnits: true, isSU: false },
    "D+": { pointValue: 1.5, countsTowardsGPA: true, grantsUnits: true, isSU: false },
    "D":  { pointValue: 1.0, countsTowardsGPA: true, grantsUnits: true, isSU: false },
    
    // Failing Grade: Impacts GPA (0 points), but grants no units
    "F":  { pointValue: 0.0, countsTowardsGPA: true, grantsUnits: false, isSU: false },
    
    // CS/CU: No GPA impact. CS gives units, CU doesn't.
    "CS": { pointValue: 0.0, countsTowardsGPA: false, grantsUnits: true, isSU: false },
    "CU": { pointValue: 0.0, countsTowardsGPA: false, grantsUnits: false, isSU: false },
    
    // S/U: No GPA impact. Consumes SU count. S gives units, U doesn't.
    "S":  { pointValue: 0.0, countsTowardsGPA: false, grantsUnits: true, isSU: true },
    "U":  { pointValue: 0.0, countsTowardsGPA: false, grantsUnits: false, isSU: true },
};

// Helper for UI dropdowns
export const AVAILABLE_GRADES = Object.keys(GRADE_DICTIONARY);
