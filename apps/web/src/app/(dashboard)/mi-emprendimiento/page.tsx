import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { EmprendimientoForm } from '@/components/EmprendimientoForm';
import { createClient } from '@/lib/supabase/server';
import { obtenerMiEmprendimiento } from '@emprende/db';

const ETIQUETAS_ESTADO: Record<string, { texto: string; clase: string }> = {
  activo: { texto: 'Activo', clase: 'bg-green-100 text-green-700' },
  pendiente: { texto: 'Pendiente de pago', clase: 'bg-amber-100 text-amber-700' },
  vencido: { texto: 'Suscripción vencida', clase: 'bg-red-100 text-red-700' },
  suspendido: { texto: 'Suspendido', clase: 'bg-neutral-200 text-neutral-700' },
};

export default async function MiEmprendimientoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/mi-emprendimiento');

  const emprendimiento = await obtenerMiEmprendimiento(supabase, user.id);

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        {!emprendimiento ? (
          <>
            <h1 className="mb-1 text-2xl font-bold text-neutral-900">
              Crea tu perfil comercial
            </h1>
            <p className="mb-6 text-sm text-neutral-500">
              Este será el perfil público de tu negocio en el catálogo. Podrás publicar
              productos después de crearlo.
            </p>
            <EmprendimientoForm />
          </>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">{emprendimiento.nombre}</h1>
                <span
                  className={`mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-medium ${
                    ETIQUETAS_ESTADO[emprendimiento.estado]?.clase ?? ''
                  }`}
                >
                  {ETIQUETAS_ESTADO[emprendimiento.estado]?.texto ?? emprendimiento.estado}
                </span>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/mi-cuenta"
                  className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium hover:border-primary-500"
                >
                  Mi cuenta
                </Link>
                <Link
                  href="/mi-emprendimiento/suscripcion"
                  className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium hover:border-primary-500"
                >
                  Suscripción
                </Link>
                <Link
                  href="/mi-emprendimiento/productos/nuevo"
                  className="flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  <PlusCircle className="h-4 w-4" aria-hidden />
                  Nuevo producto
                </Link>
              </div>
            </div>

            {emprendimiento.estado !== 'activo' && (
              <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Tu emprendimiento aún no aparece en el catálogo público. Reporta tu pago de
                suscripción por Yape en la sección{' '}
                <Link href="/mi-emprendimiento/suscripcion" className="font-semibold underline">
                  Suscripción
                </Link>{' '}
                para activarlo.
              </p>
            )}

            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              Mis productos ({emprendimiento.productos?.length ?? 0})
            </h2>
            {emprendimiento.productos && emprendimiento.productos.length > 0 ? (
              <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-200">
                {emprendimiento.productos.map((producto) => (
                  <li key={producto.id} className="flex items-center justify-between p-3">
                    <span className="text-sm font-medium text-neutral-900">
                      {producto.nombre}
                    </span>
                    <span className="text-sm text-neutral-500">S/ {producto.precio}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
                Todavía no publicaste productos.
              </p>
            )}
          </>
        )}
      </main>
    </>
  );
}
