export interface Lesson {
    id: string;
    moduleCode: string;
    day: string;
    startTime: string;
    endTime: string;
    lessonType: string;
    classNo: string;
    venue: string;
    weeks?: string | number[];
    isAlternative?: boolean; 
}

export function calculateDayLayout(lessons: Lesson[]) {

    {/* sort lessons */}
    const sortedLessons = [...lessons].sort((a, b) => 
        parseInt(a.startTime, 10) - parseInt(b.startTime, 10)
    );

    {/* tracks is a 2D array */}
    {/* Mon[[L1, L2, L3][L4]]  for e.g. mapped day = Monday*/}
    {/* Every inner array represents a new subrow should there be overlap */}
    {/* Hashmap to remember which subrow it exists in */}
    const tracks: Lesson[][] = [];
    const lessonRowMap = new Map<string, number>();

    {/* Loop through every sorted lesson to place into that day*/}
    {/* placed = true means successfully place into row */}
    sortedLessons.forEach((lesson) => {
        let placed = false;

        {/* iterate each subrow and retrieve last lesson added 
            (since sorted will guarantee curr lesson to add is always later)*/}
        for (let i = 0; i < tracks.length; i++) {
            const currentTrack = tracks[i];
            const lastLessonInTrack = currentTrack[currentTrack.length - 1];
            
            {/* Compare timings of lesson to add and last lesson added in track for overlap */}  
            {/* If share the row no overlap, push into existing inner array, 
                terminate iter of other subrows to consider*/}
            if (parseInt(lesson.startTime, 10) >= parseInt(lastLessonInTrack.endTime, 10)) {
                currentTrack.push(lesson);
                lessonRowMap.set(lesson.id, i);
                placed = true;
                break;
            }
        }

        {/* after looping all subrows if still unable to fit any existing subrow, 
            push new subrow containing lesson*/}
        if (!placed) {
            tracks.push([lesson]);
            lessonRowMap.set(lesson.id, tracks.length - 1);
        }
    });

    {/* return total number of subrows and the mapping*/}
    return {
        totalRowsForDay: Math.max(tracks.length, 1),
        lessonRowMap
    };
}