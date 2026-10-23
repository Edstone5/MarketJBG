import { redirect } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { PagoForm } from '@/components/PagoForm';
import { createClient } from '@/lib/supabase/server';
import { obtenerMiEmprendimiento } from '@emprende/db';
import {
  estadoEfectivo,
  ETIQUETAS_ESTADO_PAGO,
  formatearFecha,
  PRECIO_SUSCRIPCION_MENSUAL,
} from '@emprende/core';

export default async function SuscripcionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/mi-emprendimiento/suscripcion');

  const emprendimiento = await obtenerMiEmprendimiento(supabase, user.id);
  if (!emprendimiento) redirect('/mi-emprendimiento');

  const estado = estadoEfectivo(emprendimiento.estado, emprendimiento.activo_hasta);
  const pagos = [...(emprendimiento.pagos ?? [])].sort((a, b) => b.creado_en.localeCompare(a.creado_en));

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold text-neutral-900">Suscripción mensual</h1>
        <p className="mb-6 text-sm text-neutral-500">
          Tu emprendimiento aparece en el catálogo público mientras la suscripción esté vigente.
          El costo es de <strong>S/ {PRECIO_SUSCRIPCION_MENSUAL}</strong> al mes, pagado por Yape
          y validado manualmente por un administrador (usualmente en menos de 24 horas).
        </p>

        <div className="mb-8 rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-2 text-sm font-semibold text-neutral-900">Estado</h2>
          <p className="text-sm text-neutral-700">
            {estado === 'activo' &&
              `Vigente hasta el ${formatearFecha(emprendimiento.activo_hasta)}. Si pagas antes, el nuevo mes se suma al final.`}
            {estado === 'pendiente' && 'Aún no tienes una suscripción validada.'}
            {estado === 'vencido' && 'Tu suscripción venció. Reporta un nuevo pago para volver al catálogo.'}
            {estado === 'suspendido' && 'Tu emprendimiento está suspendido. Escríbenos para revisar tu caso.'}
          </p>
        </div>

        <div className="mb-8 rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-2 text-sm font-semibold text-neutral-900">Historial de pagos</h2>
          {pagos.length > 0 ? (
            <ul className="divide-y divide-neutral-100 text-sm">
              {pagos.map((pago) => (
                <li key={pago.id} className="flex items-center justify-between gap-3 py-2">
                  <span>S/ {pago.monto_reportado}</span>
                  <span className="text-neutral-500">{formatearFecha(pago.creado_en)}</span>
                  <span className="font-medium">
                    {ETIQUETAS_ESTADO_PAGO[pago.estado] ?? pago.estado}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500">Aún no reportaste ningún pago.</p>
          )}
        </div>

        {estado !== 'suspendido' && (
          <>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">Reportar nuevo pago</h2>
            <PagoForm emprendimientoId={emprendimiento.id} />
          </>
        )}
      </main>
    </>
  );
}
