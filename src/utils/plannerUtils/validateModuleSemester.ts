import { isUnvalidatedSemesterCode } from "./semesterKeyUtils";

import type { ModuleDetails, PlannerModule } from "@/types";

export function checkValidSemesterUsingModuleDetails(module: ModuleDetails, semester: number) {
    if (!module) return false;

    if (isUnvalidatedSemesterCode(semester)) return true;

    return module.semesterData.some((s) => s.semester === semester);
}

export function checkValidSemesterUsingPlannerModule(
    module: PlannerModule | undefined,
    semester: number
) {
    if (!module) return false;

    if (module.isCustom) return true;

    if (isUnvalidatedSemesterCode(semester)) return true;

    return module.availableSemesters.includes(semester);
}
