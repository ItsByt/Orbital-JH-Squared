import { describe, it, expect, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { generateFocusMap } from "../focusModeUtils";
import type { PlannerModule } from "@/types";

describe("Focus Mode Utilities (generateFocusMap)", () => {
    let queryClient: QueryClient;

    // Helper to create basic mock modules
    const m = (code: string): PlannerModule => ({ moduleCode: code }) as PlannerModule;

    beforeEach(() => {
        // Create a fresh QueryClient for every test
        queryClient = new QueryClient();

        // Seed the cache with fake Prerequisite Trees
        // CS2040S requires CS1101S.
        // CS2030S requires CS1101S.
        // CS2103T requires CS2040S and CS2030S.
        queryClient.setQueryData(["prereq", "CS1101S"], null); // No prereqs
        queryClient.setQueryData(["prereq", "CS2040S"], "CS1101S");
        queryClient.setQueryData(["prereq", "CS2030S"], "CS1101S");
        queryClient.setQueryData(["prereq", "CS2103T"], { and: ["CS2030S", "CS2040S"] });

        // Wildcard test case: CS6769 requires any CS2000 level
        queryClient.setQueryData(["prereq", "CS6769"], "CS2%");
    });

    it("should return an empty map if no module is focused", () => {
        const result = generateFocusMap(null, {}, queryClient);
        expect(result).toEqual({});
    });

    it("should map the focused module itself", () => {
        const board = { Y1S1: [m("CS1101S")] };
        const result = generateFocusMap("CS1101S", board, queryClient);

        expect(result["CS1101S"]).toEqual({ state: "focus", distance: 0 });
    });

    it("should correctly identify and calculate distance for Pre-requisites", () => {
        const board = {
            Y1S1: [m("CS1101S")],
            Y1S2: [m("CS2040S"), m("CS2030S")],
            Y2S1: [m("CS2103T")],
        };

        // If we focus on CS2103T, it should trace backwards.
        const result = generateFocusMap("CS2103T", board, queryClient);

        expect(result["CS2103T"]).toEqual({ state: "focus", distance: 0 });

        // Immediate prereqs (Dist 1)
        expect(result["CS2040S"]).toEqual({ state: "prereq", distance: 1 });
        expect(result["CS2030S"]).toEqual({ state: "prereq", distance: 1 });

        // Nested prereqs (Dist 2)
        expect(result["CS1101S"]).toEqual({ state: "prereq", distance: 2 });
    });

    it("should correctly identify and calculate distance for Post-requisites", () => {
        const board = {
            Y1S1: [m("CS1101S")],
            Y1S2: [m("CS2040S"), m("CS2030S")],
            Y2S1: [m("CS2103T")],
        };

        // If we focus on CS1101S, it should trace forwards.
        const result = generateFocusMap("CS1101S", board, queryClient);

        expect(result["CS1101S"]).toEqual({ state: "focus", distance: 0 });

        // Immediate postreqs (Dist 1)
        expect(result["CS2040S"]).toEqual({ state: "postreq", distance: 1 });
        expect(result["CS2030S"]).toEqual({ state: "postreq", distance: 1 });

        // Nested postreqs (Dist 2)
        expect(result["CS2103T"]).toEqual({ state: "postreq", distance: 2 });
    });

    it("should correctly handle wildcard requirements for Pre-requisites", () => {
        const board = {
            Y1: [m("CS2030S")], // Matches "CS2%"
            Y2: [m("CS6769")], // Requires "CS2%"
        };

        const result = generateFocusMap("CS6769", board, queryClient);

        // It should realize CS2030S satisfies the CS2% wildcard prereq
        expect(result["CS2030S"]).toEqual({ state: "prereq", distance: 1 });
    });

    it("should correctly handle wildcard requirements for Post-requisites", () => {
        const board = {
            Y1: [m("CS2030S")],
            Y2: [m("CS6769")], // Requires "CS2%"
        };

        const result = generateFocusMap("CS2030S", board, queryClient);

        // It should realize CS6769 requires CS2030S because of the CS2% wildcard postreq
        expect(result["CS6769"]).toEqual({ state: "postreq", distance: 1 });
    });
});
