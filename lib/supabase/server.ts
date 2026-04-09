import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are missing.');
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}
