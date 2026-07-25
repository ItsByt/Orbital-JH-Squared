import { describe, it, expect } from "vitest";
import { getConnector, getBoxColor, connectorStyle } from "../lines&Box";

describe("UI Helpers", () => {
    describe("getConnector", () => {
        it.each([
            { index: 0, length: 1, expected: "", scenario: "single item list" },
            { index: 0, length: 0, expected: "", scenario: "empty list" },
            {
                index: 0,
                length: 3,
                expected: "left-1/2 right-0",
                scenario: "first item in multi-list",
            },
            {
                index: 2,
                length: 3,
                expected: "left-0 right-1/2",
                scenario: "last item in multi-list",
            },
            {
                index: 1,
                length: 3,
                expected: "left-0 right-0",
                scenario: "middle item in multi-list",
            },
        ])(
            "should return '$expected' for $scenario (index $index, length $length)",
            ({ index, length, expected }) => {
                expect(getConnector(index, length)).toBe(expected);
            }
        );
    });

    describe("getBoxColor", () => {
        it("should return the highlighted styling when expanded is true", () => {
            expect(getBoxColor(true)).toBe("bg-[#E8A753] text-black border-[#cf9043]");
        });

        it("should return the default styling when expanded is false", () => {
            expect(getBoxColor(false)).toBe("bg-[#719E8E] text-white border-[#5d8275]");
        });
    });

    describe("connectorStyle", () => {
        it("should export the correct Tailwind class classes", () => {
            expect(connectorStyle).toBe("bg-zinc-400 dark:bg-zinc-600");
        });
    });
});
