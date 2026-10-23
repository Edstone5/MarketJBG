'use server';

import { redirect } from 'next/navigation';
import { loginSchema, mensajeError, primerError, registroSchema } from '@emprende/core';
import { createClient } from '@/lib/supabase/server';
import { rutaInterna } from '@/lib/rutas';

export interface EstadoFormulario {
  error?: string;
  /** Aviso de éxito para formularios que se quedan en la misma página. */
  mensaje?: string;
}

export async function iniciarSesion(
  _prev: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const resultado = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!resultado.success) {
    return { error: primerError(resultado.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(resultado.data);
  if (error) {
    return { error: mensajeError(error, 'No se pudo iniciar sesión. Inténtalo de nuevo.') };
  }

  // `next` viene del enlace que nos mandó a iniciar sesión; solo se acepta una ruta interna.
  const destino = formData.get('next');
  redirect(rutaInterna(typeof destino === 'string' ? destino : null));
}

export async function registrarse(
  _prev: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const resultado = registroSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    nombreCompleto: formData.get('nombreCompleto'),
  });
  if (!resultado.success) {
    return { error: primerError(resultado.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: resultado.data.email,
    password: resultado.data.password,
    options: {
      data: { nombre_completo: resultado.data.nombreCompleto },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback`,
    },
  });
  if (error) {
    return { error: mensajeError(error, 'No se pudo crear la cuenta. Inténtalo de nuevo.') };
  }

  redirect('/login?registrado=1');
}

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
