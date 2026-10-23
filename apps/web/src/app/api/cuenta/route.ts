import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const BUCKETS = ['logos', 'productos', 'comprobantes'] as const;

type ClienteAdmin = ReturnType<typeof createAdminClient>;

/**
 * Borra todo lo que hay en la carpeta del usuario. `list` devuelve como mucho
 * 100 archivos por llamada, así que se repite hasta dejarla vacía.
 */
async function vaciarCarpeta(admin: ClienteAdmin, bucket: string, carpeta: string): Promise<boolean> {
  for (let vuelta = 0; vuelta < 100; vuelta++) {
    const { data, error } = await admin.storage.from(bucket).list(carpeta, { limit: 100 });
    if (error) return false;
    if (!data || data.length === 0) return true;

    const { error: errorBorrado } = await admin.storage
      .from(bucket)
      .remove(data.map((archivo) => `${carpeta}/${archivo.name}`));
    if (errorBorrado) return false;
  }
  return false;
}

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

  // Limpia los archivos del usuario en Storage antes de borrar la cuenta. Si
  // algo falla no bloqueamos la eliminación (borrar la cuenta y sus datos
  // personales es lo principal, y lo exigen las tiendas), pero se registra y
  // se avisa en la respuesta para no dar por borrado lo que no lo está.
  let archivosPendientes = false;
  for (const bucket of BUCKETS) {
    if (!(await vaciarCarpeta(admin, bucket, user.id))) {
      archivosPendientes = true;
      console.error(`No se pudieron borrar todos los archivos de ${bucket} para ${user.id}`);
    }
  }

  // Borra al usuario de auth.users. La fila en `perfiles` tiene
  // `on delete cascade`, que a su vez arrastra `emprendimientos`,
  // `productos` y `pagos` (ver supabase/migrations/0001_init.sql).
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error(`No se pudo eliminar la cuenta ${user.id}`, deleteError);
    return NextResponse.json({ error: 'No se pudo eliminar la cuenta. Inténtalo de nuevo.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, archivosPendientes });
}
