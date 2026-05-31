import { supabase } from "@/services/supabase";

export async function getUserId(): Promise<string | null> {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return null;
    }

    return user.id;
}