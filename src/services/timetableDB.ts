import { supabase } from "./supabase";
import { getUserId } from "@/services/auth";
import { getErrorMessage } from "@/utils/generalUtils/getErrorMessage";
import type { ModuleDetails, DisplayLesson, SavedTimetableModule } from "@/types";
import {
    formatSavedModules,
    formatForTimetableDatabase,
} from "@/utils/timetableUtils/lessonFormatters";
import { findBestFit } from "@/utils/timetableUtils/optimalScheduler";
import { toast } from "sonner";

export async function getUserModules(userId: string, year: number, semester: number) {
    const { data, error } = await supabase
        .from("timetable_modules")
        .select("*")
        .eq("user_id", userId)
        .eq("year", year)
        .eq("semester", semester);
    return { myModules: data, error };
}

export async function isInTimetable(moduleCode: string, year: number, semester: number) {
    const userId = await getUserId();
    if (!userId) return false;

    const { data, error: moduleDNEerror } = await supabase
        .from("timetable_modules")
        .select("id")
        .eq("user_id", userId)
        .eq("module_code", moduleCode)
        .eq("year", year)
        .eq("semester", semester)
        .limit(1);

    if (moduleDNEerror) {
        console.error("Error checking module status:", moduleDNEerror);
        return false;
    }

    return data.length > 0;
}

export async function addToTimetable(
    moduleCode: string,
    timetableSlots: ModuleDetails["semesterData"][number]["timetable"],
    year: number,
    semester: number
) {
    try {
        // Get user (supabase). Add to timetable only works if logged in
        const userId = await getUserId();
        if (!userId) {
            toast.error("Authentication required. Please log in first.");
            return false;
        }

        const { myModules } = await getUserModules(userId, year, semester);

        // Convert existing Supabase data to DisplayLesson for the optimisation algorithm
        const currentTimetable = formatSavedModules((myModules as SavedTimetableModule[]) || []);

        const optimalSlots = findBestFit(moduleCode, timetableSlots, currentTimetable);
        if (optimalSlots.length === 0) {
            toast.error("Could not schedule module. No valid lessons found.");
            return false;
        }

        // Upload optimal slots to Supabase
        const rowsToInsert = formatForTimetableDatabase(
            optimalSlots,
            userId,
            year,
            semester,
            moduleCode
        );

        const { error: dbError } = await supabase.from("timetable_modules").upsert(rowsToInsert);
        if (dbError) throw dbError;

        toast.success(`${moduleCode} has been successfully added!`, {
            description: "Please Check your Timetable",
        });

        return true;
    } catch (error) {
        toast.error("Failed to update database", { description: getErrorMessage(error) });
        return false;
    }
}

export async function removeFromTimetable(moduleCode: string, year: number, semester: number) {
    try {
        const userId = await getUserId();
        if (!userId) {
            toast.error("Authentication required. Please log in first.");
            return false;
        }

        const { data, error: deletionError } = await supabase
            .from("timetable_modules")
            .delete()
            .eq("user_id", userId)
            .eq("module_code", moduleCode)
            .eq("year", year)
            .eq("semester", semester)
            .select();

        if (deletionError) throw deletionError;

        if (!data || data.length === 0) {
            toast.error("Could not find that module in your database to delete.");
            console.error("Delete failed. Check if year/sem match exactly in Supabase.");
            return false;
        }

        toast.success(`${moduleCode} removed from your timetable.`);
        return true;
    } catch (error) {
        toast.error("Failed to remove", { description: getErrorMessage(error) });
        return false;
    }
}

export async function swapLessonInTimetable(
    oldLesson: DisplayLesson,
    newClassSlots: DisplayLesson[],
    year: number,
    semester: number
) {
    try {
        const userId = await getUserId();
        if (!userId) {
            toast.error("Authentication required. Please log in first.");
            return false;
        }

        // Delete all old slots tied to the previous classNo
        const { error: deleteError } = await supabase
            .from("timetable_modules")
            .delete()
            .eq("user_id", userId)
            .eq("module_code", oldLesson.moduleCode)
            .eq("lesson_type", oldLesson.lessonType)
            .eq("class_no", oldLesson.classNo)
            .eq("year", year)
            .eq("semester", semester);

        if (deleteError) throw deleteError;

        // Insert all new slots tied to the new classNo
        const rowsToInsert = formatForTimetableDatabase(newClassSlots, userId, year, semester);

        const { error: insertError } = await supabase
            .from("timetable_modules")
            .insert(rowsToInsert);

        if (insertError) throw insertError;

        return true;
    } catch (error) {
        console.error("Failed to swap lesson in DB:", error);
        throw error; // Throw to trigger React Query's onError rollback
    }
}
