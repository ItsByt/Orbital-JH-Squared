// Basic Summary of each NUS Module
export interface ModuleSummary {
    moduleCode: string;
    title: string;
    semesters: number[];
}

// All Details for a Searched NUS Module
export interface ModuleDetails {
    moduleCode: string;
    title: string;
    moduleCredit: string;
    description?: string;
    semesterData: {
        semester: number;
        timetable: NUSModsRawLesson[];
    }[];
    prereqTree?: PrereqTree; // Modules with no pre-requisites default to undefined or null
    prerequisite?: string;
}

// Details about just a lesson itself
export interface NUSModsRawLesson {
    classNo: string;
    lessonType: string;
    startTime: string;
    endTime: string;
    day: string;
    venue: string;
    weeks: number[];
}

// Details for Saved Timetable Modules
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

// Details for class BLOCKS
export interface DisplayLesson {
    id: string;
    moduleCode: string;
    lessonType: string;
    classNo: string;
    day: string;
    startTime: string;
    endTime: string;
    venue: string;
    weeks: number[];
    isAlternative?: boolean;
    startMins: number;
    endMins: number;
    // We store each week using a corresponding bit (0 or 1),
    // where the ith week corresponds to the (i + 1)th bit from the right
    // So the number 101010 means the lesson is on weeks 1, 3 and 5
    // Yes this means that the rightmost bit represents week 0 (but it is always defaulted to 0)
    weekBitmask: number;
}

//Details for modules added to the Planner
export interface PlannerModule {
    moduleCode: string;
    title: string;
    moduleCredit: number;
    displayOrder: number;
    availableSemesters: number[];
    isExemption: boolean;
    excludeFromTotal: boolean;
    hidePreReqWarning?: boolean;
}

//Details for Planner modules stored in supabase
export interface SavedPlannerRow {
    id: string;
    user_id: string;
    created_at: string;
    year: number;
    semester: number;
    module_code: string;
    title: string;
    module_credit: number;
    display_order: number;
    available_semesters: number[];
    exclude_from_total: boolean;
    hide_pre_req_warning?: boolean;
}

// Details for Pre-requisite Tree
// Either a string, an object with key of "and"/"or", value of array of PrereqTree,
// or key of "nOf" and value [number of modules needed, specific type of module needed]
export type PrereqTree =
    string | { and: PrereqTree[] } | { or: PrereqTree[] } | { nOf: [number, PrereqTree[]] };

// Formatted Pre-Req Tree Node
export interface FormattedPreReqNode {
    type: "leaf" | "prefix-branch" | "branch"; // possible representations
    moduleCode?: string; // e.g., "NM4102" if leaf OR
    prefixLabel?: string; // e.g. "Courses beginning with ..NM1" if prefix-branch
    and?: FormattedPreReqNode[]; // "and" recursive branch
    or?: FormattedPreReqNode[]; // "or" recursive branch
    allPossibleMatches?: string[]; // all possible matches satisfying if prefix
    label?: string; // e.g. "at least 7 of" rule
}
