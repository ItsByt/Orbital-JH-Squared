import { describe, it, expect, vi } from "vitest";
import { PrereqTree } from "@/types";
import {
    removeModuleCodeGrade,
    removeModuleCodeWildCard,
    evaluatePrereqTree,
    extractModulesFromTree,
    trimPrereqTree,
    getSemesterAbsoluteTime,
} from "../plannerPreReqUtils";
import * as SemesterKeyUtils from "../semesterKeyUtils";

describe("Planner Pre-Req Utilities", () => {
    describe("getSemesterAbsoluteTime", () => {
        it("should return 0 for Exemptions", () => {
            expect(getSemesterAbsoluteTime("EXEMPTIONS")).toBe(0);
        });

        it("should calculate correct chronological weights", () => {
            // Y1S1 < Y1S2 < Y2S1
            const time1 = getSemesterAbsoluteTime("Y1S1");
            const time2 = getSemesterAbsoluteTime("Y1S2");
            const time3 = getSemesterAbsoluteTime("Y2S1");
            expect(time1).toBeLessThan(time2);
            expect(time2).toBeLessThan(time3);
        });

        it("should throw an error for unmapped semester codes", () => {
            // Spy on parseSemesterKey to force it to return a fake, unmapped semester code (99)
            const spy = vi
                .spyOn(SemesterKeyUtils, "parseSemesterKey")
                .mockReturnValue({ year: 1, semester: 99 });
            expect(() => getSemesterAbsoluteTime("FAKE_KEY")).toThrow(
                "Developer Error: Unmapped chronological order"
            );
            spy.mockRestore();
        });
    });

    describe("String Formatters", () => {
        it("removeModuleCodeGrade: should strip grade requirements", () => {
            expect(removeModuleCodeGrade("CS1101S:D")).toBe("CS1101S");
            expect(removeModuleCodeGrade("MA1521")).toBe("MA1521");
            expect(removeModuleCodeGrade(" CS2040S : C ")).toBe("CS2040S");
        });

        it("removeModuleCodeWildCard: should strip wildcard symbols", () => {
            expect(removeModuleCodeWildCard("CS2%")).toBe("CS2");
            expect(removeModuleCodeWildCard("MA1%")).toBe("MA1");
        });
    });

    describe("evaluatePrereqTree", () => {
        const takenSet = new Set(["CS1101S", "MA1521", "CS2030S", "ST2334"]);

        it("should return true for empty or null trees", () => {
            expect(evaluatePrereqTree(null, takenSet)).toBe(true);
            expect(evaluatePrereqTree(undefined, takenSet)).toBe(true);
        });

        it("should correctly evaluate simple string requirements", () => {
            expect(evaluatePrereqTree("CS1101S:D", takenSet)).toBe(true);
            expect(evaluatePrereqTree("CS2040S", takenSet)).toBe(false);
        });

        it("should correctly evaluate wildcard requirements", () => {
            // We have ST2334 in our set, so ST2% should pass
            expect(evaluatePrereqTree("ST2%:D", takenSet)).toBe(true);
            expect(evaluatePrereqTree("CS3%", takenSet)).toBe(false);
        });

        it("should hit the fallback return true for unknown node types", () => {
            // @ts-expect-error - Testing runtime fallback
            expect(evaluatePrereqTree({ unknown_key: "value" }, takenSet)).toBe(true);
        });
    });

    describe("extractModulesFromTree", () => {
        it("should flatten a complex tree into a single array of strings", () => {
            const tree: PrereqTree = {
                and: [
                    "CS1101S:D",
                    { or: ["CS2030S", "CS2040S"] },
                    { nOf: [1, ["MA1521", "MA1522"]] },
                ],
            };
            const result = extractModulesFromTree(tree);
            expect(result).toEqual(["CS1101S", "CS2030S", "CS2040S", "MA1521", "MA1522"]);
        });
    });

    describe("trimPrereqTree", () => {
        // Tests below use Target Module being placed at Time: 20
        const boardMap = {
            CS1101S: { time: 10, semKey: "Y1S1" },
            MA1521: { time: 10, semKey: "Y1S1" },
            CS2040S: { time: 25, semKey: "Y2S2" },
            ST2334: { time: 20, semKey: "Y2S1" },
        };

        it("should return MISSING if all OR options are completely missing", () => {
            const tree = { or: ["IS1108", "XX9999"] };
            const result = trimPrereqTree(tree, boardMap, 20);
            expect(result.status).toBe("MISSING");
        });

        it("should return MISSING if any AND child is completely missing", () => {
            const tree = { and: ["CS1101S", "XX9999"] };
            const result = trimPrereqTree(tree, boardMap, 20);
            expect(result.status).toBe("MISSING");
        });

        describe("nOf logic", () => {
            const nOfBoardMap = {
                MA1101: { time: 10, semKey: "Y1S1" }, // Valid
                MA1102: { time: 25, semKey: "Y2S2" }, // Misplaced
            };

            it("should return MISPLACED if valid + misplaced meets the count", () => {
                const tree: PrereqTree = { nOf: [2, ["MA1101", "MA1102", "MA1103"]] };
                const result = trimPrereqTree(tree, nOfBoardMap, 20);
                expect(result.status).toBe("MISPLACED");
            });

            it("should return MISSING if valid + misplaced is less than required count", () => {
                const tree: PrereqTree = { nOf: [3, ["MA1101", "MA1102", "MA1103"]] };
                const result = trimPrereqTree(tree, nOfBoardMap, 20);
                expect(result.status).toBe("MISSING");
            });
        });

        describe("Fallback", () => {
            it("should return a VALID result for an unknown node type to safely ignore it", () => {
                // @ts-expect-error - Testing runtime fallback for bad data
                const result = trimPrereqTree({ unknown_key: "value" }, boardMap, 20);
                expect(result.status).toBe("VALID");
                expect(result.tree).toBeNull();
            });
        });
    });

    describe("NUSMods API Edge Cases (Cohorts & Wildcards)", () => {
        const boardMap = {
            EC3101: { time: 10, semKey: "Y1S1" },
        };

        it("EC4301: Safely trims bare sibling cohort objects without collapsing the array", () => {
            const rawApiTree: PrereqTree = {
                and: [
                    { cohort: { rule: "MUST_BE_IN", years: ["S:2021"] } },
                    { nOf: [5, ["EC%:D"]] },
                    { nOf: [2, ["ST2131", "ST3131"]] },
                ],
            };
            const result = trimPrereqTree(rawApiTree, boardMap, 20);

            // The cohort object should be deleted, leaving just the 2 valid nOf requirements
            expect(result.tree).toEqual({
                and: [{ nOf: [5, ["EC%"]] }, { nOf: [2, ["ST2131", "ST3131"]] }],
            });
        });

        it("EC4301: Deduplicates identical repeating OR blocks", () => {
            // When grades are stripped, EC3101:B and EC3101:A both become EC3101.
            const rawApiTree: PrereqTree = {
                or: [{ and: ["EC3101:B-", "EC3102:A"] }, { and: ["EC3101:B+", "EC3102:B+"] }],
            };
            const result = trimPrereqTree(rawApiTree, boardMap, 20);

            // Should completely deduplicate into a single AND block
            expect(result.tree).toEqual({ and: ["EC3101", "EC3102"] });
        });

        it("BSP1702: Should return VALID for a tree that is purely Cohort rules", () => {
            const rawApiTree: PrereqTree = {
                or: [
                    { cohort: { rule: "MUST_BE_IN", years: ["S:2017"] } },
                    { cohort: { rule: "MUST_BE_IN", years: ["S:2023/24"] } },
                ],
            };
            const result = trimPrereqTree(rawApiTree, boardMap, 20);
            expect(result.status).toBe("VALID");
            expect(result.tree).toBeNull(); // Empty tree means nothing to render in UI
        });
    });
});
