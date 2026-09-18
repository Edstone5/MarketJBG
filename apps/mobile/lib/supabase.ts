import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSupabaseClient } from '@emprende/db';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigurado = Boolean(url && anonKey);

if (!supabaseConfigurado) {
  console.warn(
    '[Supabase] Faltan EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY en .env. ' +
      'Copia apps/mobile/.env.example a .env y completa los valores de tu proyecto.',
  );
}

// Se usa un placeholder inválido pero bien formado cuando faltan las env vars,
// para que la app no crashee al abrir: las llamadas a la API fallarán con un
// error de red visible en pantalla, en vez de un white-screen en el arranque.
export const supabase = createSupabaseClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
