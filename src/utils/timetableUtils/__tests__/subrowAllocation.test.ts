import { describe, it, expect } from "vitest";
import { calculateDayLayout } from "../subrowAllocation";
import type { DisplayLesson } from "@/types";

function lesson(
    id: string,
    start: string,
    end: string
): DisplayLesson {
    const toMinutes = (time: string) => {
        const h = Number(time.slice(0, 2));
        const m = Number(time.slice(2));
        return h * 60 + m;
    };

    return {
        id,
        moduleCode: "CS2040S",
        lessonType: "LEC",
        classNo: "1",
        day: "Monday",
        startTime: start,
        endTime: end,
        startMins: toMinutes(start),
        endMins: toMinutes(end),
        venue: "LT1",
        weeks: [1],
        weekBitmask: 0b1,
    };
}

describe("calculateDayLayout", () => {
    it("returns one row for an empty day", () => {
        const result = calculateDayLayout([]);

        expect(result.totalRowsForDay).toBe(1);
        expect(result.lessonRowMap.size).toBe(0);
    });

    it("places non-overlapping lessons in the same row", () => {
        const lessons = [
            lesson("A", "0900", "1000"),
            lesson("B", "1000", "1100"),
            lesson("C", "1100", "1200"),
        ];

        const result = calculateDayLayout(lessons);

        expect(result.totalRowsForDay).toBe(1);
        expect(result.lessonRowMap.get("A")).toBe(0);
        expect(result.lessonRowMap.get("B")).toBe(0);
        expect(result.lessonRowMap.get("C")).toBe(0);
    });

    it("places overlapping lessons into different rows", () => {
        const lessons = [
            lesson("A", "0900", "1100"),
            lesson("B", "1000", "1200"),
        ];

        const result = calculateDayLayout(lessons);

        expect(result.totalRowsForDay).toBe(2);
        expect(result.lessonRowMap.get("A")).toBe(0);
        expect(result.lessonRowMap.get("B")).toBe(1);
    });

    it("sorts lessons before laying them out", () => {
        const lessons = [
            lesson("B", "1100", "1200"),
            lesson("A", "0900", "1000"),
            lesson("C", "1000", "1100"),
        ];

        const result = calculateDayLayout(lessons);

        expect(result.totalRowsForDay).toBe(1);
        expect(result.lessonRowMap.get("A")).toBe(0);
        expect(result.lessonRowMap.get("B")).toBe(0);
        expect(result.lessonRowMap.get("C")).toBe(0);
    });

    it("reuses rows when possible", () => {
        const lessons = [
            lesson("A", "0900", "1100"),
            lesson("B", "1000", "1200"),
            lesson("C", "1100", "1300"),
        ];

        const result = calculateDayLayout(lessons);

        expect(result.totalRowsForDay).toBe(2);

        // A and C should share a row
        expect(result.lessonRowMap.get("A")).toBe(0);
        expect(result.lessonRowMap.get("B")).toBe(1);
        expect(result.lessonRowMap.get("C")).toBe(0);
    });

    it("handles several overlapping lessons", () => {
        const lessons = [
            lesson("A", "0900", "1200"),
            lesson("B", "0930", "1230"),
            lesson("C", "1000", "1300"),
        ];

        const result = calculateDayLayout(lessons);

        expect(result.totalRowsForDay).toBe(3);

        expect(result.lessonRowMap.get("A")).toBe(0);
        expect(result.lessonRowMap.get("B")).toBe(1);
        expect(result.lessonRowMap.get("C")).toBe(2);
    });
});