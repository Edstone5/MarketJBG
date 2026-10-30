import {
  estadisticasSchema,
  PERIODO_ESTADISTICAS_POR_DEFECTO,
  type Estadisticas,
  type TipoVisita,
} from '@emprende/core';
import type { TypedSupabaseClient } from '../client';

export interface RegistrarVisitaInput {
  emprendimientoId: string;
  tipo: TipoVisita;
  /** Obligatorio para `producto`; opcional en `contacto`. */
  productoId?: string | null;
  /** Identificador aleatorio del navegador o de la app, para no contar dos veces la misma visita seguida. */
  visitante?: string | null;
}

/**
 * Cuenta una visita (RF09). La base de datos decide si cuenta: no suma las visitas del
 * propio dueño, ni las de un negocio que el público no ve, ni la misma visita repetida
 * en 30 minutos. Devuelve `true` si se contó.
 */
export async function registrarVisita(supabase: TypedSupabaseClient, input: RegistrarVisitaInput): Promise<boolean> {
  const { data, error } = await supabase.rpc('registrar_visita', {
    p_emprendimiento_id: input.emprendimientoId,
    p_tipo: input.tipo,
    p_producto_id: input.productoId ?? null,
    p_visitante: input.visitante ?? null,
  });
  if (error) throw error;
  return data === true;
}

/**
 * Estadísticas del emprendimiento en los últimos `dias` días, contando hoy (RF09). Solo las
 * puede pedir su dueño o un administrador: a cualquier otra persona la base de datos le
 * responde con un error.
 */
export async function obtenerEstadisticas(
  supabase: TypedSupabaseClient,
  emprendimientoId: string,
  dias: number = PERIODO_ESTADISTICAS_POR_DEFECTO,
): Promise<Estadisticas> {
  const { data, error } = await supabase.rpc('estadisticas_emprendimiento', {
    p_emprendimiento_id: emprendimientoId,
    p_dias: dias,
  });
  if (error) throw error;
  return estadisticasSchema.parse(data);
}
