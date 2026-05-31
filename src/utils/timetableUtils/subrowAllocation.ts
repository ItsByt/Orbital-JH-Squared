import type { DisplayLesson } from "@/types";
import { doLessonsVisuallyClash } from "@/utils/timetableUtils/lessonClashDetection";

export function calculateDayLayout(lessons: DisplayLesson[]) {

    // 1. Sort lessons by start time
    const sortedLessons = [...lessons].sort((a, b) =>
        parseInt(a.startTime, 10) - parseInt(b.startTime, 10)
    );

    // tracks is a 2D array 
    // Mon[[L1, L2, L3][L4]]  for e.g. mapped day = Monday
    // Every inner array represents a new subrow should there be overlap 
    // Hashmap to remember which subrow it exists in 
    const tracks: DisplayLesson[][] = [];
    const lessonRowMap = new Map<string, number>();

    // Loop through every sorted lesson to place into that day
    // placed = true means successfully place into row 
    sortedLessons.forEach((lesson) => {
        let placed = false;

        // iterate each subrow and retrieve last lesson added 
        // since sorted will guarantee curr lesson to add is always later)
        for (let i = 0; i < tracks.length; i++) {
            const currentTrack = tracks[i];

            // Compare if two lessons visually clash  
            // If share the row no overlap, push into existing inner array, 
            // terminate iter of other subrows to consider
            const hasClash: boolean = currentTrack.some(trackLesson => doLessonsVisuallyClash(trackLesson, lesson));

            if (!hasClash) {
                currentTrack.push(lesson);
                lessonRowMap.set(lesson.id, i);
                placed = true;
                break;
            }
        }

        // after looping all subrows if still unable to fit any existing subrow, 
        // push new subrow containing lesson
        if (!placed) {
            tracks.push([lesson]);
            lessonRowMap.set(lesson.id, tracks.length - 1);
        }
    });

    // return total number of subrows and the mapping
    return {
        totalRowsForDay: Math.max(tracks.length, 1),
        lessonRowMap
    };
}