import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient as BaseSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseAnonKey =
  import.meta.env.SUPABASE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Type definition for our Supabase client
export type SupabaseClient = BaseSupabaseClient<Database>;

// Default user ID for development/testing (no auth)
export const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";
