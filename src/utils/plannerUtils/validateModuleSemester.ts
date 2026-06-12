import type { ModuleDetails, PlannerModule } from "@/types";

export function checkValidSemesterUsingModuleDetails(module: ModuleDetails, semester: number) {
    if (!module) return false;

    return module.semesterData.some((s) => s.semester === semester);
}

export function checkValidSemesterUsingPlannerModule(
    module: PlannerModule | undefined,
    semester: number
) {
    if (!module) return false;

    return module.availableSemesters.includes(semester);
}
