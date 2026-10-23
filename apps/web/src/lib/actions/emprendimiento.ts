'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  crearEmprendimientoSchema,
  crearProductoSchema,
  esFotoDelUsuario,
  mensajeError,
  primerError,
  reportarPagoSchema,
} from '@emprende/core';
import { crearEmprendimiento, crearProducto, reportarPago } from '@emprende/db';
import { createClient } from '@/lib/supabase/server';
import { leerLista } from '@/lib/formularios';
import type { EstadoFormulario } from './auth';

async function usuarioActual() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');
  return { supabase, user };
}

export async function crearEmprendimientoAction(
  _prev: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const resultado = crearEmprendimientoSchema.safeParse({
    nombre: formData.get('nombre'),
    descripcion: formData.get('descripcion'),
    categoriaSlug: formData.get('categoriaSlug'),
    whatsapp: formData.get('whatsapp'),
  });
  if (!resultado.success) {
    return { error: primerError(resultado.error) };
  }

  try {
    const { supabase, user } = await usuarioActual();
    await crearEmprendimiento(supabase, user.id, resultado.data);
  } catch (error) {
    return { error: mensajeError(error, 'No se pudo crear el emprendimiento.') };
  }

  revalidatePath('/mi-emprendimiento');
  return {};
}

export async function crearProductoAction(
  emprendimientoId: string,
  _prev: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const resultado = crearProductoSchema.safeParse({
    tipo: formData.get('tipo'),
    nombre: formData.get('nombre'),
    descripcion: formData.get('descripcion'),
    precio: Number(formData.get('precio')),
    categoriaSlug: formData.get('categoriaSlug'),
    imagenes: leerLista(formData.get('imagenes')),
  });
  if (!resultado.success) {
    return { error: primerError(resultado.error) };
  }

  try {
    const { supabase, user } = await usuarioActual();
    // Las fotos solo pueden ser las que la persona subió a su carpeta (la base de datos también lo exige).
    if (!resultado.data.imagenes.every((url) => esFotoDelUsuario(url, 'productos', user.id))) {
      return { error: 'Las fotos deben subirse desde la aplicación.' };
    }
    await crearProducto(supabase, emprendimientoId, resultado.data);
  } catch (error) {
    return { error: mensajeError(error, 'No se pudo publicar el producto.') };
  }

  revalidatePath('/mi-emprendimiento');
  // Tras publicar, vuelve a la lista de productos (donde aparece lo recién publicado).
  redirect('/mi-emprendimiento');
}

export async function reportarPagoAction(
  emprendimientoId: string,
  _prev: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const resultado = reportarPagoSchema.safeParse({
    montoReportado: Number(formData.get('montoReportado')),
    comprobanteUrl: leerLista(formData.get('comprobanteUrl'))[0] ?? '',
  });
  if (!resultado.success) {
    return { error: primerError(resultado.error) };
  }

  try {
    const { supabase, user } = await usuarioActual();
    if (!resultado.data.comprobanteUrl.startsWith(`${user.id}/`)) {
      return { error: 'El comprobante debe subirse desde la aplicación.' };
    }
    await reportarPago(supabase, emprendimientoId, resultado.data);
  } catch (error) {
    return { error: mensajeError(error, 'No se pudo reportar el pago.') };
  }

  revalidatePath('/mi-emprendimiento/suscripcion');
  return { mensaje: 'Pago reportado. Un administrador lo validará, normalmente en menos de 24 horas.' };
}
