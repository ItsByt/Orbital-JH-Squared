import { describe, it, expect } from "vitest";
import { doLessonsSchedulesClash } from "@/utils/timetableUtils/lessonClashDetection";
import type { DisplayLesson } from "@/types";

const baseLesson: DisplayLesson = {
    id: "1",
    moduleCode: "CS2040S",
    lessonType: "LEC",
    classNo: "1",
    day: "Monday",
    startTime: "1000",
    endTime: "1200",
    venue: "LT1",
    startMins: 600,
    endMins: 720,
    weekBitmask: 1,
    isAlternative: false,
    weeks: [1],
};

describe("Lesson Clash Detection", () => {
    it("should return false for different days", () => {
        const other = { ...baseLesson, day: "Tuesday" };
        expect(doLessonsSchedulesClash(baseLesson, other)).toBe(false);
    });

    it("should return false if weeks do not overlap (bitmask)", () => {
        const other = { ...baseLesson, weekBitmask: 2 }; // Bitmask 2 = Week 2, Base = Week 1
        expect(doLessonsSchedulesClash(baseLesson, other)).toBe(false);
    });

    it("should detect schedule clash for overlapping times on same day and same week", () => {
        const other = {
            ...baseLesson,
            startTime: "1100",
            endTime: "1300",
            startMins: 660,
            endMins: 780,
        };
        expect(doLessonsSchedulesClash(baseLesson, other)).toBe(true);
    });

    it("should ignore custom flag", () => {
        const custom = { ...baseLesson, classNo: "CUSTOM_IGNORE_FLAG" };
        expect(doLessonsSchedulesClash(baseLesson, custom)).toBe(false);
    });
});
