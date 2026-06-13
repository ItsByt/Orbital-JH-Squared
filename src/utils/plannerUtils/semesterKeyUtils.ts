export const EXEMPTION_KEY = "EXEMPTIONS";
export const EXEMPTIONS_YEAR = 0;

// as const to derive union types
export const SPECIAL_SEMESTER_KEYS = [EXEMPTION_KEY, "SUMMER", "WINTER"] as const;
export type SpecialSemesterKey = (typeof SPECIAL_SEMESTER_KEYS)[number];

export const SEMESTER_CODES = {
    EXEMPTIONS: 0,
    SEM_1: 1,
    SEM_2: 2,
    SPECIAL_TERM_1: 3, // NUSMods API defines Special Term 1 as 3
    SPECIAL_TERM_2: 4, // NUSMods API defines Special Term 2 as 4
    WINTER_BREAK: 5,
    SUMMER_BREAK: 6,
} as const;

// Maps semester string to semester code number
export const SEMESTER_CODE_MAP: Record<string, number> = {
    EXEMPTIONS: SEMESTER_CODES.EXEMPTIONS,
    S1: SEMESTER_CODES.SEM_1,
    S2: SEMESTER_CODES.SEM_2,
    ST1: SEMESTER_CODES.SPECIAL_TERM_1,
    ST2: SEMESTER_CODES.SPECIAL_TERM_2,
    WB: SEMESTER_CODES.WINTER_BREAK,
    SB: SEMESTER_CODES.SUMMER_BREAK,
};

// Maps semester code number to a semester string
export const REVERSE_SEMESTER_CODE_MAP: Record<number, string> = Object.fromEntries(
    Object.entries(SEMESTER_CODE_MAP).map(([key, value]) => [value, key])
);

// Left outside functions to avoid recomputation
const SUFFIX_PATTERN = Object.keys(SEMESTER_CODE_MAP).join("|");
const SEMESTER_REGEX = new RegExp(`^Y(\\d+)(${SUFFIX_PATTERN})$`);

// Used to check if a semester allows modules not to be validated
export function isUnvalidatedSemesterCode(semesterCode: number): boolean {
    return (
        semesterCode === SEMESTER_CODES.EXEMPTIONS ||
        semesterCode === SEMESTER_CODES.WINTER_BREAK ||
        semesterCode === SEMESTER_CODES.SUMMER_BREAK
    );
}

// Left outside function to only run once
const UNVALIDATED_SUFFIXES = Object.keys(SEMESTER_CODE_MAP).filter((suffix) =>
    isUnvalidatedSemesterCode(SEMESTER_CODE_MAP[suffix])
);

// Keys where semester validation doesn't apply
export function isUnvalidatedSemesterKey(semesterKey: string): boolean {
    if (semesterKey === EXEMPTION_KEY) return true;

    // Check if the key ends with any of the suffixes we identified as unvalidated
    return UNVALIDATED_SUFFIXES.some((suffix) => semesterKey.endsWith(suffix));
}

// Keys where modules should't be counted in totals by default
export function isExemptionKey(semesterKey: string): boolean {
    return semesterKey === EXEMPTION_KEY;
}

export function isExemptionYearSemValue(year: number, semester: number) {
    return year === EXEMPTIONS_YEAR && semester === SEMESTER_CODES.EXEMPTIONS;
}

// Extracts Year and Semester number from semesterKeys: "Y1S2"
export function parseSemesterKey(key: string): { year: number; semester: number } {
    if (isExemptionKey(key)) return { year: EXEMPTIONS_YEAR, semester: SEMESTER_CODES.EXEMPTIONS };

    const match = key.match(SEMESTER_REGEX);

    if (!match) {
        console.log("Developer Error: Invalid semesterKey format");
        throw new Error(`Invalid semesterKey format "${key}".`);
    }

    return {
        year: parseInt(match[1], 10),
        semester: SEMESTER_CODE_MAP[match[2]],
    };
}

// Used to reconstruct the semesterKey string from Supabase
export function buildKeyFromDB(year: number, semester: number): string {
    if (year === EXEMPTIONS_YEAR && semester === SEMESTER_CODES.EXEMPTIONS) {
        return EXEMPTION_KEY;
    }

    const suffix = REVERSE_SEMESTER_CODE_MAP[semester];

    if (!suffix) {
        throw new Error(`Unknown semester code from database: ${semester}`);
    }

    return `Y${year}${suffix}`;
}

// Used to check if a particular semester key is custom (i.e. not default to be shown)
export function isCustomSemesterKey(key: string): boolean {
    // Exemptions are always visible
    if (key === EXEMPTION_KEY) return false;

    const sem1Suffix = REVERSE_SEMESTER_CODE_MAP[SEMESTER_CODES.SEM_1];
    const sem2Suffix = REVERSE_SEMESTER_CODE_MAP[SEMESTER_CODES.SEM_2];

    // If it doesn't end with Sem 1 or Sem 2, it is a custom column
    return !key.endsWith(sem1Suffix) && !key.endsWith(sem2Suffix);
}
