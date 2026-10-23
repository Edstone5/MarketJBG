'use client';

import { useActionState } from 'react';
import { validarPagoAction } from '@/lib/actions/admin';
import type { EstadoFormulario } from '@/lib/actions/auth';

const estadoInicial: EstadoFormulario = {};

export function ValidarPagoBoton({ pagoId }: { pagoId: string }) {
  const [estado, accion, validando] = useActionState(validarPagoAction, estadoInicial);

  return (
    <form action={accion} className="flex flex-col items-end gap-1">
      <input type="hidden" name="pagoId" value={pagoId} />
      <button
        type="submit"
        disabled={validando}
        className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
      >
        {validando ? 'Validando…' : 'Validar pago'}
      </button>
      {estado.error && (
        <p role="alert" className="max-w-xs text-right text-xs text-red-600">
          {estado.error}
        </p>
      )}
    </form>
  );
}
