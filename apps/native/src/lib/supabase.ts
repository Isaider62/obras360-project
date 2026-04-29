import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://gbtceqmdxbnbkephacus.supabase.co";
const supabaseKey = "sb_publishable_Eu4kmf0IkGUeqjcbUU7_ag_fKvXiBNG";

export const supabase = createClient(supabaseUrl, supabaseKey, {
	auth: {
		persistSession: true,
		autoRefreshToken: true,
	},
	storage: {
		/**
		 * This function is used to get the custom storage.
		 * If not provided, we will use the default storage of the library.
		 */
	},
});

export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_BUCKET = "obras360";

export type SupabaseClient = typeof supabase;
