import { supabase } from "@/services/supabase";

// Used for optional checks (e.g. UI logic)
export async function getUserId(): Promise<string | null> {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user.id;
}

// Used for required checks (e.g. editting database)
export async function requireAuth(): Promise<string> {
    const userId = await getUserId();

    if (!userId) {
        throw new Error("Authentication required. Please log in to continue.");
    }

    return userId;
}
