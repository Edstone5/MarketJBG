'use client';

import { CATEGORIAS } from '@emprende/core';
import Link from 'next/link';
import { useAccion } from '@/lib/useAccion';
import { crearEmprendimientoAction, editarEmprendimientoAction } from '@/lib/actions/emprendimiento';
import type { EstadoFormulario } from '@/lib/actions/auth';

const estadoInicial: EstadoFormulario = {};

/** Datos de un emprendimiento ya creado; con ellos el formulario pasa a modo «editar». */
export interface EmprendimientoEditable {
  id: string;
  nombre: string;
  descripcion: string;
  categoria_slug: string;
  whatsapp: string;
}

export function EmprendimientoForm({ emprendimiento }: { emprendimiento?: EmprendimientoEditable }) {
  const editando = Boolean(emprendimiento);
  const accion = emprendimiento
    ? editarEmprendimientoAction.bind(null, emprendimiento.id)
    : crearEmprendimientoAction;
  const [estado, propsFormulario, enviando] = useAccion(accion, estadoInicial);

  return (
    <form {...propsFormulario} className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="nombre" className="text-sm font-medium text-neutral-700">
          Nombre del emprendimiento
        </label>
        <input
          id="nombre"
          name="nombre"
          defaultValue={emprendimiento?.nombre}
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
          defaultValue={emprendimiento?.descripcion}
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
          defaultValue={emprendimiento?.categoria_slug}
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
          defaultValue={emprendimiento?.whatsapp}
          required
          placeholder="+51 9XXXXXXXX"
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      {estado.error && (
        <p role="alert" className="text-sm text-red-600">
          {estado.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-full bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {editando
            ? enviando
              ? 'Guardando…'
              : 'Guardar cambios'
            : enviando
              ? 'Creando…'
              : 'Crear mi emprendimiento'}
        </button>
        {editando && (
          <Link
            href="/mi-emprendimiento"
            className="rounded-full border border-neutral-300 px-4 py-2.5 text-sm font-medium hover:border-primary-500"
          >
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
