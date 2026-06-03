import type { DisplayLesson, NUSModsRawLesson } from "@/types";
import { buildDisplayLesson } from "@/utils/timetableUtils/lessonFormatters";
import { doLessonsSchedulesClash } from "@/utils/timetableUtils/lessonClashDetection";

export function findBestFit(
    moduleCode: string,
    newSlots: NUSModsRawLesson[],
    currentTimetable: DisplayLesson[]
): DisplayLesson[] {
    // Format Raw Data into DisplayLessons
    const formattedNewSlots: DisplayLesson[] = newSlots.map((slot, index) =>
        buildDisplayLesson(moduleCode, slot, `auto-${index}`, false)
    );

    // Group by lessonType, then by classNo
    const groupedByType: Record<string, Record<string, DisplayLesson[]>> = {};

    formattedNewSlots.forEach((slot) => {
        if (!groupedByType[slot.lessonType]) groupedByType[slot.lessonType] = {};
        if (!groupedByType[slot.lessonType][slot.classNo])
            groupedByType[slot.lessonType][slot.classNo] = [];

        groupedByType[slot.lessonType][slot.classNo].push(slot);
    });

    const lessonTypes = Object.keys(groupedByType);

    let bestConfig: DisplayLesson[] = [];
    let minClashes = Infinity;

    //DFS with Backtracking and pruning
    function backtrack(typeIndex: number, currentConfig: DisplayLesson[], currentClashes: number) {
        if (currentClashes >= minClashes) return;

        // We successfully picked a classNo for every required lessonType
        if (typeIndex === lessonTypes.length) {
            minClashes = currentClashes;
            bestConfig = [...currentConfig];
            return;
        }

        const type = lessonTypes[typeIndex];
        const classOptions = Object.values(groupedByType[type]); // Array of slot groupings

        for (const optionSlots of classOptions) {
            let newClashes = 0;

            // Check how many clashes this specific classNo option causes
            for (const slot of optionSlots) {
                // Check against the user's existing timetable
                for (const existing of currentTimetable) {
                    if (doLessonsSchedulesClash(slot, existing)) newClashes++;
                }

                // Check against the classes we just picked in this DFS path
                for (const configSlot of currentConfig) {
                    if (doLessonsSchedulesClash(slot, configSlot)) newClashes++;
                }
            }

            const totalClashes = currentClashes + newClashes;
            if (totalClashes >= minClashes) continue;

            currentConfig.push(...optionSlots);
            backtrack(typeIndex + 1, currentConfig, totalClashes);

            // Backtrack: Remove the slots we just added so we can try the next option
            for (let i = 0; i < optionSlots.length; i++) {
                currentConfig.pop();
            }

            // If we found a perfect 0-clash schedule, completely stop searching
            if (minClashes === 0 && typeIndex === 0) return;
        }
    }

    backtrack(0, [], 0);
    return bestConfig;
}
