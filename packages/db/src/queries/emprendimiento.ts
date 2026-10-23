import { ErrorDeUsuario, rutaDeFoto, type CrearEmprendimientoInput, type CrearProductoInput } from '@emprende/core';
import type { TypedSupabaseClient } from '../client';

export async function obtenerMiEmprendimiento(supabase: TypedSupabaseClient, usuarioId: string) {
  const { data, error } = await supabase
    .from('emprendimientos')
    .select('*, productos(*), pagos(*)')
    .eq('usuario_id', usuarioId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function crearEmprendimiento(
  supabase: TypedSupabaseClient,
  usuarioId: string,
  input: CrearEmprendimientoInput,
) {
  const { data, error } = await supabase
    .from('emprendimientos')
    .insert({
      usuario_id: usuarioId,
      nombre: input.nombre,
      descripcion: input.descripcion,
      categoria_slug: input.categoriaSlug,
      whatsapp: input.whatsapp,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function crearProducto(
  supabase: TypedSupabaseClient,
  emprendimientoId: string,
  input: CrearProductoInput,
) {
  const { data, error } = await supabase
    .from('productos')
    .insert({
      emprendimiento_id: emprendimientoId,
      tipo: input.tipo,
      nombre: input.nombre,
      descripcion: input.descripcion,
      precio: input.precio,
      categoria_slug: input.categoriaSlug,
      imagenes: input.imagenes,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

const SIN_PERMISO = 'No se encontró la publicación o no tienes permiso para cambiarla.';

/** Cambia todos los datos editables de una publicación (solo su dueño; lo exige la base de datos). */
export async function actualizarProducto(
  supabase: TypedSupabaseClient,
  productoId: string,
  input: CrearProductoInput,
) {
  const { data, error } = await supabase
    .from('productos')
    .update({
      tipo: input.tipo,
      nombre: input.nombre,
      descripcion: input.descripcion,
      precio: input.precio,
      categoria_slug: input.categoriaSlug,
      imagenes: input.imagenes,
    })
    .eq('id', productoId)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ErrorDeUsuario(SIN_PERMISO);
  return data;
}

/** Oculta (`false`) o vuelve a mostrar (`true`) una publicación en el catálogo sin borrarla. */
export async function alternarDisponibilidadProducto(
  supabase: TypedSupabaseClient,
  productoId: string,
  disponible: boolean,
) {
  const { data, error } = await supabase
    .from('productos')
    .update({ disponible })
    .eq('id', productoId)
    .select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new ErrorDeUsuario(SIN_PERMISO);
}

/** Borra una publicación. Devuelve sus fotos para que quien llama las quite del almacenamiento. */
export async function eliminarProducto(supabase: TypedSupabaseClient, productoId: string): Promise<string[]> {
  const { data, error } = await supabase.from('productos').delete().eq('id', productoId).select('imagenes');
  if (error) throw error;
  // Con las políticas RLS, borrar algo ajeno no da error: simplemente no borra nada.
  if (!data || data.length === 0) throw new ErrorDeUsuario(SIN_PERMISO);
  return data[0]?.imagenes ?? [];
}

/**
 * Quita del almacenamiento las fotos de producto indicadas (por su URL pública). Es de mejor esfuerzo: si algo
 * falla no se interrumpe lo que ya se guardó; solo queda un archivo suelto.
 */
export async function eliminarFotosDeProducto(supabase: TypedSupabaseClient, urls: string[]): Promise<void> {
  const rutas = urls.map((url) => rutaDeFoto(url, 'productos')).filter((r): r is string => r !== null);
  if (rutas.length === 0) return;
  await supabase.storage.from('productos').remove(rutas);
}
