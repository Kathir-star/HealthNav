/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Verify if a real custom Supabase project URL is configured
export const isSupabaseConfigured = Boolean(
  rawSupabaseUrl && 
  rawSupabaseAnonKey && 
  !rawSupabaseUrl.includes('mlztrxjuhaneoidhmqsz.supabase.co') &&
  rawSupabaseUrl.startsWith('https://')
);

export const supabase = createClient(
  isSupabaseConfigured ? rawSupabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? rawSupabaseAnonKey : 'dummy-anon-key',
  {
    auth: {
      persistSession: isSupabaseConfigured,
      autoRefreshToken: isSupabaseConfigured,
      detectSessionInUrl: isSupabaseConfigured,
    }
  }
);

