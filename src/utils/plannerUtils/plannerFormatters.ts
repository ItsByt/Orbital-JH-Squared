import { TOTAL_PLANNER_YEARS } from "@/config/constants";
import type { ModuleDetails, PlannerModule, SavedPlannerRow } from "@/types";

// Formats NUSMods API information into PlannerModule
export function buildPlannerModule(details: ModuleDetails, displayOrder: number): PlannerModule {
    const availableSemesters = details.semesterData.map((s) => s.semester);

    return {
        moduleCode: details.moduleCode,
        title: details.title,
        moduleCredit: Number(details.moduleCredit) || 0,
        displayOrder: displayOrder,
        availableSemesters: availableSemesters
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
    displayOrder: number,
    availableSemesters: number[]
) {
    return {
        user_id: userId,
        module_code: moduleCode,
        title: title,
        module_credit: moduleCredit,
        year: year,
        semester: semester,
        display_order: displayOrder,
        available_semesters: availableSemesters,
    };
}

// Formats Supabase data into PlannerModules
export function formatSavedPlannerModules(savedRows: SavedPlannerRow[]): PlannerModule[] {
    return savedRows.map((row) => ({
        moduleCode: row.module_code,
        title: row.title,
        moduleCredit: row.module_credit,
        displayOrder: row.display_order,
        availableSemesters: row.available_semesters
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
                displayOrder: row.display_order,
                availableSemesters: row.available_semesters,
            });
        }
    });

    for (const key in board) {
        board[key].sort((a, b) => a.displayOrder - b.displayOrder);
    }

    return board;
}

// Extracts Year and Semester number from SemesterKeys: "Y1S2"
export function parseSemesterKey(key: string) {
    const match = key.match(/Y(\d+)S(\d+)/);

    if (!match) {
        console.log("Developer Error: Invalid semesterKey format");
        throw new Error(`Invalid semesterKey format "${key}". Expected format like "Y1S1".`);
    }

    return {
        year: parseInt(match[1], 10),
        semester: parseInt(match[2], 10),
    };
}

// Get the next Display Order for showing on Planner
export function getNextDisplayOrder(currentModules: PlannerModule[]): number {
    if (currentModules.length === 0) return 0;

    // Find the highest displayOrder currently in the list, then add 1
    const maxOrder = Math.max(...currentModules.map((m) => m.displayOrder ?? 0));
    return maxOrder + 1;
}
