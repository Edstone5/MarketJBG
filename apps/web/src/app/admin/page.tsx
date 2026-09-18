import { redirect } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { createClient } from '@/lib/supabase/server';
import { listarPagosPendientes } from '@emprende/db';
import { revisarPagoAction, urlFirmadaComprobante } from '@/lib/actions/admin';

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin');

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();
  if (perfil?.rol !== 'admin') redirect('/');

  const pagos = await listarPagosPendientes(supabase);

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-neutral-900">
          Pagos pendientes de revisión ({pagos.length})
        </h1>

        <div className="flex flex-col gap-4">
          {pagos.length === 0 && (
            <p className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
              No hay pagos pendientes.
            </p>
          )}

          {await Promise.all(
            pagos.map(async (pago) => {
              const urlComprobante = await urlFirmadaComprobante(pago.comprobante_url);
              const emprendimiento = pago.emprendimiento as unknown as {
                id: string;
                nombre: string;
              } | null;

              return (
                <div
                  key={pago.id}
                  className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-neutral-900">
                      {emprendimiento?.nombre ?? 'Emprendimiento'}
                    </p>
                    <p className="text-sm text-neutral-500">
                      S/ {pago.monto_reportado} ·{' '}
                      {new Date(pago.creado_en).toLocaleDateString('es-PE')}
                    </p>
                    {urlComprobante && (
                      <a
                        href={urlComprobante}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-primary-700 underline"
                      >
                        Ver comprobante
                      </a>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <form action={revisarPagoAction}>
                      <input type="hidden" name="pagoId" value={pago.id} />
                      <input type="hidden" name="aprobar" value="true" />
                      <button
                        type="submit"
                        className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                      >
                        Aprobar
                      </button>
                    </form>
                    <form action={revisarPagoAction}>
                      <input type="hidden" name="pagoId" value={pago.id} />
                      <input type="hidden" name="aprobar" value="false" />
                      <button
                        type="submit"
                        className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                      >
                        Rechazar
                      </button>
                    </form>
                  </div>
                </div>
              );
            }),
          )}
        </div>
      </main>
    </>
  );
}
