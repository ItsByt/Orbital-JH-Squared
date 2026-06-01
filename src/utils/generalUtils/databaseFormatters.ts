import type { DisplayLesson } from "@/types";

// Formatting for Timetable Database
export function formatForTimetableDatabase(
    slots: DisplayLesson[],
    userId: string,
    year: number,
    semester: number,
    moduleCode?: string
) {
    return slots.map((slot) => ({
        user_id: userId,
        module_code: moduleCode || slot.moduleCode,
        lesson_type: slot.lessonType,
        class_no: slot.classNo,
        year: year,
        semester: semester,
        day: slot.day,
        start_time: slot.startTime,
        end_time: slot.endTime,
        venue: slot.venue,
        weeks: slot.weeks ? JSON.stringify(slot.weeks) : null,
    }));
}
