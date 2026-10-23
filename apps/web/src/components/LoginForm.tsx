'use client';

import { iniciarSesion, type EstadoFormulario } from '@/lib/actions/auth';
import { useAccion } from '@/lib/useAccion';

const estadoInicial: EstadoFormulario = {};

/** `next`: ruta interna a la que volver tras iniciar sesión (ya validada por la página). */
export function LoginForm({ next }: { next: string }) {
  const [estado, propsFormulario, enviando] = useAccion(iniciarSesion, estadoInicial);

  return (
    <form {...propsFormulario} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-neutral-700">
          Correo institucional
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tunombre@unjbg.edu.pe"
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-neutral-700">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      {estado.error && (
        <p role="alert" className="text-sm text-red-600">
          {estado.error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="rounded-full bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
      >
        {enviando ? 'Ingresando…' : 'Ingresar'}
      </button>
    </form>
  );
}
