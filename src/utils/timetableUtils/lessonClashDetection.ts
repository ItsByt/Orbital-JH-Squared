import type { DisplayLesson } from "@/types";

export function calculateWeekBitmask(weeks: Array<number | string>): number {
    if (!Array.isArray(weeks)) return 0;
    return weeks.reduce<number>((mask, week) => {
        const weekNum = typeof week == "number" ? week : parseInt(week, 10);
        return mask | (1 << weekNum);
    }, 0);
}

export function doLessonsSchedulesClash(l1: DisplayLesson, l2: DisplayLesson): boolean {
    if (l1.day !== l2.day) return false;

    if ((l1.weekBitmask & l2.weekBitmask) === 0) return false;

    return (l1.endMins > l2.startMins) && (l1.startMins < l2.endMins);
}

export function doLessonsVisuallyClash(l1: DisplayLesson, l2: DisplayLesson): boolean {
    if (l1.day !== l2.day) return false;

    return (l1.endMins > l2.startMins) && (l1.startMins < l2.endMins);
}