import { redirect } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { EliminarCuentaBoton } from '@/components/EliminarCuentaBoton';
import { createClient } from '@/lib/supabase/server';
import { cerrarSesion } from '@/lib/actions/auth';

export default async function MiCuentaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/mi-cuenta');

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-neutral-900">Mi cuenta</h1>

        <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">Correo institucional</p>
          <p className="text-base font-medium text-neutral-900">{user.email}</p>
        </div>

        <form action={cerrarSesion} className="mb-8">
          <button
            type="submit"
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium hover:border-primary-500"
          >
            Cerrar sesión
          </button>
        </form>

        <div className="rounded-xl border border-red-200 p-4">
          <h2 className="mb-1 text-sm font-semibold text-neutral-900">Zona de peligro</h2>
          <p className="mb-3 text-sm text-neutral-500">
            Eliminar tu cuenta borra tu perfil, tu emprendimiento, tus productos y tu historial
            de pagos. Consulta la{' '}
            <a href="/privacidad" className="text-primary-700 underline">
              Política de Privacidad
            </a>{' '}
            para más detalles.
          </p>
          <EliminarCuentaBoton />
        </div>
      </main>
    </>
  );
}
