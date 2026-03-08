import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Log for debugging (will be visible in browser console)
console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key exists:", !!supabaseAnonKey);

// Create supabase client with fallback to placeholder values
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);

// Log warning if using placeholder values
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars - using placeholder client"
  );
}
