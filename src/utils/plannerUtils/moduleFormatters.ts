import type { ModuleDetails, PlannerModule, SavedPlannerRow } from "@/types";

//Formats NUSMods API information into PlannerModule
export function buildPlannerModule(details: ModuleDetails): PlannerModule {
    return {
        moduleCode: details.moduleCode,
        title: details.title,
        moduleCredit: Number(details.moduleCredit) || 0,
    }
}

//Formats Supabase data into PlannerModules
export function formatSavedPlannerModules(savedRows: SavedPlannerRow[]): PlannerModule[] {
    return savedRows.map(row => ({
        moduleCode: row.module_code,
        title: row.module_title,
        moduleCredit: row.module_credit
    }));
}