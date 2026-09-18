'use client';

import { useActionState } from 'react';
import { CATEGORIAS } from '@emprende/core';
import { crearEmprendimientoAction } from '@/lib/actions/emprendimiento';
import type { EstadoFormulario } from '@/lib/actions/auth';

const estadoInicial: EstadoFormulario = {};

export function EmprendimientoForm() {
  const [estado, accion, enviando] = useActionState(crearEmprendimientoAction, estadoInicial);

  return (
    <form action={accion} className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="nombre" className="text-sm font-medium text-neutral-700">
          Nombre del emprendimiento
        </label>
        <input
          id="nombre"
          name="nombre"
          required
          minLength={2}
          maxLength={80}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="descripcion" className="text-sm font-medium text-neutral-700">
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          required
          minLength={10}
          maxLength={600}
          rows={4}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="categoriaSlug" className="text-sm font-medium text-neutral-700">
          Categoría principal
        </label>
        <select
          id="categoriaSlug"
          name="categoriaSlug"
          required
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        >
          {CATEGORIAS.map((categoria) => (
            <option key={categoria.slug} value={categoria.slug}>
              {categoria.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="whatsapp" className="text-sm font-medium text-neutral-700">
          WhatsApp de contacto
        </label>
        <input
          id="whatsapp"
          name="whatsapp"
          required
          placeholder="+51 9XXXXXXXX"
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      {estado.error && <p className="text-sm text-red-600">{estado.error}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="rounded-full bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
      >
        {enviando ? 'Creando…' : 'Crear mi emprendimiento'}
      </button>
    </form>
  );
}
