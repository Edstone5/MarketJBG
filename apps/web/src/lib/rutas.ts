/**
 * Solo se aceptan rutas internas del sitio («/admin», «/catalogo?q=pan»).
 * Cualquier otra cosa (https://otro.sitio, //otro.sitio, @otro.sitio, \\otro)
 * cae en `porDefecto`, para que `?next=` no pueda mandar a otra página.
 */
export function rutaInterna(destino: string | null | undefined, porDefecto = '/mi-emprendimiento'): string {
  if (!destino) return porDefecto;
  if (!destino.startsWith('/') || destino.startsWith('//') || destino.startsWith('/\\')) return porDefecto;
  if (/[\u0000-\u001f\\]/.test(destino)) return porDefecto;
  return destino;
}
