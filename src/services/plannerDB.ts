import { supabase } from "./supabase";
import { getUserId, requireAuth } from "./auth";
import { formatForPlannerDatabase } from "@/utils/plannerUtils/plannerFormatters";
import type { PlannerModule } from "@/types";
import { parseSemesterKey } from "@/utils/plannerUtils/semesterKeyUtils";

export async function getPlannerModules() {
    const userId = await getUserId();
    if (!userId) return [];

    const { data, error } = await supabase
        .from("planner_modules")
        .select("*")
        .eq("user_id", userId)
        .order("display_order", { ascending: true });

    if (error) {
        console.error(error);
        throw error;
    }

    return data || [];
}

export async function addToPlannerModuleDB(module: PlannerModule, year: number, semester: number) {
    const userId = await requireAuth();
    const rowToInsert = formatForPlannerDatabase(userId, module, year, semester);

    const { error } = await supabase.from("planner_modules").insert(rowToInsert);
    if (error) throw error;
}

export async function removeFromPlannerModuleDB(moduleCode: string) {
    const userId = await requireAuth();

    const { data, error } = await supabase
        .from("planner_modules")
        .delete()
        .eq("user_id", userId)
        .eq("module_code", moduleCode)
        .select();

    if (error) throw error;
    if (!data || data.length === 0) {
        throw new Error("Could not find that module in your database to delete.");
    }
}

// Used to toggle Exclude From Total field for a specific module
export async function setExcludeInPlannerModuleDB(moduleCode: string, newValue: boolean) {
    const userId = await requireAuth();

    const { error } = await supabase
        .from("planner_modules")
        .update({ exclude_from_total: newValue })
        .eq("user_id", userId)
        .eq("module_code", moduleCode);

    if (error) throw error;
}

// Used to update multiple modules in a specific year and semester
export async function massUpdatePlannerModuleDB(
    modules: PlannerModule[],
    year: number,
    semester: number
) {
    if (modules.length === 0) return;
    const userId = await requireAuth();

    const rowsToUpsert = modules.map((mod) =>
        formatForPlannerDatabase(userId, mod, year, semester)
    );

    const { error } = await supabase
        .from("planner_modules")
        .upsert(rowsToUpsert, { onConflict: "user_id, module_code" });

    if (error) throw error;
}

// Used to mass delete all modules in a specific year and semester
export async function clearPlannerColumnDB(year: number, semester: number) {
    const userId = await requireAuth();

    const { error } = await supabase
        .from("planner_modules")
        .delete()
        .eq("user_id", userId)
        .eq("year", year)
        .eq("semester", semester);

    if (error) throw error;
}

export async function clearPlannerColumnDBBySemesterKey(semesterKey: string) {
    const { year, semester } = parseSemesterKey(semesterKey);
    await clearPlannerColumnDB(year, semester);
}

export async function setPrereqWarningInPlannerModuleDB(moduleCode: string, newValue: boolean) {
    const userId = await requireAuth();

    const { error } = await supabase
        .from("planner_modules")
        .update({ hide_pre_req_warning: newValue })
        .eq("user_id", userId)
        .eq("module_code", moduleCode);

    if (error) throw error;
}

export async function updatePlannerModuleGradeDB(moduleCode: string, grade: string | null) {
    const userId = await requireAuth();

    const { error } = await supabase
        .from("planner_modules")
        .update({ grade: grade })
        .eq("user_id", userId)
        .eq("module_code", moduleCode);

    if (error) throw error;
}
