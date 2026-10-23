'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { alternarDisponibilidadAction, eliminarProductoAction } from '@/lib/actions/emprendimiento';
import type { EstadoFormulario } from '@/lib/actions/auth';

const estadoInicial: EstadoFormulario = {};

/** Editar, ocultar/mostrar y eliminar una publicación del panel del emprendedor. */
export function ProductoAcciones({
  producto,
}: {
  producto: { id: string; nombre: string; disponible: boolean };
}) {
  const [estadoVisibilidad, cambiarVisibilidad, cambiando] = useActionState(alternarDisponibilidadAction, estadoInicial);
  const [estadoBorrado, borrar, borrando] = useActionState(eliminarProductoAction, estadoInicial);
  const [confirmando, setConfirmando] = useState(false);
  const error = estadoVisibilidad.error ?? estadoBorrado.error;

  const boton =
    'rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-700 hover:border-primary-500 disabled:opacity-60';

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link href={`/mi-emprendimiento/productos/${producto.id}/editar`} className={boton}>
          Editar
        </Link>

        <form action={cambiarVisibilidad}>
          <input type="hidden" name="productoId" value={producto.id} />
          <input type="hidden" name="disponible" value={String(!producto.disponible)} />
          <button type="submit" disabled={cambiando} className={boton}>
            {producto.disponible ? 'Ocultar' : 'Mostrar'}
          </button>
        </form>

        {confirmando ? (
          <form action={borrar} className="flex items-center gap-2">
            <input type="hidden" name="productoId" value={producto.id} />
            <span className="text-xs text-neutral-600">¿Eliminar «{producto.nombre}»?</span>
            <button
              type="submit"
              disabled={borrando}
              className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {borrando ? 'Eliminando…' : 'Sí, eliminar'}
            </button>
            <button type="button" onClick={() => setConfirmando(false)} className={boton}>
              No
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
          >
            Eliminar
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="max-w-xs text-right text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
