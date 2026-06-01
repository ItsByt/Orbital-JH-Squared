import type { SavedTimetableModule, DisplayLesson, NUSModsRawLesson } from "@/types";
import { timeToMins } from "@/utils/timetableUtils/timeFormat";
import { calculateWeekBitmask } from "@/utils/timetableUtils/lessonClashDetection";

// Formats data coming from Supabase
export function formatSavedModules(savedList: SavedTimetableModule[]): DisplayLesson[] {
    return savedList.map((saved) => {
        const parsedWeeks = saved.weeks ? JSON.parse(saved.weeks) : null;
        return {
            id: saved.id,
            moduleCode: saved.module_code,
            lessonType: saved.lesson_type,
            classNo: saved.class_no,
            day: saved.day,
            startTime: saved.start_time,
            endTime: saved.end_time,
            venue: saved.venue,
            weeks: parsedWeeks,
            startMins: timeToMins(saved.start_time),
            endMins: timeToMins(saved.end_time),
            weekBitmask: calculateWeekBitmask(parsedWeeks),
        };
    });
}

export function buildDisplayLesson(
    moduleCode: string,
    slot: NUSModsRawLesson,
    idPrefix: string,
    isAlternative: boolean = false
): DisplayLesson {
    const finalClassNo = slot.classNo || "";

    return {
        id: `${idPrefix}-${moduleCode}-${slot.lessonType}-${finalClassNo}`,
        moduleCode: moduleCode,
        lessonType: slot.lessonType,
        classNo: finalClassNo,
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        venue: slot.venue || "No Venue",
        weeks: slot.weeks,
        isAlternative: isAlternative,
        startMins: timeToMins(slot.startTime),
        endMins: timeToMins(slot.endTime),
        weekBitmask: calculateWeekBitmask(slot.weeks),
    };
}

// Formats alternative lessons from NUSMods API into DisplayLessons
export function formatAlternativeLessons(
    rawTimetable: NUSModsRawLesson[],
    currentLesson: DisplayLesson
): DisplayLesson[] {
    // 1. Filter out lessons that don't match the type, or are the exact same class
    const alternativesFiltered = rawTimetable.filter((slot) => {
        const apiLessonType = (slot.lessonType || "").toUpperCase();
        const currentLessonType = (currentLesson.lessonType || "").toUpperCase();

        // Strip leading zeros (e.g., "01" -> "1")
        const apiClassNo = String(slot.classNo || "").replace(/^0+/, "");
        const currentClassNo = String(currentLesson.classNo || "").replace(/^0+/, "");

        return apiLessonType === currentLessonType && apiClassNo !== currentClassNo;
    });

    // Format the data into DisplayLessons
    return alternativesFiltered.map((alt, index) =>
        buildDisplayLesson(currentLesson.moduleCode, alt, `alt-${index}`, true)
    );
}
