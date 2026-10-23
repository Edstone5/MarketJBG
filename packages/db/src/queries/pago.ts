import { ErrorDeUsuario, MAX_PAGOS_PENDIENTES, type ReportarPagoInput } from '@emprende/core';
import type { TypedSupabaseClient } from '../client';

export async function reportarPago(
  supabase: TypedSupabaseClient,
  emprendimientoId: string,
  input: ReportarPagoInput,
) {
  // La base de datos también lo exige; se comprueba antes para dar un mensaje claro.
  const { count, error: conteoError } = await supabase
    .from('pagos')
    .select('id', { count: 'exact', head: true })
    .eq('emprendimiento_id', emprendimientoId)
    .eq('estado', 'pendiente');
  if (conteoError) throw conteoError;
  if ((count ?? 0) >= MAX_PAGOS_PENDIENTES) {
    throw new ErrorDeUsuario(
      `Ya tienes ${MAX_PAGOS_PENDIENTES} pagos esperando revisión. Espera a que un administrador los valide.`,
    );
  }

  const { data, error } = await supabase
    .from('pagos')
    .insert({
      emprendimiento_id: emprendimientoId,
      monto_reportado: input.montoReportado,
      comprobante_url: input.comprobanteUrl,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Panel de administración: pagos pendientes de validación (sección 2.7 / 2.8). */
export async function listarPagosPendientes(supabase: TypedSupabaseClient) {
  const { data, error } = await supabase
    .from('pagos')
    .select('*, emprendimiento:emprendimientos (id, nombre, usuario_id)')
    .eq('estado', 'pendiente')
    .order('creado_en', { ascending: true });
  if (error) throw error;
  return data;
}

/**
 * El administrador valida el comprobante. La función `validar_pago` de la base
 * de datos hace todo en una sola transacción: marca el pago como 'validado',
 * activa el emprendimiento y le da un mes más de vigencia (ver 0005).
 */
export async function validarPago(supabase: TypedSupabaseClient, pagoId: string) {
  const { data, error } = await supabase.rpc('validar_pago', { p_pago_id: pagoId });
  if (error) throw error;
  return data;
}
