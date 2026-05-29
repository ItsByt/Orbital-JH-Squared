import { supabase } from "./supabase";
import type { ModuleDetails } from "@/types"
import { toast } from "sonner";

export async function isInTimetable(moduleCode: string, year: number, semester: number) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        return false;
    }

    const { data, error: moduleDNEerror } = await supabase
        .from("timetable_modules")
        .select("id")
        .eq("user_id", user.id)
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
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            toast.error("Authentication required. Please log in first.");
            return;
        }

        // For each timetable "block", group by type, add to Record 
        // Create type if encountered new category
        const groupBy: Record<string, ModuleDetails["semesterData"][number]["timetable"]> = {};
        timetableSlots.forEach(slot => {
            if (!groupBy[slot.lessonType]) {
                groupBy[slot.lessonType] = [];
            }
            groupBy[slot.lessonType].push(slot);
        });

        const rowsToInsert = [];
        // parse every timetable type and retrieve earliest class
        // then update details into supabase
        for (const lessonType in groupBy) {
            const slots = groupBy[lessonType];
            slots.sort((a, b) => {
                if (a.classNo != b.classNo)
                    return a.classNo.localeCompare(b.classNo);
                return parseInt(a.startTime) - parseInt(b.startTime);
            });

            const earliest = slots[0];
            rowsToInsert.push({
                user_id: user.id,

                module_code: moduleCode,
                lesson_type: lessonType,
                class_no: earliest.classNo,

                year: year,
                semester: semester,

                day: earliest.day,
                start_time: earliest.startTime,
                end_time: earliest.endTime,
                venue: earliest.venue,

                weeks: earliest.weeks
                    ? JSON.stringify(earliest.weeks)
                    : null
            });
        }

        const { error: dbError } = await supabase
            .from("timetable_modules")
            .upsert(rowsToInsert);
        if (dbError) throw dbError;

        toast.success(`${moduleCode} has been successfully added!`, {
            description: "Please Check your Timetable"
        });
    } catch (error: any) {
        toast.error("Failed to update timetable database.", {
            description: error.message || "Unexpected error occurred."
        });
    }
}

export async function removeFromTimetable(moduleCode: string, year: number, semester: number) {
    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            toast.error("Authentication required.");
            return false;
        }

        const { data, error: deletionError } = await supabase
            .from("timetable_modules")
            .delete()
            .eq("user_id", user.id)
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
    } catch (error: any) {
        toast.error("Failed to remove module.");
        return false;
    }
}

export async function getUserModules(userId: string, year: number, semester: number) {
    const { data, error } = await supabase
        .from("timetable_modules")
        .select('*')
        .eq("user_id", userId)
        .eq("year", year)
        .eq("semester", semester)
    return { myModules: data, error }
}

