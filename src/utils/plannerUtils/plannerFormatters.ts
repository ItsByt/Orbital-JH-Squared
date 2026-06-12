import { TOTAL_PLANNER_YEARS } from "@/config/constants";
import type { ModuleDetails, PlannerModule, SavedPlannerRow } from "@/types";
import { EXEMPTION_KEY, isExemptionKey } from "./semesterKeyUtils";

// Formats NUSMods API information into PlannerModule
export function buildPlannerModule(details: ModuleDetails, displayOrder: number, semesterKey: string): PlannerModule {
    const availableSemesters = details.semesterData.map((s) => s.semester);

    return {
        moduleCode: details.moduleCode,
        title: details.title,
        moduleCredit: Number(details.moduleCredit) || 0,
        displayOrder: displayOrder,
        availableSemesters: availableSemesters,
        isExemption: isExemptionKey(semesterKey),
        excludeFromTotal: false,
    };
}


// Formats PlannerModule information to be stored in Supabase
export function formatForPlannerDatabase(
    userId: string,
    module: PlannerModule,
    year: number,
    semester: number
) {
    return {
        user_id: userId,
        module_code: module.moduleCode,
        title: module.title,
        module_credit: module.moduleCredit,
        year: year,
        semester: semester,
        display_order: module.displayOrder,
        available_semesters: module.availableSemesters,
        is_exemption: module.isExemption,
        exclude_from_total: module.excludeFromTotal
    };
}


// Formats Supabase data into PlannerModules
export function formatSavedPlannerModules(savedRows: SavedPlannerRow[]): PlannerModule[] {
    return savedRows.map((row) => ({
        moduleCode: row.module_code,
        title: row.title,
        moduleCredit: row.module_credit,
        displayOrder: row.display_order,
        availableSemesters: row.available_semesters,
        isExemption: row.is_exemption,
        excludeFromTotal: row.exclude_from_total,
    }));
}

// Formats an Empty Planner Data Board
export function generateEmptyBoard(): Record<string, PlannerModule[]> {
    const board: Record<string, PlannerModule[]> = {};
    for (let year = 1; year <= TOTAL_PLANNER_YEARS; year++) {
        board[`Y${year}S1`] = [];
        board[`Y${year}S2`] = [];
    }

    board[EXEMPTION_KEY] = [];
    return board;
}

// Formats Supabase data into the Data Board for the planner to use directly
export function formatPlannerBoard(savedRows: SavedPlannerRow[]): Record<string, PlannerModule[]> {
    const board = generateEmptyBoard();
    savedRows.forEach((row) => {
        const key = row.is_exemption ? EXEMPTION_KEY: `Y${row.year}S${row.semester}`;
        if (board[key]) {
            board[key].push({
                moduleCode: row.module_code,
                title: row.title,
                moduleCredit: row.module_credit,
                displayOrder: row.display_order,
                availableSemesters: row.available_semesters,
                isExemption: row.is_exemption,
                excludeFromTotal: row.exclude_from_total,
            });
        }
    });

    for (const key in board) {
        board[key].sort((a, b) => a.displayOrder - b.displayOrder);
    }

    return board;
}

// Get the next Display Order for showing on Planner
export function getNextDisplayOrder(currentModules: PlannerModule[]): number {
    if (currentModules.length === 0) return 0;

    // Find the highest displayOrder currently in the list, then add 1
    const maxOrder = Math.max(...currentModules.map((m) => m.displayOrder ?? 0));
    return maxOrder + 1;
}
