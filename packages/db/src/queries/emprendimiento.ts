import type { CrearEmprendimientoInput, CrearProductoInput } from '@emprende/core';
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

export async function alternarDisponibilidadProducto(
  supabase: TypedSupabaseClient,
  productoId: string,
  disponible: boolean,
) {
  const { error } = await supabase
    .from('productos')
    .update({ disponible })
    .eq('id', productoId);
  if (error) throw error;
}
