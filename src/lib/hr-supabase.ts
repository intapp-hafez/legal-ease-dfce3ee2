import { createClient } from "@supabase/supabase-js";

// Connection to the external HR System's Supabase instance
const HR_SUPABASE_URL = "https://hydakxwzpfzwolencnmp.supabase.co";
const HR_SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5ZGFreHd6cGZ6d29sZW5jbm1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDg1MTU0OCwiZXhwIjoyMDk2NDI3NTQ4fQ.UFHMPqwKXj5zQuxEA6zTw8kYfWDsvS9v6mnFK2qmUzs";

export const hrSupabase = createClient(HR_SUPABASE_URL, HR_SUPABASE_SERVICE_ROLE_KEY);
