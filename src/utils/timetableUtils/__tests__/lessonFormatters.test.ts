import { describe, it, expect } from "vitest";
import { buildDisplayLesson } from "@/utils/timetableUtils/lessonFormatters";
import type { NUSModsRawLesson } from "@/types";

describe("Lesson Formatters", () => {
    it("builds a DisplayLesson object correctly", () => {
        const raw: NUSModsRawLesson = {
            classNo: "1",
            lessonType: "LEC",
            startTime: "1000",
            endTime: "1200",
            day: "Monday",
            venue: "LT1",
            weeks: [1],
        };

        const result = buildDisplayLesson("CS2040S", raw, "test-id", false);

        expect(result.moduleCode).toBe("CS2040S");
        expect(result.startMins).toBe(600);
        expect(result.endMins).toBe(720);
        expect(result.weekBitmask).toBe(1);
    });
});
