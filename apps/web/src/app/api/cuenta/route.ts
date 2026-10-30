import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@emprende/db';
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
 *
 * Además exige reconfirmar la contraseña (`{ "password": "…" }` en el cuerpo):
 * un token robado o una sesión que alguien dejó abierta no bastan para borrar
 * la cuenta. La contraseña se comprueba aquí, en el servidor.
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

  const cuerpo = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof cuerpo?.password === 'string' ? cuerpo.password : '';
  if (!password) {
    return NextResponse.json({ error: 'Escribe tu contraseña para confirmar.' }, { status: 400 });
  }
  if (!user.email) {
    return NextResponse.json({ error: 'Tu cuenta no tiene correo con el que confirmar.' }, { status: 400 });
  }

  // Cliente aparte, sin guardar la sesión que crea al comprobar la contraseña.
  const verificador = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { error: errorClave } = await verificador.auth.signInWithPassword({ email: user.email, password });
  if (errorClave) {
    // 400 = credenciales inválidas; cualquier otro estado (límite de intentos, caída) no es culpa de la contraseña.
    const esClaveIncorrecta = errorClave.status === 400;
    return NextResponse.json(
      {
        error: esClaveIncorrecta
          ? 'La contraseña no es correcta.'
          : 'No se pudo comprobar la contraseña. Inténtalo de nuevo en un momento.',
      },
      { status: esClaveIncorrecta ? 403 : 503 },
    );
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
