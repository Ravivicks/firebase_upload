import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lkyiwsnptownvojfpgpr.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxreWl3c25wdG93bnZvamZwZ3ByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNTU0ODMsImV4cCI6MjA1MDYzMTQ4M30.MRB71L9QjSp_yzRF-ldvLfbUbRbEwTXh7WzV4iKYYFs";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
