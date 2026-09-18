'use server';

import { revalidatePath } from 'next/cache';
import {
  crearEmprendimientoSchema,
  crearProductoSchema,
  reportarPagoSchema,
} from '@emprende/core';
import { crearEmprendimiento, crearProducto, reportarPago } from '@emprende/db';
import { createClient } from '@/lib/supabase/server';
import type { EstadoFormulario } from './auth';

async function usuarioActualo() {
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
    return { error: resultado.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  try {
    const { supabase, user } = await usuarioActualo();
    await crearEmprendimiento(supabase, user.id, resultado.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error al crear el emprendimiento' };
  }

  revalidatePath('/mi-emprendimiento');
  return {};
}

export async function crearProductoAction(
  emprendimientoId: string,
  _prev: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const imagenesRaw = formData.get('imagenes');
  const imagenes =
    typeof imagenesRaw === 'string' && imagenesRaw.length > 0 ? imagenesRaw.split(',') : [];

  const resultado = crearProductoSchema.safeParse({
    tipo: formData.get('tipo'),
    nombre: formData.get('nombre'),
    descripcion: formData.get('descripcion'),
    precio: Number(formData.get('precio')),
    categoriaSlug: formData.get('categoriaSlug'),
    imagenes,
  });
  if (!resultado.success) {
    return { error: resultado.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  try {
    const { supabase } = await usuarioActualo();
    await crearProducto(supabase, emprendimientoId, resultado.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error al publicar el producto' };
  }

  revalidatePath('/mi-emprendimiento');
  return {};
}

export async function reportarPagoAction(
  emprendimientoId: string,
  _prev: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const resultado = reportarPagoSchema.safeParse({
    montoReportado: Number(formData.get('montoReportado')),
    comprobanteUrl: formData.get('comprobanteUrl'),
  });
  if (!resultado.success) {
    return { error: resultado.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  try {
    const { supabase } = await usuarioActualo();
    await reportarPago(supabase, emprendimientoId, resultado.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error al reportar el pago' };
  }

  revalidatePath('/mi-emprendimiento/suscripcion');
  return {};
}
