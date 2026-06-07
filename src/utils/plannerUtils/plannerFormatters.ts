import { TOTAL_PLANNER_YEARS } from "@/config/constants";
import type { ModuleDetails, PlannerModule, SavedPlannerRow } from "@/types";

// Formats NUSMods API information into PlannerModule
export function buildPlannerModule(details: ModuleDetails): PlannerModule {
    return {
        moduleCode: details.moduleCode,
        title: details.title,
        moduleCredit: Number(details.moduleCredit) || 0,
    };
}

// Formats PlannerModule information to be stored in Supabase
export function formatForPlannerDatabase(
    userId: string,
    moduleCode: string,
    title: string,
    moduleCredit: number,
    year: number,
    semester: number,
    displayOrder: number
) {
    return {
        user_id: userId,
        module_code: moduleCode,
        title: title,
        module_credit: moduleCredit,
        year: year,
        semester: semester,
        display_order: displayOrder,
    };
}

// Formats Supabase data into PlannerModules
export function formatSavedPlannerModules(savedRows: SavedPlannerRow[]): PlannerModule[] {
    return savedRows.map((row) => ({
        moduleCode: row.module_code,
        title: row.title,
        moduleCredit: row.module_credit,
    }));
}

// Formats an Empty Planner Data Board
export function generateEmptyBoard(): Record<string, PlannerModule[]> {
    const board: Record<string, PlannerModule[]> = {};
    for (let year = 1; year <= TOTAL_PLANNER_YEARS; year++) {
        board[`Y${year}S1`] = [];
        board[`Y${year}S2`] = [];
    }

    return board;
}

// Formats Supabase data into the Data Board for the planner to use directly
export function formatPlannerBoard(savedRows: SavedPlannerRow[]): Record<string, PlannerModule[]> {
    const board = generateEmptyBoard();
    savedRows.forEach((row) => {
        const key = `Y${row.year}S${row.semester}`;
        if (board[key]) {
            board[key].push({
                moduleCode: row.module_code,
                title: row.title,
                moduleCredit: row.module_credit,
            });
        }
    });

    return board;
}
