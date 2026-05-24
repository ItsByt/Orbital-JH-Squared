import { supabase } from "./supabase";

export async function getUserModules(userId: string) {
    const { data, error } = await supabase.from("timetable_modules").select('*').eq("user_id", userId)
    return data
}