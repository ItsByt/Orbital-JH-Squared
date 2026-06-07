import type { ModuleDetails } from "@/types";
import { getModule } from "@/services/nusmods";

export async function checkValidSemesterUsingModuleCode(moduleCode: string, semester: number) {
    const moduleDetails = await getModule(moduleCode);
    if (!moduleDetails) return false;

    return checkValidSemesterUsingModuleDetails(moduleDetails, semester);
}

export function checkValidSemesterUsingModuleDetails(moduleDetails: ModuleDetails, semester: number) {
    const semData = moduleDetails.semesterData?.find((s) => s.semester === semester);
    if (semData) {
        return true;
    } else {
        return false;
    }
}