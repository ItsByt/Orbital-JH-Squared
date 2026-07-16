import { describe, it, expect } from "vitest";
import {
    parseSemesterKey,
    buildKeyFromDB,
    isUnvalidatedSemesterKey,
    formatSemesterKeyReadable,
    EXEMPTION_KEY,
    SEMESTER_CODES
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
            expect(() => parseSemesterKey("INVALID_KEY")).toThrow();
            expect(() => parseSemesterKey("Y1")).toThrow(); // missing sem suffix
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

    describe("formatSemesterKeyReadable", () => {
        it.each([
            { input: "Y1S1", expected: "Year 1 Semester 1" },
            { input: "Y3ST2", expected: "Year 3 Special Term II" },
            { input: EXEMPTION_KEY, expected: "Exemptions" },
        ])("should format $input to '$expected'", ({ input, expected }) => {
            expect(formatSemesterKeyReadable(input)).toBe(expected);
        });
    });
});
