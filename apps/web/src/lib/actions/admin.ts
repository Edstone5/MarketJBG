'use server';

import { revalidatePath } from 'next/cache';
import { revisarPagoSchema } from '@emprende/core';
import { revisarPago } from '@emprende/db';
import { createClient } from '@/lib/supabase/server';

export async function revisarPagoAction(formData: FormData) {
  const resultado = revisarPagoSchema.safeParse({
    pagoId: formData.get('pagoId'),
    aprobar: formData.get('aprobar') === 'true',
    motivoRechazo: formData.get('motivoRechazo') || undefined,
  });
  if (!resultado.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await revisarPago(
    supabase,
    resultado.data.pagoId,
    user.id,
    resultado.data.aprobar,
    resultado.data.motivoRechazo,
  );

  revalidatePath('/admin');
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
