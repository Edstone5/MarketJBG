import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types/database.types';

export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Factory genérica, sin dependencias de framework. Next.js debe usar
 * @supabase/ssr en su lugar (para manejar cookies de sesión en servidor);
 * Expo puede usarla directamente pasando el adaptador de AsyncStorage.
 * Ver apps/web/src/lib/supabase/* y apps/mobile/src/lib/supabase.ts.
 */
export function createSupabaseClient(
  url: string,
  anonKey: string,
  options?: Parameters<typeof createClient<Database>>[2],
): TypedSupabaseClient {
  if (!url || !anonKey) {
    throw new Error(
      'Faltan las variables de entorno de Supabase (SUPABASE_URL / SUPABASE_ANON_KEY).',
    );
  }
  return createClient<Database>(url, anonKey, options);
}
