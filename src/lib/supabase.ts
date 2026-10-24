import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env['VITE_SUPABASE_URL'] ?? '';
const supabaseAnonKey = import.meta.env['VITE_SUPABASE_ANON_KEY'] ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Please check your .env file.');
}

// createClient("") throws at import time and white-screens the whole app when
// env vars are absent (e.g. local/dev without a linked backend). Use a
// placeholder URL so the module always loads; data hooks already catch failed
// fetches and fall back to their local collection storage.
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
);
