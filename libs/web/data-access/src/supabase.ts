import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Log for debugging (will be visible in browser console)
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars');
  // Create a dummy client to prevent app crash
  export const supabase = createClient(
    'https://placeholder.supabase.co',
    'placeholder-key'
  );
} else {
  export const supabase = createClient(supabaseUrl, supabaseAnonKey);
}
