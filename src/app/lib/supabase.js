import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase credentials are not set in environment variables");
}

// Public client using anon key (for frontend reads)
export const supabase = createClient(
  supabaseUrl || "",
  supabaseAnonKey || ""
);

// Server/admin client using service role key (for cron writes)
export const supabaseAdmin = createClient(
  supabaseUrl || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey || "" // Fallback config
);
