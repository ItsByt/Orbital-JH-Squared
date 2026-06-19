import { TIMETABLE_START_HOUR } from "@/config/constants";

export function timeToMins(timeString: string): number {
    if (!timeString) return 0;
    const hours = parseInt(timeString.substring(0, 2), 10);
    const minutes = parseInt(timeString.substring(2, 4), 10);
    return hours * 60 + minutes;
}

export const convertTimeToColumn = (timeString: string): number => {
    const hour = parseInt(timeString.substring(0, 2), 10);
    const minutes = parseInt(timeString.substring(2, 4), 10);

    // Offset from the start hour
    const hourDiff = hour - TIMETABLE_START_HOUR;

    // Each hour has 2 columns. If minutes >= 30, add 1 extra column.
    const minuteOffset = minutes >= 30 ? 1 : 0;

    return hourDiff * 2 + minuteOffset;
};
