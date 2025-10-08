import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read from environment; do not hardcode secrets in source control
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Create a dummy client if env vars are missing (for build time)
let supabase: SupabaseClient;
if (!supabaseUrl || !supabaseAnonKey) {
	console.warn('Missing Supabase environment variables. Using dummy client for build.');
	supabase = createClient('https://dummy.supabase.co', 'dummy-key');
} else {
	supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };