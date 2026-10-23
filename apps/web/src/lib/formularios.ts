/**
 * Lee una lista de textos enviada como JSON en un campo del formulario (por
 * ejemplo las fotos subidas). Se usa JSON y no comas porque una URL puede
 * contener comas.
 */
export function leerLista(valor: FormDataEntryValue | null): string[] {
  if (typeof valor !== 'string' || valor.length === 0) return [];
  try {
    const lista: unknown = JSON.parse(valor);
    return Array.isArray(lista) ? lista.filter((elemento): elemento is string => typeof elemento === 'string') : [];
  } catch {
    return [];
  }
}
