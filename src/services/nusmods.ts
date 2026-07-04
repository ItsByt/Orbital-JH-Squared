import type { ModuleSummary, ModuleDetails } from "@/types";
import { getAcadYearStringDash } from "@/utils/generalUtils/time";

//Gets a list of all the summaries of all modules in NUS
export async function getModuleList(): Promise<ModuleSummary[]> {
    try {
        const acadYearString = getAcadYearStringDash();
        const response = await fetch(
            `https://api.nusmods.com/v2/${acadYearString}/moduleList.json`
        );

        if (!response.ok) return [];

        return await response.json();
    } catch (error) {
        console.error("Failed to fetch module list", error);
        return [];
    }
}

// Get only one Module's specific details
// Includes Timetable and Pre-Requisite Tree Data
export async function getModule(moduleCode: string): Promise<ModuleDetails | null> {
    try {
        const acadYearString = getAcadYearStringDash();
        const response = await fetch(
            `https://api.nusmods.com/v2/${acadYearString}/modules/${moduleCode.toUpperCase()}.json`
        );

        if (!response.ok) return null;

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch module", error);
        return null;
    }
}

// Gets a list of all modules in NUS, only codes
export async function getModuleCodes(): Promise<string[]> {
    try {
        const data: { moduleCode: string; title: string }[] = await getModuleList();
        return data.map((item) => item.moduleCode);
    } catch (error) {
        console.error("Failed to fetch module list", error);
        return [];
    }
}
