import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const BUCKETS = ['logos', 'productos', 'comprobantes'] as const;

/**
 * Elimina la cuenta del usuario autenticado y todos sus datos asociados.
 * Usada tanto por la web (/mi-cuenta) como por la app móvil (tab Perfil).
 *
 * Requiere el access token de la sesión en el header
 * `Authorization: Bearer <token>` — nunca confiamos en un userId que venga
 * del cliente, siempre lo resolvemos verificando el token contra Supabase.
 */
export async function DELETE(request: Request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: 'Falta el token de autenticación.' }, { status: 401 });
  }

  const admin = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json({ error: 'Sesión inválida o expirada.' }, { status: 401 });
  }

  // Mejor esfuerzo: limpia los archivos del usuario en Storage antes de
  // borrar la cuenta. Si algo falla aquí no bloqueamos la eliminación de
  // la cuenta (el objetivo principal para el usuario y para cumplir con
  // las políticas de las tiendas es borrar sus datos personales/perfil).
  for (const bucket of BUCKETS) {
    try {
      const { data: archivos } = await admin.storage.from(bucket).list(user.id);
      if (archivos && archivos.length > 0) {
        const rutas = archivos.map((archivo) => `${user.id}/${archivo.name}`);
        await admin.storage.from(bucket).remove(rutas);
      }
    } catch (error) {
      console.warn(`No se pudieron limpiar los archivos de ${bucket} para ${user.id}`, error);
    }
  }

  // Borra al usuario de auth.users. La fila en `perfiles` tiene
  // `on delete cascade`, que a su vez arrastra `emprendimientos`,
  // `productos` y `pagos` (ver supabase/migrations/0001_init.sql).
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
