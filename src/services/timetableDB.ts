import { supabase } from "./supabase";
import { getUserId, requireAuth } from "./auth"; // Ensure you import requireAuth
import type { ModuleDetails, DisplayLesson, SavedTimetableModule } from "@/types";
import {
    formatSavedTimetableModules,
    formatForTimetableDatabase,
} from "@/utils/timetableUtils/lessonFormatters";
import { findBestFit } from "@/utils/timetableUtils/optimalScheduler";

export async function getUserModules(userId: string, year: number, semester: number) {
    const { data, error } = await supabase
        .from("timetable_modules")
        .select("*")
        .eq("user_id", userId)
        .eq("year", year)
        .eq("semester", semester);
    return { myModules: data, error };
}

export async function isInTimetableDB(moduleCode: string, year: number, semester: number) {
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
        throw moduleDNEerror;
    }

    return data.length > 0;
}

export async function addToTimetableDB(
    moduleCode: string,
    timetableSlots: ModuleDetails["semesterData"][number]["timetable"],
    year: number,
    semester: number
) {
    const userId = await requireAuth(); // Guaranteed to throw error if not logged in

    const { myModules } = await getUserModules(userId, year, semester);

    // Convert existing Supabase data to DisplayLesson for the optimisation algorithm
    const currentTimetable = formatSavedTimetableModules(
        (myModules as SavedTimetableModule[]) || []
    );

    const optimalSlots = findBestFit(moduleCode, timetableSlots, currentTimetable);

    if (optimalSlots.length === 0) {
        throw new Error("Could not schedule module. No valid lessons found.");
    }

    // Upload optimal slots to Supabase
    const rowsToInsert = formatForTimetableDatabase(
        optimalSlots,
        userId,
        year,
        semester,
        moduleCode
    );
    const { error } = await supabase.from("timetable_modules").upsert(rowsToInsert);

    if (error) throw error;
}

export async function removeFromTimetableDB(
    moduleCode: string,
    year: number,
    semester: number,
    id?: string
) {
    const userId = await requireAuth();

    let query = supabase
        .from("timetable_modules")
        .delete()
        .eq("user_id", userId)
        .eq("year", year)
        .eq("semester", semester);

    if (id) {
        const targetId = id.startsWith("custom-") ? id : Number(id);
        query = query.eq("id", targetId);
    } else {
        query = query.eq("module_code", moduleCode);
    }

    const { data, error } = await query.select();

    if (error) throw error;
    if (!data || data.length === 0) {
        throw new Error("Could not find that module in your database to delete.");
    }
}

export async function swapLessonInTimetableDB(
    oldLesson: DisplayLesson,
    newClassSlots: DisplayLesson[],
    year: number,
    semester: number
) {
    const userId = await requireAuth();

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
    const { error: insertError } = await supabase.from("timetable_modules").insert(rowsToInsert);

    if (insertError) throw insertError;
}

export async function addCustomEventToDB(
    customLesson: DisplayLesson,
    year: number,
    semester: number
) {
    const userId = await requireAuth();

    // Formats custom block into correct format for Supabase
    const rowsToInsert = formatForTimetableDatabase(
        [customLesson],
        userId,
        year,
        semester,
        customLesson.moduleCode
    );

    const { error } = await supabase.from("timetable_modules").insert(rowsToInsert);
    if (error) throw error;
}

export async function updateModuleColorInDB(
    moduleCode: string, 
    color: string, 
    year: number,
    semester: number,) {
    
    const userId = await requireAuth();
    const { error } = await supabase
        .from("timetable_modules")
        .update({ color: color})
        .eq("user_id", userId)
        .eq("module_code", moduleCode)
        .eq("year", year)
        .eq("semester", semester);
    
    if (error) throw error;
}