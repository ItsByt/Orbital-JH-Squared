import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// We read the variables using Node's process.env
const supabaseURL = process.env.VITE_SUPABASE_URL as string;
const supabaseServiceKey = process.env.VITE_SUPABASE_SECRET_KEY as string;

if (!supabaseURL || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables in Playwright!");
}

const supabaseAdmin = createClient(supabaseURL, supabaseServiceKey);

const workers = JSON.parse(process.env.E2E_WORKERS || "[]");

export async function wipeTestDatabase(parallelIndex: number) {
    if (workers.length === 0) throw new Error("E2E_WORKERS is empty in .env.local");

    const userId = workers[parallelIndex].uuid;

    if (!userId) {
        throw new Error(`No UUID found for worker index ${userId}.`);
    }

    const { error } = await supabaseAdmin.from("planner_modules").delete().eq("user_id", userId);

    if (error) {
        throw new Error(`Failed to wipe database for worker ${parallelIndex}: ${error.message}`);
    }
}
