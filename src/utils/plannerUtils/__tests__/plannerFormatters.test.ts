import { describe, it, expect, vi } from "vitest";
import {
    buildPlannerModule,
    formatToPlannerModule,
    formatForPlannerDatabase,
    buildCustomPlannerModule,
    getNextDisplayOrder,
    formatPlannerBoard,
} from "../plannerFormatters";
import type { ModuleDetails, SavedPlannerRow, PlannerModule } from "@/types";

// Mocking the semesterKeyUtils so we don't depend on its internal logic for these tests
vi.mock("../semesterKeyUtils", () => ({
    isExemptionKey: vi.fn((key) => key === "EXEMPTIONS"),
    isExemptionYearSemValue: vi.fn((year, sem) => year === 0 && sem === 0),
    buildKeyFromDB: vi.fn((year, sem) => `Y${year}S${sem}`),
    EXEMPTION_KEY: "EXEMPTIONS",
    SEMESTER_CODE_MAP: { S1: 1, S2: 2, EXEMPTIONS: 0 },
}));

// Mocking constants
vi.mock("@/config/constants", () => ({
    TOTAL_PLANNER_YEARS: 5,
}));

describe("Planner Formatters Utilities", () => {
    describe("buildPlannerModule", () => {
        it("should format API ModuleDetails into a PlannerModule", () => {
            const apiDetails: ModuleDetails = {
                moduleCode: "CS1101S",
                title: "Programming Methodology",
                moduleCredit: "4",
                semesterData: [
                    { semester: 1, timetable: [] },
                    { semester: 2, timetable: [] },
                ],
            };

            const result = buildPlannerModule(apiDetails, 2, "Y1S1");

            expect(result.moduleCode).toBe("CS1101S");
            expect(result.moduleCredit).toBe(4); // Converted string to number
            expect(result.displayOrder).toBe(2);
            expect(result.availableSemesters).toEqual([1, 2]);
            expect(result.isExemption).toBe(false);
            expect(result.isCustom).toBe(false);
        });
    });

    describe("formatToPlannerModule & formatForPlannerDatabase", () => {
        const mockRow: SavedPlannerRow = {
            id: "uuid-123",
            user_id: "user-123",
            created_at: "2023-01-01",
            year: 1,
            semester: 1,
            module_code: "MA2002",
            title: "Calculus",
            module_credit: 4,
            display_order: 1,
            available_semesters: [1, 2],
            exclude_from_total: false,
            hide_pre_req_warning: false,
            is_custom: false,
            grade: "A",
        };

        it("should format a Supabase row into a PlannerModule", () => {
            const result = formatToPlannerModule(mockRow);
            expect(result.moduleCode).toBe("MA2002");
            expect(result.grade).toBe("A");
            expect(result.displayOrder).toBe(1);
        });

        it("should format a PlannerModule back into a Supabase row payload", () => {
            const plannerMod = formatToPlannerModule(mockRow);
            const dbPayload = formatForPlannerDatabase("user-123", plannerMod, 1, 1);

            expect(dbPayload.user_id).toBe("user-123");
            expect(dbPayload.module_code).toBe("MA2002");
            expect(dbPayload.year).toBe(1);
            expect(dbPayload.grade).toBe("A");
        });

        it("should handle null grades safely in formatToPlannerModule", () => {
            const rowWithNullGrade = {
                ...mockRow, // from your existing test
                grade: null,
            };
            const result = formatToPlannerModule(rowWithNullGrade);
            expect(result.grade).toBeUndefined(); // Should convert null to undefined
        });

        it("should handle undefined grades safely in formatForPlannerDatabase", () => {
            const modWithUndefinedGrade = {
                ...formatToPlannerModule(mockRow),
                grade: undefined,
            };
            const result = formatForPlannerDatabase("user-123", modWithUndefinedGrade, 1, 1);
            expect(result.grade).toBeNull(); // Should convert undefined back to null for DB
        });
    });

    describe("buildCustomPlannerModule", () => {
        it("should create a custom module with upper-cased code and hidden warnings", () => {
            const result = buildCustomPlannerModule(" mymod1 ", "My Custom Module", 4, 3, "Y1S1");
            expect(result.moduleCode).toBe("MYMOD1");
            expect(result.title).toBe("My Custom Module");
            expect(result.isCustom).toBe(true);
            expect(result.hidePreReqWarning).toBe(true);
            expect(result.availableSemesters).toEqual([]);
        });
    });

    describe("getNextDisplayOrder", () => {
        it("should return 0 for an empty array", () => {
            expect(getNextDisplayOrder([])).toBe(0);
        });

        it("should return the max displayOrder + 1", () => {
            const modules = [
                { displayOrder: 1 } as PlannerModule,
                { displayOrder: 4 } as PlannerModule,
                { displayOrder: 2 } as PlannerModule,
            ];
            expect(getNextDisplayOrder(modules)).toBe(5);
        });
    });

    describe("formatPlannerBoard", () => {
        it("should group modules by their semester key and sort them by displayOrder", () => {
            const rows: SavedPlannerRow[] = [
                { year: 1, semester: 1, module_code: "MOD_B", display_order: 2 } as SavedPlannerRow,
                { year: 1, semester: 1, module_code: "MOD_A", display_order: 1 } as SavedPlannerRow,
                { year: 2, semester: 2, module_code: "MOD_C", display_order: 0 } as SavedPlannerRow,
            ];

            const board = formatPlannerBoard(rows);

            // Should be sorted by displayOrder
            expect(board["Y1S1"][0].moduleCode).toBe("MOD_A");
            expect(board["Y1S1"][1].moduleCode).toBe("MOD_B");

            expect(board["Y2S2"][0].moduleCode).toBe("MOD_C");
        });
    });
});
