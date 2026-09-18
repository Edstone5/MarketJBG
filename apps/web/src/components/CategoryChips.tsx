import Link from 'next/link';
import { CATEGORIAS } from '@emprende/core';

export function CategoryChips({ activa }: { activa?: string }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
      <Link
        href="/catalogo"
        className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
          !activa
            ? 'border-primary-600 bg-primary-600 text-white'
            : 'border-neutral-300 text-neutral-700 hover:border-primary-500'
        }`}
      >
        Todo
      </Link>
      {CATEGORIAS.map((categoria) => (
        <Link
          key={categoria.slug}
          href={`/catalogo?categoria=${categoria.slug}`}
          className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
            activa === categoria.slug
              ? 'border-primary-600 bg-primary-600 text-white'
              : 'border-neutral-300 text-neutral-700 hover:border-primary-500'
          }`}
        >
          {categoria.nombre}
        </Link>
      ))}
    </div>
  );
}
