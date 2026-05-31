import { createClient } from '@supabase/supabase-js';

// Load Supabase environment variables with safe defaults for seamless developer experience
const metaEnv = (import.meta as any).env || {};

const supabaseUrl = 
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
  (metaEnv.VITE_SUPABASE_URL) ||
  'https://msklqsezonxqdagkpjgr.supabase.co';

const supabaseAnonKey = 
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
  (metaEnv.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1za2xxc2V6b254cWRhZ2twamdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMzE2NzgsImV4cCI6MjA5NTgwNzY3OH0.cI7LrrfIqmlyD7_xTGT_IahW8RZ7Uhi9mU6Sp5En9H8';

// Create and export the Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
