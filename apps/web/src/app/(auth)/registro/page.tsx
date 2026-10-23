'use client';

import Link from 'next/link';
import { registrarse, type EstadoFormulario } from '@/lib/actions/auth';
import { useAccion } from '@/lib/useAccion';
import { DOMINIO_INSTITUCIONAL } from '@emprende/core';

const estadoInicial: EstadoFormulario = {};

export default function RegistroPage() {
  const [estado, propsFormulario, enviando] = useAccion(registrarse, estadoInicial);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-neutral-900">Crea tu cuenta</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Exclusivo para correos {DOMINIO_INSTITUCIONAL}
        </p>
      </div>

      <form {...propsFormulario} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="nombreCompleto" className="text-sm font-medium text-neutral-700">
            Nombre completo
          </label>
          <input
            id="nombreCompleto"
            name="nombreCompleto"
            type="text"
            required
            minLength={3}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
        </div>

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
            placeholder={`tunombre${DOMINIO_INSTITUCIONAL}`}
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
            minLength={8}
            autoComplete="new-password"
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
          {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>

      <p className="text-center text-sm text-neutral-500">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="font-medium text-primary-700">
          Ingresa
        </Link>
      </p>
    </main>
  );
}
