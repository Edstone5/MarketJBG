'use server';

import { redirect } from 'next/navigation';
import { loginSchema, registroSchema } from '@emprende/core';
import { createClient } from '@/lib/supabase/server';

export interface EstadoFormulario {
  error?: string;
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
    return { error: resultado.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(resultado.data);
  if (error) {
    return { error: 'Correo o contraseña incorrectos.' };
  }

  redirect('/mi-emprendimiento');
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
    return { error: resultado.error.issues[0]?.message ?? 'Datos inválidos' };
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
    return { error: error.message };
  }

  redirect('/login?registrado=1');
}

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
