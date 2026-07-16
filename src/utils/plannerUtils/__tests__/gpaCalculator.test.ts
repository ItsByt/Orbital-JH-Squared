import { describe, it, expect } from "vitest";
import { calculateStatistics } from "../gpaCalculator";
import type { PlannerModule } from "@/types";

// Factory function to create mock modules easily.
const createMockModule = (overrides: Partial<PlannerModule>): PlannerModule => ({
    moduleCode: "MOCK1000",
    title: "Mock Module",
    moduleCredit: 4,
    displayOrder: 0,
    availableSemesters: [1, 2],
    isExemption: false,
    excludeFromTotal: false,
    hidePreReqWarning: false,
    isCustom: false,
    grade: undefined,
    ...overrides,
});

describe("GPA Calculator (calculateStatistics)", () => {
    describe("Standard GPA & Unit Calculation", () => {
        it("should return null GPA and 0 units for an empty planner", () => {
            const stats = calculateStatistics([]);
            expect(stats.gpa).toBeNull();
            expect(stats.totalCompletedUnits).toBe(0);
            expect(stats.suUsedCount).toBe(0);
        });

        it("should correctly calculate GPA for standard graded modules", () => {
            const modules = [
                createMockModule({ moduleCredit: 4, grade: "A+" }), // QualityPoints = 5.0 * 4 = 20
                createMockModule({ moduleCredit: 4, grade: "B" }),  // QualityPoints = 3.5 * 4 = 14
            ];
            
            const stats = calculateStatistics(modules);
            
            // Total QualityPoints = 34. Attempted Units = 8. GPA = 34 / 8 = 4.25
            expect(stats.gpa).toBeCloseTo(4.25);
            expect(stats.totalCompletedUnits).toBe(8);
        });

        it("should factor 'F' grades into GPA but NOT grant earned units", () => {
            const modules = [
                createMockModule({ moduleCredit: 4, grade: "A" }), // QualityPoints = 5.0 * 4 = 20
                createMockModule({ moduleCredit: 4, grade: "F" }), // QualityPoints = 0.0 * 4 = 0
            ];
            
            const stats = calculateStatistics(modules);
            
            // QualityPoints = 20. Attempted = 8. GPA = 2.5. Earned Units = 4 (Only the 'A')
            expect(stats.gpa).toBeCloseTo(2.5);
            expect(stats.totalCompletedUnits).toBe(4);
        });
    });

    describe("Pass/Fail, S/U, and Exemption Edge Cases", () => {
        it("should grant units but not affect GPA for 'CS' grades", () => {
            const modules = [
                createMockModule({ moduleCredit: 4, grade: "A" }),
                createMockModule({ moduleCredit: 4, grade: "CS" }),
            ];
            
            const stats = calculateStatistics(modules);
            
            expect(stats.gpa).toBeCloseTo(5.0);
            expect(stats.totalCompletedUnits).toBe(8);
        });

        it("should track S/U usage correctly", () => {
            const modules = [
                createMockModule({ moduleCredit: 4, grade: "S" }),
                createMockModule({ moduleCredit: 4, grade: "U" }),
                createMockModule({ moduleCredit: 4, grade: "CS" }), // Not an SU
            ];
            
            const stats = calculateStatistics(modules);
            
            expect(stats.suUsedCount).toBe(2);
            expect(stats.totalCompletedUnits).toBe(8);
            expect(stats.gpa).toBeNull();
        });

        it("should NOT grant units for ungraded exemptions (e.g., MA1301 prerequisite fulfillment)", () => {
            const modules = [
                createMockModule({ moduleCode: "MA1301", moduleCredit: 4, isExemption: true, grade: undefined }),
            ];
            
            const stats = calculateStatistics(modules);
            
            expect(stats.totalCompletedUnits).toBe(0);
            expect(stats.gpa).toBeNull();
        });

        it("should grant units for exemptions graded (e.g., Poly APCs / CS1010X)", () => {
            const modules = [
                createMockModule({ moduleCode: "APC", moduleCredit: 20, isExemption: true, grade: "CS" }),
                createMockModule({ moduleCode: "CS1010X", moduleCredit: 4, isExemption: true, grade: "D+" }),
            ];
            
            const stats = calculateStatistics(modules);
            
            expect(stats.totalCompletedUnits).toBe(24);
            expect(stats.gpa).toBe(1.5);
        });
    });

    describe("Exclusions", () => {
        it("should completely ignore modules where excludeFromTotal is true", () => {
            const modules = [
                createMockModule({ moduleCredit: 2, grade: "A-" }),
                createMockModule({ moduleCredit: 4, grade: "A+", excludeFromTotal: true }),
            ];
            
            const stats = calculateStatistics(modules);
            
            expect(stats.gpa).toBeCloseTo(4.5);
            expect(stats.totalCompletedUnits).toBe(2);
        });
    });
});
