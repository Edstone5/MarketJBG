import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@emprende/db';

/**
 * Cliente de Supabase para Client Components ('use client').
 * Usa las cookies del navegador para mantener la sesión.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
