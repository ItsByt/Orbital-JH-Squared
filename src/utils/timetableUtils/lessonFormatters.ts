import type { SavedTimetableModule, DisplayLesson, NUSModsRawLesson } from "@/types";
import { timeToMins } from "@/utils/timetableUtils/timeFormat";
import { weeksToBitmask } from "./weekFormat";

// Formats data coming from Supabase
export function formatSavedModules(savedList: SavedTimetableModule[]): DisplayLesson[] {
    return savedList.map((saved) => {
        let parsedWeeks: number[] = [];
        if (saved.weeks) {
            try {
                parsedWeeks = JSON.parse(saved.weeks);
            } catch {
                parsedWeeks = [];
            }
        }
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
            weekBitmask: weeksToBitmask(parsedWeeks),
            isAlternative: false,
        };
    });
}

// Formats data for UI viewing
export function buildDisplayLesson(
    moduleCode: string,
    slot: NUSModsRawLesson,
    id: string,
    isAlternative: boolean
): DisplayLesson {
    const rawWeeks = slot.weeks ?? [];
    const weekBitmask = weeksToBitmask(rawWeeks);

    return {
        id,
        moduleCode,
        lessonType: slot.lessonType,
        classNo: slot.classNo,
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        venue: slot.venue,
        startMins: timeToMins(slot.startTime),
        endMins: timeToMins(slot.endTime),
        isAlternative,
        weeks: rawWeeks,
        weekBitmask,
    };
}

// Formats alternative lessons from NUSMods API into DisplayLessons
export function formatAlternativeLessons(
    rawTimetable: NUSModsRawLesson[],
    currentLesson: DisplayLesson
): DisplayLesson[] {
    // Filter out lessons that don't match the type, or are the exact same class
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
