/**
 * Reglas para los archivos que suben los usuarios (fotos de productos, logo y
 * comprobantes). Las mismas reglas las impone Supabase Storage en los buckets
 * (supabase/migrations/0005_*.sql); aquí se comprueban antes de subir para dar
 * un mensaje claro.
 */
export const TIPOS_IMAGEN_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

export const TAMANO_MAXIMO_IMAGEN_BYTES = 5 * 1024 * 1024;

/** Devuelve el motivo por el que no se puede subir el archivo, o null si está bien. */
export function validarArchivoImagen(archivo: { type?: string | null; size?: number | null }): string | null {
  if (archivo.type && !(TIPOS_IMAGEN_PERMITIDOS as readonly string[]).includes(archivo.type.toLowerCase())) {
    return 'Solo se aceptan imágenes JPG, PNG o WebP.';
  }
  if (typeof archivo.size === 'number' && archivo.size > TAMANO_MAXIMO_IMAGEN_BYTES) {
    return 'La imagen pesa más de 5 MB. Elige una más liviana.';
  }
  return null;
}

function simplificar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Nombre de archivo seguro para usar como ruta en Storage: sin tildes, espacios,
 * comas ni símbolos («Captura 1, final.PNG» → «captura-1-final.png»).
 */
export function nombreArchivoSeguro(nombre: string, maxLargo = 60): string {
  const soloNombre = nombre.split(/[\\/]/).pop() ?? '';
  const punto = soloNombre.lastIndexOf('.');
  const base = punto > 0 ? soloNombre.slice(0, punto) : soloNombre;
  const extension = punto > 0 ? simplificar(soloNombre.slice(punto + 1)).slice(0, 5) : '';
  const limpio = simplificar(base).slice(0, maxLargo) || 'archivo';
  return extension ? `${limpio}.${extension}` : limpio;
}

/** ¿La URL es una foto pública del bucket indicado, dentro de la carpeta de ese usuario? */
export function esFotoDelUsuario(url: string, bucket: 'productos' | 'logos', usuarioId: string): boolean {
  return url.includes(`/storage/v1/object/public/${bucket}/${usuarioId}/`);
}

/**
 * Ruta del archivo dentro del bucket (`<usuario>/<archivo>`) a partir de su URL pública, o null si la URL no es
 * una foto de ese bucket. Sirve para borrar del almacenamiento las fotos que ya no usa un producto.
 */
export function rutaDeFoto(url: string, bucket: 'productos' | 'logos'): string | null {
  const marca = `/storage/v1/object/public/${bucket}/`;
  const i = url.indexOf(marca);
  if (i < 0) return null;
  const ruta = decodeURIComponent(url.slice(i + marca.length).split(/[?#]/)[0] ?? '');
  return ruta && !ruta.includes('..') ? ruta : null;
}
