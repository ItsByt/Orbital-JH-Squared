import { createClient } from "@supabase/supabase-js";

// Creating a single supabase client for interacting with our database
const supabaseURL = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabaseSecretKey = import.meta.env.VITE_SUPABASE_SECRET_KEY;

export const supabase = createClient(supabaseURL, supabaseKey);
