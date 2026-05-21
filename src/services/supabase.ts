import { createClient } from "@supabase/supabase-js";

// Creating a single supabase client for interacting with our database
const supabaseURL = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// https://sfdhgjbkfrljjccuahkr.supabase.co/
// sb_publishable_T3MeArtV_qDpOzZlCPujNA_fBElJI26


export const supabase = createClient(supabaseURL, supabaseKey)


