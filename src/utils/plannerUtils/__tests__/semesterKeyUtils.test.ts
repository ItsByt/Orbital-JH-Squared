import { describe, it, expect, vi } from "vitest";
import {
    SEMESTER_CODES,
    parseSemesterKey,
    EXEMPTION_KEY,
    buildKeyFromDB,
    isUnvalidatedSemesterKey,
    isExemptionKey,
    isExemptionYearSemValue,
    formatSemesterKeyReadable,
    isCustomSemesterKey,
} from "../semesterKeyUtils";

describe("Semester Key Utils", () => {
    describe("parseSemesterKey", () => {
        // Parameterized tests to test multiple data points against the same logic cleanly
        it.each([
            { input: "Y1S1", expectedYear: 1, expectedSem: SEMESTER_CODES.SEM_1 },
            { input: "Y3S2", expectedYear: 3, expectedSem: SEMESTER_CODES.SEM_2 },
            { input: "Y2ST1", expectedYear: 2, expectedSem: SEMESTER_CODES.SPECIAL_TERM_1 },
            { input: "Y4WB", expectedYear: 4, expectedSem: SEMESTER_CODES.WINTER_BREAK },
        ])("should correctly parse $input", ({ input, expectedYear, expectedSem }) => {
            const result = parseSemesterKey(input);
            expect(result.year).toBe(expectedYear);
            expect(result.semester).toBe(expectedSem);
        });

        it("should return Exemption constants for the Exemption key", () => {
            const result = parseSemesterKey(EXEMPTION_KEY);
            expect(result.year).toBe(0);
            expect(result.semester).toBe(SEMESTER_CODES.EXEMPTIONS);
        });

        it("should throw an error for malformed keys", () => {
            // Wrapped in a function so `expect().toThrow()` can catch it

            // Muting console.error temporarily so it doesn't print to the terminal during the test
            const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

            expect(() => parseSemesterKey("INVALID_KEY")).toThrow();
            expect(() => parseSemesterKey("Y1")).toThrow(); // missing sem suffix

            // Restoring the console back to normal
            consoleSpy.mockRestore();
        });
    });

    describe("buildKeyFromDB", () => {
        it.each([
            { year: 1, sem: SEMESTER_CODES.SEM_1, expected: "Y1S1" },
            { year: 4, sem: SEMESTER_CODES.SUMMER_BREAK, expected: "Y4SB" },
        ])("should build $expected from year $year and sem $sem", ({ year, sem, expected }) => {
            expect(buildKeyFromDB(year, sem)).toBe(expected);
        });

        it("should throw an error for unknown semester codes", () => {
            expect(() => buildKeyFromDB(1, 999)).toThrow("Unknown semester code");
        });
    });

    describe("isUnvalidatedSemesterKey", () => {
        it("should return true for semesters that do not require validation", () => {
            expect(isUnvalidatedSemesterKey(EXEMPTION_KEY)).toBe(true);
            expect(isUnvalidatedSemesterKey("Y1WB")).toBe(true); // Winter break
            expect(isUnvalidatedSemesterKey("Y2SB")).toBe(true); // Summer break
        });

        it("should return false for standard semesters requiring validation", () => {
            expect(isUnvalidatedSemesterKey("Y1S1")).toBe(false);
            expect(isUnvalidatedSemesterKey("Y3S2")).toBe(false);
            expect(isUnvalidatedSemesterKey("Y2ST1")).toBe(false); // Special terms usually require validation
        });
    });

    describe("isExemptionKey / isExemptionYearSemValue", () => {
        it("should identify exemption keys correctly", () => {
            expect(isExemptionKey(EXEMPTION_KEY)).toBe(true);
            expect(isExemptionKey("Y1S1")).toBe(false);
        });
        it("should identify exemption year/sem values correctly", () => {
            expect(isExemptionYearSemValue(0, 0)).toBe(true);
            expect(isExemptionYearSemValue(1, 1)).toBe(false);
        });
    });

    describe("formatSemesterKeyReadable", () => {
        it.each([
            { input: "Y1S1", expected: "Year 1 Semester 1" },
            { input: "Y4S2", expected: "Year 4 Semester 2" },
            { input: "Y3ST2", expected: "Year 3 Special Term II" },
            { input: EXEMPTION_KEY, expected: "Exemptions" },
            { input: "Y2WB", expected: "Year 2 Winter Break" },
        ])("should format $input to '$expected'", ({ input, expected }) => {
            expect(formatSemesterKeyReadable(input)).toBe(expected);
        });
    });

    describe("isCustomSemesterKey", () => {
        it("should return false for exemptions, S1, and S2", () => {
            expect(isCustomSemesterKey(EXEMPTION_KEY)).toBe(false);
            expect(isCustomSemesterKey("Y1S1")).toBe(false);
            expect(isCustomSemesterKey("Y2S2")).toBe(false);
        });
        it("should return true for other keys like ST1, WB", () => {
            expect(isCustomSemesterKey("Y1ST1")).toBe(true);
            expect(isCustomSemesterKey("Y1WB")).toBe(true);
        });
    });
});
