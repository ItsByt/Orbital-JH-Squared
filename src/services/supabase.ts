import { createClient } from "@supabase/supabase-js";

// Creating a single supabase client for interacting with our database
const supabaseURL = 'https://sfdhgjbkfrljjccuahkr.supabase.co/'
const supabaseKey = 'sb_publishable_T3MeArtV_qDpOzZlCPujNA_fBElJI26'

export const supabase = createClient(supabaseURL, supabaseKey)


