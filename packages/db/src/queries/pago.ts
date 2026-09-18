import type { ReportarPagoInput } from '@emprende/core';
import type { TypedSupabaseClient } from '../client';

export async function reportarPago(
  supabase: TypedSupabaseClient,
  emprendimientoId: string,
  input: ReportarPagoInput,
) {
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

/** Panel de administración: pagos pendientes de revisión (sección 2.7 / 2.8). */
export async function listarPagosPendientes(supabase: TypedSupabaseClient) {
  const { data, error } = await supabase
    .from('pagos')
    .select('*, emprendimiento:emprendimientos (id, nombre, usuario_id)')
    .eq('estado', 'pendiente')
    .order('creado_en', { ascending: true });
  if (error) throw error;
  return data;
}

export async function revisarPago(
  supabase: TypedSupabaseClient,
  pagoId: string,
  adminId: string,
  aprobar: boolean,
  motivoRechazo?: string,
) {
  const { data: pago, error: pagoError } = await supabase
    .from('pagos')
    .update({
      estado: aprobar ? 'aprobado' : 'rechazado',
      revisado_por: adminId,
      revisado_en: new Date().toISOString(),
      motivo_rechazo: aprobar ? null : (motivoRechazo ?? null),
    })
    .eq('id', pagoId)
    .select()
    .single();
  if (pagoError) throw pagoError;

  if (aprobar) {
    const ahora = new Date();
    const finPeriodo = new Date(ahora);
    finPeriodo.setMonth(finPeriodo.getMonth() + 1);

    const { error: empError } = await supabase
      .from('emprendimientos')
      .update({ estado: 'activo' })
      .eq('id', pago.emprendimiento_id);
    if (empError) throw empError;
  }

  return pago;
}
