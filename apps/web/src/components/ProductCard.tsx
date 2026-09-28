import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, Wrench } from 'lucide-react';
import type { TipoProducto } from '@emprende/db';

export interface ProductoCatalogo {
  id: string;
  tipo: TipoProducto;
  nombre: string;
  precio: number;
  imagenes: string[];
  emprendimiento: {
    id: string;
    nombre: string;
    logo_url: string | null;
  } | null;
}

const formatoPEN = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
});

export function ProductCard({ producto }: { producto: ProductoCatalogo }) {
  const imagen = producto.imagenes[0];
  const esServicio = producto.tipo === 'servicio';

  return (
    <Link
      href={`/catalogo/${producto.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
        {imagen ? (
          <Image
            src={imagen}
            alt={producto.nombre}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-neutral-400">
            {esServicio && <Wrench className="h-5 w-5" aria-hidden />}
            <span className="text-sm">{esServicio ? 'Servicio' : 'Sin foto'}</span>
          </div>
        )}
        {esServicio && (
          <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-medium text-primary-700 shadow-sm">
            Servicio
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <p className="line-clamp-2 text-sm font-medium text-neutral-900">{producto.nombre}</p>
        <p className="inline-flex w-fit items-baseline rounded-full bg-accent-50 px-2 py-0.5 text-base font-bold text-accent-600">
          {formatoPEN.format(producto.precio)}
        </p>
        {producto.emprendimiento && (
          <div className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
            <BadgeCheck className="h-3.5 w-3.5 text-primary-500" aria-hidden />
            <span className="line-clamp-1">{producto.emprendimiento.nombre}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
