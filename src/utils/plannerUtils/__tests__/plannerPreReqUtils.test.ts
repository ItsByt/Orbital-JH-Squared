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
            expect(evaluatePrereqTree("ST2%", takenSet)).toBe(true);
            expect(evaluatePrereqTree("CS3%", takenSet)).toBe(false);
        });

        it("should evaluate AND logic", () => {
            const tree = { and: ["CS1101S", "MA1521"] };
            const failTree = { and: ["CS1101S", "CS2040S"] };

            expect(evaluatePrereqTree(tree, takenSet)).toBe(true);
            expect(evaluatePrereqTree(failTree, takenSet)).toBe(false);
        });

        it("should evaluate OR logic", () => {
            const tree = { or: ["MA1521", "MA1522"] }; // MA1521 is taken
            const failTree = { or: ["CS2040S", "CS2100"] }; // Neither taken

            expect(evaluatePrereqTree(tree, takenSet)).toBe(true);
            expect(evaluatePrereqTree(failTree, takenSet)).toBe(false);
        });

        it("should evaluate nOf (at least X) logic", () => {
            // We need 2 from this list. We have CS1101S and MA1521.
            const tree: PrereqTree = { nOf: [2, ["CS1101S", "MA1521", "CS2040S"]] };
            expect(evaluatePrereqTree(tree, takenSet)).toBe(true);

            // We need 3, but only have 2.
            const failTree: PrereqTree = { nOf: [3, ["CS1101S", "MA1521", "CS2040S"]] };
            expect(evaluatePrereqTree(failTree, takenSet)).toBe(false);
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

        it("should hit the fallback return empty array for unknown node types", () => {
            // @ts-expect-error - Testing runtime fallback
            expect(extractModulesFromTree({ unknown_key: "value" })).toEqual([]);
        });
    });

    describe("trimPrereqTree", () => {
        // Tests below use Target Module being placed at Time: 20
        const boardMap = {
            CS1101S: { time: 10, semKey: "Y1S1" }, // Valid (taken before 20)
            MA1521: { time: 10, semKey: "Y1S1" }, // Valid
            CS2040S: { time: 25, semKey: "Y2S2" }, // Misplaced (taken AFTER target)
            ST2334: { time: 20, semKey: "Y2S1" }, // Misplaced (taken SAME TIME as target)
        };

        it("should return VALID for a prerequisite taken earlier", () => {
            const result = trimPrereqTree("CS1101S", boardMap, 20);
            expect(result.status).toBe("VALID");
            expect(result.hasMisplaced).toBe(false);
            expect(result.hasMissing).toBe(false);
        });

        it("should return MISPLACED for a prerequisite taken later or at same time", () => {
            const result = trimPrereqTree("CS2040S", boardMap, 20);
            expect(result.status).toBe("MISPLACED");
            expect(result.hasMisplaced).toBe(true);

            const resultSameTime = trimPrereqTree("ST2334", boardMap, 20);
            expect(resultSameTime.status).toBe("MISPLACED");
        });

        it("should return MISSING if prerequisite is not on the board at all", () => {
            const result = trimPrereqTree("IS1108", boardMap, 20);
            expect(result.status).toBe("MISSING");
            expect(result.hasMissing).toBe(true);
        });

        // OR Tests
        describe("OR logic", () => {
            it("should collapse OR trees if at least one option is VALID", () => {
                // Requires IS1108 (Missing) OR CS1101S (Valid)
                const tree = { or: ["IS1108", "CS1101S"] };
                const result = trimPrereqTree(tree, boardMap, 20);

                // Should collapse the tree to just show the valid module
                expect(result.status).toBe("VALID");
                expect(result.tree).toBe("CS1101S");
            });

            it("should return MISSING if all OR options are completely missing", () => {
                const tree = { or: ["IS1108", "MISSING_MOD"] };
                const result = trimPrereqTree(tree, boardMap, 20);

                expect(result.status).toBe("MISSING");
                expect(result.hasMissing).toBe(true);
            });
        });

        // AND Tests
        describe("AND logic", () => {
            it("should return VALID if all AND children are valid", () => {
                const tree = { and: ["CS1101S"] };
                const result = trimPrereqTree(tree, boardMap, 20);
                expect(result.status).toBe("VALID");
            });

            it("should return MISPLACED if at least one AND child is misplaced and none are missing", () => {
                const tree = { and: ["CS1101S", "ST2334"] };
                const result = trimPrereqTree(tree, boardMap, 20);
                expect(result.status).toBe("MISPLACED");
                expect(result.hasMisplaced).toBe(true);
            });

            it("should return MISSING if any AND child is completely missing", () => {
                const tree = { and: ["CS1101S", "MISSING_MOD"] };
                const result = trimPrereqTree(tree, boardMap, 20);
                expect(result.status).toBe("MISSING");
            });
        });

        // Wildcard Tests
        describe("Wildcard logic", () => {
            it("should evaluate wildcards properly on the board", () => {
                // CS1% requires a CS1000 level module. CS1101S is on the board at time 10.
                const result = trimPrereqTree("CS1%", boardMap, 20);
                expect(result.status).toBe("VALID");
            });
        });

        describe("nOf logic", () => {
            // Tests below use Target Module being placed at Time: 20
            const boardMap = {
                MOD_A: { time: 10, semKey: "Y1S1" }, // Valid
                MOD_B: { time: 25, semKey: "Y2S2" }, // Misplaced
            };

            it("should return VALID if enough choices are valid", () => {
                const tree: PrereqTree = { nOf: [1, ["MOD_A", "MOD_C"]] };
                const result = trimPrereqTree(tree, boardMap, 20);
                expect(result.status).toBe("VALID");
            });

            it("should return MISPLACED if valid + misplaced meets the count", () => {
                const tree: PrereqTree = { nOf: [2, ["MOD_A", "MOD_B", "MOD_C"]] };
                const result = trimPrereqTree(tree, boardMap, 20);
                expect(result.status).toBe("MISPLACED");
            });

            it("should return MISSING if valid + misplaced is less than required count", () => {
                const tree: PrereqTree = { nOf: [3, ["MOD_A", "MOD_B", "MOD_C"]] };
                const result = trimPrereqTree(tree, boardMap, 20);
                expect(result.status).toBe("MISSING");
            });

            it("should handle wildcards inside nOf", () => {
                const tree: PrereqTree = { nOf: [1, ["MOD_%"]] };
                const result = trimPrereqTree(tree, boardMap, 20);
                expect(result.status).toBe("VALID"); // MOD_A satisfies this validly
            });
        });

        describe("Fallback", () => {
            it("should return a MISSING result for an unknown node type", () => {
                // @ts-expect-error - Testing runtime fallback for bad data
                const result = trimPrereqTree({ unknown_key: "value" }, boardMap, 20);

                expect(result.status).toBe("MISSING");
                expect(result.tree).toBeNull();
            });
        });
    });
});
