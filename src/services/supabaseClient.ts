/**
 * @file supabaseClient.ts
 * @description Supabase client singleton with graceful fallback for unconfigured environments.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl: string = import.meta.env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey: string = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export default supabase;
