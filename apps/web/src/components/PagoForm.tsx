'use client';

import { PRECIO_SUSCRIPCION_MENSUAL } from '@emprende/core';
import { reportarPagoAction } from '@/lib/actions/emprendimiento';
import { ImageUploader } from '@/components/ImageUploader';
import type { EstadoFormulario } from '@/lib/actions/auth';
import { useAccion } from '@/lib/useAccion';

const estadoInicial: EstadoFormulario = {};

export function PagoForm({ emprendimientoId }: { emprendimientoId: string }) {
  const accionConId = reportarPagoAction.bind(null, emprendimientoId);
  const [estado, propsFormulario, enviando, version] = useAccion(accionConId, estadoInicial);

  return (
    <form key={version} {...propsFormulario} className="flex max-w-md flex-col gap-4">
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

      {estado.error && (
        <p role="alert" className="text-sm text-red-600">
          {estado.error}
        </p>
      )}
      {estado.mensaje && (
        <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {estado.mensaje}
        </p>
      )}

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
