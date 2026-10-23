import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Almacenamiento de la sesión de Supabase en el llavero del teléfono (Keychain en iOS, Keystore en Android)
 * en lugar de AsyncStorage, que guarda el texto sin cifrar.
 *
 * - SecureStore avisa con valores de más de 2048 bytes y la sesión de Supabase suele pasarlos, así que el
 *   valor se parte en trozos: `<clave>.n` guarda cuántos hay y `<clave>.0`, `<clave>.1`… los trozos.
 * - Las claves de SecureStore solo admiten letras, números, `.`, `-` y `_`; la clave de Supabase ya lo cumple.
 * - Si quedó una sesión guardada en AsyncStorage (versiones anteriores), se pasa al llavero y se borra de allí,
 *   para no cerrar la sesión de quien ya la tenía abierta ni dejar el texto sin cifrar.
 * - En la web, SecureStore no existe: se usa AsyncStorage (localStorage del navegador).
 */
const CARACTERES_POR_TROZO = 1500; // por debajo de 2048 bytes aunque haya acentos (hasta 2 bytes por carácter)
const OPCIONES: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK };

const claveConteo = (clave: string) => `${clave}.n`;
const claveTrozo = (clave: string, i: number) => `${clave}.${i}`;

async function leerConteo(clave: string): Promise<number> {
  const bruto = await SecureStore.getItemAsync(claveConteo(clave), OPCIONES);
  const n = bruto === null ? 0 : Number(bruto);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

async function borrarSeguro(clave: string): Promise<void> {
  const n = await leerConteo(clave);
  for (let i = 0; i < n; i++) await SecureStore.deleteItemAsync(claveTrozo(clave, i), OPCIONES);
  await SecureStore.deleteItemAsync(claveConteo(clave), OPCIONES);
}

async function guardarSeguro(clave: string, valor: string): Promise<void> {
  const trozos: string[] = [];
  for (let i = 0; i < valor.length; i += CARACTERES_POR_TROZO) trozos.push(valor.slice(i, i + CARACTERES_POR_TROZO));
  if (trozos.length === 0) trozos.push('');

  const anteriores = await leerConteo(clave);
  for (let i = 0; i < trozos.length; i++) await SecureStore.setItemAsync(claveTrozo(clave, i), trozos[i], OPCIONES);
  await SecureStore.setItemAsync(claveConteo(clave), String(trozos.length), OPCIONES);
  // si el valor nuevo es más corto, se borran los trozos que sobran
  for (let i = trozos.length; i < anteriores; i++) await SecureStore.deleteItemAsync(claveTrozo(clave, i), OPCIONES);
}

async function leerSeguro(clave: string): Promise<string | null> {
  const n = await leerConteo(clave);
  if (n === 0) return null;
  let valor = '';
  for (let i = 0; i < n; i++) {
    const trozo = await SecureStore.getItemAsync(claveTrozo(clave, i), OPCIONES);
    if (trozo === null) return null; // quedó a medias: mejor pedir inicio de sesión que usar una sesión rota
    valor += trozo;
  }
  return valor;
}

/** Con la forma que espera `auth.storage` de Supabase (getItem / setItem / removeItem asíncronos). */
export const almacenamientoSeguro = {
  async getItem(clave: string): Promise<string | null> {
    if (Platform.OS === 'web') return AsyncStorage.getItem(clave);
    const guardado = await leerSeguro(clave);
    if (guardado !== null) return guardado;

    const antiguo = await AsyncStorage.getItem(clave); // migración desde AsyncStorage
    if (antiguo === null) return null;
    await guardarSeguro(clave, antiguo);
    await AsyncStorage.removeItem(clave);
    return antiguo;
  },

  async setItem(clave: string, valor: string): Promise<void> {
    if (Platform.OS === 'web') return AsyncStorage.setItem(clave, valor);
    await guardarSeguro(clave, valor);
    await AsyncStorage.removeItem(clave);
  },

  async removeItem(clave: string): Promise<void> {
    if (Platform.OS === 'web') return AsyncStorage.removeItem(clave);
    await borrarSeguro(clave);
    await AsyncStorage.removeItem(clave);
  },
};
