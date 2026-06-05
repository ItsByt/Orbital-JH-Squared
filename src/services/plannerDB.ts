import { supabase } from "./supabase";
import { getUserId } from "./auth";
import { getErrorMessage } from "@/utils/generalUtils/getErrorMessage";
import { formatForPlannerDatabase } from "@/utils/plannerUtils/plannerFormatters";
import { toast } from "sonner";

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
        return [];
    }

    return data || [];
}

export async function addToPlannerModuleDB(
    moduleCode: string,
    title: string,
    moduleCredit: number,
    year: number,
    semester: number,
    displayOrder: number
) {
    try {
        const userId = await getUserId();
        if (!userId) {
            toast.error("Authentication required. Please log in first.");
            return false;
        }

        const rowToInsert = formatForPlannerDatabase(
            userId,
            moduleCode,
            title,
            moduleCredit,
            year,
            semester,
            displayOrder
        );

        const { error: dbError } = await supabase.from("planner_modules").insert(rowToInsert);

        if (dbError) throw dbError;
        toast.success(`${moduleCode} has been successfully added!`, {
            description: "Please Check your Planner",
        });

        return true;
    } catch (error) {
        toast.error("Failed to update database", { description: getErrorMessage(error) });
        return false;
    }
}

export async function removeFromPlannerModuleDB(moduleCode: string) {
    try {
        const userId = await getUserId();
        if (!userId) {
            toast.error("Authentication required. Please log in first.");
            return false;
        }

        const { data, error: deletionError } = await supabase
            .from("planner_modules")
            .delete()
            .eq("user_id", userId)
            .eq("module_code", moduleCode)
            .select();

        if (deletionError) throw deletionError;

        if (!data) {
            toast.error("Could not find that module in your database to delete.");
            console.error(
                "Delete failed for planner. Check if module matches exactly in Supabase."
            );
            return false;
        }

        toast.success(`${moduleCode} removed from your planner.`);
        return true;
    } catch (error) {
        toast.error("Failed to remove", { description: getErrorMessage(error) });
        return false;
    }
}
