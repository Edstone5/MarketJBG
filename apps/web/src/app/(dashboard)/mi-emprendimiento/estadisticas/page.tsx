import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Download } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { GraficoBarras } from '@/components/GraficoBarras';
import { createClient } from '@/lib/supabase/server';
import {
  estadoEfectivo,
  etiquetaHora,
  formatearDia,
  PERIODOS_ESTADISTICAS,
  periodoEstadisticas,
  tasaDeContacto,
  totalVisitas,
  type Estadisticas,
} from '@emprende/core';
import { obtenerEstadisticas, obtenerMiEmprendimiento } from '@emprende/db';

export const metadata: Metadata = { title: 'Estadísticas' };

const plural = (n: number, singular: string, pluralTexto: string) => `${n} ${n === 1 ? singular : pluralTexto}`;

/** RF09: visitas, hora de mayor actividad y publicaciones más vistas del emprendimiento. */
export default async function EstadisticasPage({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string | string[] }>;
}) {
  const periodo = periodoEstadisticas((await searchParams).dias);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/mi-emprendimiento/estadisticas');

  const emprendimiento = await obtenerMiEmprendimiento(supabase, user.id);
  if (!emprendimiento) redirect('/mi-emprendimiento');
  const estado = estadoEfectivo(emprendimiento.estado, emprendimiento.activo_hasta);

  let estadisticas: Estadisticas | null = null;
  try {
    estadisticas = await obtenerEstadisticas(supabase, emprendimiento.id, periodo);
  } catch (error) {
    console.error('No se pudieron cargar las estadísticas', error);
  }

  const total = estadisticas ? totalVisitas(estadisticas) : 0;
  const sinActividad = estadisticas !== null && total === 0 && estadisticas.contactos === 0;

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link href="/mi-emprendimiento" className="text-sm text-primary-700 hover:underline">
              ← Mi emprendimiento
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-neutral-900">Estadísticas</h1>
            <p className="text-sm text-neutral-500">
              {emprendimiento.nombre}
              {estadisticas && (
                <>
                  {' '}
                  · del {formatearDia(estadisticas.desde)} al {formatearDia(estadisticas.hasta)}
                </>
              )}
            </p>
          </div>
          {estadisticas && (
            <a
              href={`/api/reporte?dias=${periodo}`}
              className="flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              <Download className="h-4 w-4" aria-hidden />
              Descargar reporte (CSV)
            </a>
          )}
        </div>

        <nav aria-label="Periodo" className="mb-6 flex flex-wrap gap-2">
          {PERIODOS_ESTADISTICAS.map((dias) => (
            <Link
              key={dias}
              href={`/mi-emprendimiento/estadisticas?dias=${dias}`}
              aria-current={dias === periodo ? 'page' : undefined}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
                dias === periodo
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-neutral-300 text-neutral-700 hover:border-primary-500'
              }`}
            >
              Últimos {dias} días
            </Link>
          ))}
        </nav>

        {!estadisticas ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            No se pudieron cargar las estadísticas. Inténtalo de nuevo en unos minutos.
          </p>
        ) : (
          <>
            {estado !== 'activo' && (
              <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Las visitas solo se cuentan mientras tu emprendimiento es visible en el catálogo (con la
                suscripción vigente).
              </p>
            )}

            <section aria-label="Resumen" className="mb-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
                <p className="text-sm text-neutral-500">Visitas</p>
                <p className="text-3xl font-bold text-neutral-900">{total}</p>
                <p className="text-xs text-neutral-500">
                  {estadisticas.visitas_perfil} al perfil · {estadisticas.visitas_productos} a publicaciones
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
                <p className="text-sm text-neutral-500">Clics en WhatsApp</p>
                <p className="text-3xl font-bold text-neutral-900">{estadisticas.contactos}</p>
                <p className="text-xs text-neutral-500">
                  {estadisticas.visitas_productos > 0
                    ? `${tasaDeContacto(estadisticas)} % de las visitas a publicaciones`
                    : 'Aún sin visitas a publicaciones'}
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
                <p className="text-sm text-neutral-500">Hora de mayor actividad</p>
                <p className="text-3xl font-bold text-neutral-900">
                  {estadisticas.hora_pico === null ? '—' : etiquetaHora(estadisticas.hora_pico).split(' – ')[0]}
                </p>
                <p className="text-xs text-neutral-500">
                  {estadisticas.hora_pico === null
                    ? 'Aún sin visitas'
                    : `de ${etiquetaHora(estadisticas.hora_pico)} (hora de Perú)`}
                </p>
              </div>
            </section>

            {sinActividad ? (
              <p className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
                Todavía no hay visitas en este periodo. Cuando alguien abra tu perfil o una de tus
                publicaciones, o toque «Contactar por WhatsApp», lo verás aquí.
              </p>
            ) : (
              <div className="flex flex-col gap-6">
                <section className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
                  <h2 className="mb-3 text-lg font-semibold text-neutral-900">Visitas por día</h2>
                  <GraficoBarras
                    descripcion={`Visitas por día en los últimos ${estadisticas.dias} días: ${total} en total.`}
                    etiquetaInicio={formatearDia(estadisticas.desde)}
                    etiquetaFin={formatearDia(estadisticas.hasta)}
                    barras={estadisticas.por_dia.map((dia) => ({
                      clave: dia.dia,
                      valor: dia.visitas,
                      titulo: `${formatearDia(dia.dia)}: ${plural(dia.visitas, 'visita', 'visitas')}, ${plural(dia.contactos, 'clic', 'clics')} en WhatsApp`,
                    }))}
                  />
                </section>

                <section className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
                  <h2 className="mb-1 text-lg font-semibold text-neutral-900">Visitas por hora del día</h2>
                  <p className="mb-3 text-sm text-neutral-500">
                    Suma de todo el periodo, en hora de Perú. La hora más alta va resaltada.
                  </p>
                  <GraficoBarras
                    descripcion={
                      estadisticas.hora_pico === null
                        ? 'Visitas por hora del día: sin visitas.'
                        : `Visitas por hora del día: la hora de mayor actividad es ${etiquetaHora(estadisticas.hora_pico)}.`
                    }
                    etiquetaInicio="00:00"
                    etiquetaFin="23:00"
                    barras={estadisticas.por_hora.map((hora) => ({
                      clave: String(hora.hora),
                      valor: hora.visitas,
                      titulo: `${etiquetaHora(hora.hora)}: ${plural(hora.visitas, 'visita', 'visitas')}`,
                      destacada: hora.hora === estadisticas.hora_pico,
                    }))}
                  />
                </section>

                <section className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
                  <h2 className="mb-3 text-lg font-semibold text-neutral-900">Publicaciones más vistas</h2>
                  {estadisticas.productos.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-neutral-200 text-neutral-500">
                            <th className="py-2 pr-3 font-medium">#</th>
                            <th className="py-2 pr-3 font-medium">Publicación</th>
                            <th className="py-2 pr-3 text-right font-medium">Visitas</th>
                            <th className="py-2 text-right font-medium">Clics en WhatsApp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {estadisticas.productos.map((producto, indice) => (
                            <tr key={producto.producto_id} className="border-b border-neutral-100 last:border-0">
                              <td className="py-2 pr-3 text-neutral-500">{indice + 1}</td>
                              <td className="py-2 pr-3 font-medium text-neutral-900">{producto.nombre}</td>
                              <td className="py-2 pr-3 text-right">{producto.visitas}</td>
                              <td className="py-2 text-right">{producto.contactos}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-500">
                      Todavía nadie abrió tus publicaciones en este periodo.
                    </p>
                  )}
                </section>
              </div>
            )}

            <p className="mt-6 text-xs text-neutral-500">
              No se cuentan tus propias visitas. Si la misma persona vuelve a abrir lo mismo antes de 30
              minutos, cuenta una sola vez.
            </p>
          </>
        )}
      </main>
    </>
  );
}
