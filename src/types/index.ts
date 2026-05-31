//Basic Summary of each NUS Module
export interface ModuleSummary {
    moduleCode: string;
    title: string;
    semesters: number[];
}

//All Details for a Searched NUS Module
export interface ModuleDetails {
    moduleCode: string;
    title: string;
    moduleCredit: string;
    description?: string;
    semesterData: {
        semester: number;
        timetable: NUSModsRawLesson[];
    }[];
}

//Details about just a lesson itself
export interface NUSModsRawLesson {
    classNo: string;
    lessonType: string;
    startTime: string;
    endTime: string;
    day: string;
    venue: string;
    weeks: number[] | string[];
}

//Details for Saved Timetable Modules
export interface SavedTimetableModule {
    id: string;
    user_id: string;
    module_code: string;
    lesson_type: string;
    class_no: string;
    year: number;
    semester: number;
    day: string;
    start_time: string;
    end_time: string;
    venue: string;
    weeks: string | null;
}

//Details for class BLOCKS
export interface DisplayLesson {
    id: string;
    moduleCode: string;
    lessonType: string;
    classNo: string;
    day: string;
    startTime: string;
    endTime: string;
    venue: string;
    weeks?: number[] | string[];
    isAlternative?: boolean;
    startMins: number;
    endMins: number;

    // We store each week using a corresponding bit (0 or 1),
    // where the ith week corresponds to the (i + 1)th bit from the right
    // So the number 101010 means the lesson is on weeks 1, 3 and 5
    // Yes this means that the rightmost bit is always technically useless (it is always 0)
    weekBitmask: number;
}
