//Basic Summary of each NUS Module 
export interface ModuleSummary {
    moduleCode: string;
    title: string;
    semesters: number[];
}

//All Details for a Searched NUS Module 
export interface ModuleDetails {
    moduleCode: string
    title: string
    moduleCredit: string
    description?: string;
    semesterData: {
        semester: number;
        timetable: {
            classNo: string;
            lessonType: string;
            startTime: string;
            endTime: string;
            day: string;
            venue: string;
            weeks: number[] | string[];
        }[];
    }[];
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
    weeks: number[] | string[];
}