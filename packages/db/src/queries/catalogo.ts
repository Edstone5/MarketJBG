import type { FiltroCatalogo } from '@emprende/core';
import type { TypedSupabaseClient } from '../client';

/**
 * Lista productos disponibles del catálogo público (solo de emprendimientos
 * con estado 'activo', reforzado además por las políticas RLS).
 */
export async function listarProductosCatalogo(
  supabase: TypedSupabaseClient,
  filtro: Partial<FiltroCatalogo> = {},
) {
  let query = supabase
    .from('productos')
    .select(
      `id, tipo, nombre, descripcion, precio, categoria_slug, imagenes, disponible, creado_en,
       emprendimiento:emprendimientos!inner (id, nombre, logo_url, estado)`,
    )
    .eq('disponible', true)
    .eq('emprendimiento.estado', 'activo');

  if (filtro.query) {
    query = query.ilike('nombre', `%${filtro.query}%`);
  }
  if (filtro.categoriaSlug) {
    query = query.eq('categoria_slug', filtro.categoriaSlug);
  }
  if (filtro.tipo) {
    query = query.eq('tipo', filtro.tipo);
  }
  if (typeof filtro.precioMin === 'number') {
    query = query.gte('precio', filtro.precioMin);
  }
  if (typeof filtro.precioMax === 'number') {
    query = query.lte('precio', filtro.precioMax);
  }

  switch (filtro.ordenarPor) {
    case 'precio-asc':
      query = query.order('precio', { ascending: true });
      break;
    case 'precio-desc':
      query = query.order('precio', { ascending: false });
      break;
    default:
      query = query.order('creado_en', { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function obtenerCategorias(supabase: TypedSupabaseClient) {
  const { data, error } = await supabase.from('categorias').select('*').order('nombre');
  if (error) throw error;
  return data;
}

export async function obtenerProductoPorId(supabase: TypedSupabaseClient, id: string) {
  const { data, error } = await supabase
    .from('productos')
    .select(
      `*, emprendimiento:emprendimientos!inner (id, nombre, logo_url, whatsapp, estado)`,
    )
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function obtenerEmprendimientoPorId(supabase: TypedSupabaseClient, id: string) {
  const { data, error } = await supabase
    .from('emprendimientos')
    .select('*, productos(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}
