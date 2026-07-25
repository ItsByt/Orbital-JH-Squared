import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTimetableView } from "@/hooks/TimetableHooks/useTimetableView";
import type { DisplayLesson } from "@/types";

const createLesson = (overrides: Partial<DisplayLesson> = {}): DisplayLesson => ({
    id: "1",
    moduleCode: "CS1010",
    lessonType: "LEC",
    classNo: "1",
    day: "Monday",
    startTime: "1000",
    endTime: "1200",
    venue: "LT1",
    weeks: [1, 2],
    startMins: 600,
    endMins: 720,
    weekBitmask: 3,
    ...overrides,
});

describe("useTimetableView", () => {
    it("returns empty structures when given no lessons", () => {
        const { result } = renderHook(() => useTimetableView([], []));

        expect(result.current.lessonsByDay).toEqual({
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: [],
        });

        expect(result.current.uniqueActiveModules).toEqual([]);
        expect(result.current.customNameCounts).toEqual({});
    });

    it("groups modules correctly by day", () => {
        const mondayLesson = createLesson({
            day: "Monday",
        });

        const fridayLesson = createLesson({
            id: "2",
            day: "Friday",
        });

        const { result } = renderHook(() => useTimetableView([mondayLesson, fridayLesson], []));

        expect(result.current.lessonsByDay.Monday).toEqual([mondayLesson]);

        expect(result.current.lessonsByDay.Friday).toEqual([fridayLesson]);
    });

    it("ignores lessons with unsupported days", () => {
        const weekendLesson = createLesson({
            day: "Saturday",
        });

        const { result } = renderHook(() => useTimetableView([weekendLesson], []));

        expect(result.current.lessonsByDay.Monday).toEqual([]);
        expect(result.current.lessonsByDay.Friday).toEqual([]);
    });

    it("adds alternatives when they do not already exist", () => {
        const alternative = createLesson({
            id: "alt-1",
            classNo: "2",
            day: "Tuesday",
        });

        const { result } = renderHook(() => useTimetableView([], [alternative]));

        expect(result.current.lessonsByDay.Tuesday).toHaveLength(1);

        expect(result.current.lessonsByDay.Tuesday[0]).toEqual({
            ...alternative,
            isAlternative: true,
            weekBitmask: alternative.weekBitmask,
        });
    });

    it("does not add alternatives that match an existing lesson", () => {
        const moduleLesson = createLesson({
            classNo: "1",
            day: "Monday",
            startTime: "1000",
        });

        const alternative = createLesson({
            id: "alt-1",
            classNo: "1",
            day: "Monday",
            startTime: "1000",
        });

        const { result } = renderHook(() => useTimetableView([moduleLesson], [alternative]));

        expect(result.current.lessonsByDay.Monday).toHaveLength(1);
        expect(result.current.lessonsByDay.Monday[0].isAlternative).toBeUndefined();
    });

    it("keeps alternative lessons with different classes", () => {
        const moduleLesson = createLesson({
            classNo: "1",
        });

        const alternative = createLesson({
            id: "alt-1",
            classNo: "2",
            day: "Monday",
        });

        const { result } = renderHook(() => useTimetableView([moduleLesson], [alternative]));

        expect(result.current.lessonsByDay.Monday).toHaveLength(2);

        expect(result.current.lessonsByDay.Monday[1].isAlternative).toBe(true);
    });

    it("deduplicates active academic modules by module code", () => {
        const lec = createLesson({
            moduleCode: "CS1010",
            lessonType: "LEC",
        });

        const tut = createLesson({
            id: "2",
            moduleCode: "CS1010",
            lessonType: "TUT",
        });

        const math = createLesson({
            id: "3",
            moduleCode: "MA1521",
        });

        const { result } = renderHook(() => useTimetableView([lec, tut, math], []));

        expect(result.current.uniqueActiveModules).toEqual([lec, math]);
    });

    it("keeps all personal blocks even with duplicate names", () => {
        const blockOne = createLesson({
            id: "1",
            moduleCode: "Gym",
            lessonType: "Personal Block",
        });

        const blockTwo = createLesson({
            id: "2",
            moduleCode: "Gym",
            lessonType: "Personal Block",
        });

        const { result } = renderHook(() => useTimetableView([blockOne, blockTwo], []));

        expect(result.current.uniqueActiveModules).toHaveLength(2);
    });

    it("counts personal block names case-insensitively", () => {
        const gymOne = createLesson({
            id: "1",
            moduleCode: "Gym",
            lessonType: "Personal Block",
        });

        const gymTwo = createLesson({
            id: "2",
            moduleCode: "GYM",
            lessonType: "Personal Block",
        });

        const study = createLesson({
            id: "3",
            moduleCode: "Study",
            lessonType: "Personal Block",
        });

        const { result } = renderHook(() => useTimetableView([gymOne, gymTwo, study], []));

        expect(result.current.customNameCounts).toEqual({
            GYM: 2,
            STUDY: 1,
        });
    });

    it("ignores null-like values defensively", () => {
        const { result } = renderHook(() => useTimetableView([], []));

        expect(result.current.uniqueActiveModules).toEqual([]);
    });
});
