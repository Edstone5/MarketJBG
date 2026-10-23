'use server';

import { revalidatePath } from 'next/cache';
import { mensajeError, primerError, validarPagoSchema } from '@emprende/core';
import { validarPago } from '@emprende/db';
import { createClient } from '@/lib/supabase/server';
import type { EstadoFormulario } from './auth';

/**
 * Valida un pago pendiente. Quién puede hacerlo lo decide la base de datos
 * (la función validar_pago exige rol 'admin'), no este código.
 */
export async function validarPagoAction(
  _prev: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const resultado = validarPagoSchema.safeParse({ pagoId: formData.get('pagoId') });
  if (!resultado.success) return { error: primerError(resultado.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Tu sesión expiró. Vuelve a iniciar sesión.' };

  try {
    await validarPago(supabase, resultado.data.pagoId);
  } catch (error) {
    return { error: mensajeError(error, 'No se pudo validar el pago. Inténtalo de nuevo.') };
  }

  revalidatePath('/admin');
  return {};
}

/** Genera una URL firmada de corta duración para ver un comprobante privado. */
export async function urlFirmadaComprobante(ruta: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from('comprobantes')
    .createSignedUrl(ruta, 60 * 5);
  if (error) return null;
  return data.signedUrl;
}
