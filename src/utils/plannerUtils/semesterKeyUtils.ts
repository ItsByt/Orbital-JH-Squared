export const EXEMPTION_KEY = "EXEMPTIONS";

// as const to derive union types
export const SPECIAL_SEMESTER_KEYS = [EXEMPTION_KEY, "SUMMER", "WINTER"] as const;
export type SpecialSemesterKey = (typeof SPECIAL_SEMESTER_KEYS)[number];

// Keys where semester validation doesn't apply
export function isUnvalidatedSemester(semesterKey: string): boolean {
    return SPECIAL_SEMESTER_KEYS.includes(semesterKey as SpecialSemesterKey);
}

// Keys where modules should't be counted in totals by default
export function isExemptionKey(semesterKey: string): boolean {
    return semesterKey === EXEMPTION_KEY;
}

// Extracts Year and Semester number from SemesterKeys: "Y1S2"
export function parseSemesterKey(key: string): { year: number; semester: number } {
    if (isUnvalidatedSemester(key)) return { year: 0, semester: 0 };

    const match = key.match(/Y(\d+)S(\d+)/);

    if (!match) {
        console.log("Developer Error: Invalid semesterKey format");
        throw new Error(`Invalid semesterKey format "${key}". Expected format like "Y1S1".`);
    }

    return {
        year: parseInt(match[1], 10),
        semester: parseInt(match[2], 10),
    };
}
