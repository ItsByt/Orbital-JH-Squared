import type { DisplayLesson } from "@/types";

export function doLessonsSchedulesClash(l1: DisplayLesson, l2: DisplayLesson): boolean {
    if (l1.classNo === "CUSTOM_IGNORE_FLAG" || l2.classNo === "CUSTOM_IGNORE_FLAG") {
        return false;
    }
    if (l1.day !== l2.day) return false;

    if ((l1.weekBitmask & l2.weekBitmask) === 0) return false;

    return l1.endMins > l2.startMins && l1.startMins < l2.endMins;
}

export function doLessonsVisuallyClash(l1: DisplayLesson, l2: DisplayLesson): boolean {
    if (l1.day !== l2.day) return false;

    return l1.endMins > l2.startMins && l1.startMins < l2.endMins;
}
