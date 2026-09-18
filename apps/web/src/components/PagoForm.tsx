'use client';

import { useActionState } from 'react';
import { PRECIO_SUSCRIPCION_MENSUAL } from '@emprende/core';
import { reportarPagoAction } from '@/lib/actions/emprendimiento';
import { ImageUploader } from '@/components/ImageUploader';
import type { EstadoFormulario } from '@/lib/actions/auth';

const estadoInicial: EstadoFormulario = {};

export function PagoForm({ emprendimientoId }: { emprendimientoId: string }) {
  const accionConId = reportarPagoAction.bind(null, emprendimientoId);
  const [estado, accion, enviando] = useActionState(accionConId, estadoInicial);

  return (
    <form action={accion} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="montoReportado" className="text-sm font-medium text-neutral-700">
          Monto pagado (S/)
        </label>
        <input
          id="montoReportado"
          name="montoReportado"
          type="number"
          step="0.10"
          min="0.10"
          defaultValue={PRECIO_SUSCRIPCION_MENSUAL}
          required
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">Captura del comprobante Yape</span>
        <ImageUploader bucket="comprobantes" name="comprobanteUrl" maxFiles={1} />
      </div>

      {estado.error && <p className="text-sm text-red-600">{estado.error}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="rounded-full bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
      >
        {enviando ? 'Enviando…' : 'Reportar pago'}
      </button>
    </form>
  );
}
