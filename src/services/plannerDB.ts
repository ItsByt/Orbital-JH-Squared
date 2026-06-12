import { supabase } from "./supabase";
import { getUserId, requireAuth } from "./auth";
import { formatForPlannerDatabase } from "@/utils/plannerUtils/plannerFormatters";
import type { PlannerModule } from "@/types";

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

export async function addbuildPlannerModuleDB(
    module: PlannerModule,
    year: number,
    semester: number
) {
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
export async function massUpdatePlannerModulesDB(
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
