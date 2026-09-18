'use client';

import { useActionState, useState } from 'react';
import { CATEGORIAS, TIPOS_PRODUCTO, ETIQUETAS_TIPO_PRODUCTO } from '@emprende/core';
import { crearProductoAction } from '@/lib/actions/emprendimiento';
import { ImageUploader } from '@/components/ImageUploader';
import type { EstadoFormulario } from '@/lib/actions/auth';

const estadoInicial: EstadoFormulario = {};

export function ProductoForm({ emprendimientoId }: { emprendimientoId: string }) {
  const accionConId = crearProductoAction.bind(null, emprendimientoId);
  const [estado, accion, enviando] = useActionState(accionConId, estadoInicial);
  const [tipo, setTipo] = useState<(typeof TIPOS_PRODUCTO)[number]>('producto');

  return (
    <form action={accion} className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">¿Qué vas a publicar?</span>
        <div className="flex gap-2">
          {TIPOS_PRODUCTO.map((valor) => (
            <label
              key={valor}
              className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-center text-sm font-medium ${
                tipo === valor
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-neutral-300 text-neutral-600'
              }`}
            >
              <input
                type="radio"
                name="tipo"
                value={valor}
                checked={tipo === valor}
                onChange={() => setTipo(valor)}
                className="sr-only"
              />
              {ETIQUETAS_TIPO_PRODUCTO[valor]}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="nombre" className="text-sm font-medium text-neutral-700">
          Nombre del {tipo === 'servicio' ? 'servicio' : 'producto'}
        </label>
        <input
          id="nombre"
          name="nombre"
          required
          minLength={2}
          maxLength={100}
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
          minLength={5}
          maxLength={1000}
          rows={4}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="precio" className="text-sm font-medium text-neutral-700">
            Precio (S/)
          </label>
          <input
            id="precio"
            name="precio"
            type="number"
            step="0.10"
            min="0.10"
            required
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="categoriaSlug" className="text-sm font-medium text-neutral-700">
            Categoría
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
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">
          Fotos (opcional, hasta 6){tipo === 'servicio' && ' — por ejemplo, trabajos anteriores'}
        </span>
        <ImageUploader bucket="productos" name="imagenes" multiple maxFiles={6} />
      </div>

      {estado.error && <p className="text-sm text-red-600">{estado.error}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="rounded-full bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
      >
        {enviando ? 'Publicando…' : `Publicar ${tipo === 'servicio' ? 'servicio' : 'producto'}`}
      </button>
    </form>
  );
}
