import { describe, it, expect } from "vitest";
import { getModuleBlockStyles } from "../moduleBlockStyles";
import type { PlannerModule } from "@/types";

describe("Module Block Styles Utilities", () => {
    const mockModule: PlannerModule = {
        moduleCode: "CS1101S",
        title: "Programming Methodology",
        moduleCredit: 4,
        displayOrder: 0,
        availableSemesters: [1, 2],
        isExemption: false,
        excludeFromTotal: false,
        hidePreReqWarning: false,
        isCustom: false,
        grade: undefined,
    };

    it("should return default styles when Focus Mode is OFF", () => {
        const style = getModuleBlockStyles(mockModule, false, false);
        expect(style).toContain("bg-[#3070b3]");

        const excludedModule = { ...mockModule, excludeFromTotal: true };
        const excludedStyle = getModuleBlockStyles(excludedModule, false, false);
        expect(excludedStyle).toContain("bg-zinc-700");
    });

    it("should return dimmed clickable styles when Focus Mode is ON but no module is focused", () => {
        const style = getModuleBlockStyles(mockModule, true, false);
        expect(style).toContain("bg-[#3070b3]/80");
        expect(style).toContain("ring-1 ring-white/30");
    });

    it("should return grayscale styles for unrelated modules when a focus is active", () => {
        const style = getModuleBlockStyles(mockModule, true, true, undefined);
        expect(style).toContain("grayscale");
        expect(style).toContain("bg-zinc-800/50");
    });

    it("should highlight the actively focused module", () => {
        const style = getModuleBlockStyles(mockModule, true, true, { state: "focus", distance: 0 });
        expect(style).toContain("bg-blue-600");
        expect(style).toContain("shadow-lg");
    });

    it("should style Pre-requisites based on distance", () => {
        const styleDist1 = getModuleBlockStyles(mockModule, true, true, {
            state: "prereq",
            distance: 1,
        });
        expect(styleDist1).toContain("bg-emerald-600"); // Darkest green for immediate prereq

        const styleDist5 = getModuleBlockStyles(mockModule, true, true, {
            state: "prereq",
            distance: 5,
        });
        expect(styleDist5).toContain("bg-emerald-100/40"); // Lightest green for distant prereq
    });

    it("should style Post-requisites based on distance", () => {
        const styleDist1 = getModuleBlockStyles(mockModule, true, true, {
            state: "postreq",
            distance: 1,
        });
        expect(styleDist1).toContain("bg-rose-600"); // Darkest red for immediate postreq

        const styleDist10 = getModuleBlockStyles(mockModule, true, true, {
            state: "postreq",
            distance: 10,
        });
        expect(styleDist10).toContain("bg-rose-100/40"); // Distances > 5 should cap at index 4 (dist 5 style)
    });

    for (let i = 0; i < 5; i++) {
        it(`should style Pre-requisites distance ${i + 1} with both light and dark variants`, () => {
            const style = getModuleBlockStyles(mockModule, true, true, {
                state: "prereq",
                distance: i + 1,
            });
            expect(style).toContain("bg-emerald");
            expect(style).toContain("dark:bg-emerald");
        });
    }

    for (let i = 0; i < 5; i++) {
        it(`should style Post-requisites distance ${i + 1} with both light and dark variants`, () => {
            const style = getModuleBlockStyles(mockModule, true, true, {
                state: "postreq",
                distance: i + 1,
            });
            expect(style).toContain("bg-rose");
            expect(style).toContain("dark:bg-rose");
        });
    }
});
