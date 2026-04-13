/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mlztrxjuhaneoidhmqsz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1senRyeGp1aGFuZW9pZGhtcXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNTkzMTMsImV4cCI6MjA5MTYzNTMxM30.igOIpjJDV7MrCHeNsMKbSb80XwB2GK8lCCA4CX0mUd4';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
