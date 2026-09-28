import Link from 'next/link';
import {
  Book,
  Cake,
  GraduationCap,
  LayoutGrid,
  Laptop,
  Palette,
  Printer,
  Shapes,
  Shirt,
  Sparkles,
  Utensils,
  type LucideIcon,
} from 'lucide-react';
import { CATEGORIAS } from '@emprende/core';

const ICONOS: Record<string, LucideIcon> = {
  utensils: Utensils,
  cake: Cake,
  shirt: Shirt,
  laptop: Laptop,
  book: Book,
  'graduation-cap': GraduationCap,
  printer: Printer,
  sparkles: Sparkles,
  palette: Palette,
  shapes: Shapes,
};

function Chip({
  href,
  icon: Icon,
  label,
  activa,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  activa: boolean;
}) {
  return (
    <Link href={href} className="flex shrink-0 flex-col items-center gap-1.5">
      <span
        className={`flex h-16 w-16 items-center justify-center rounded-full border-2 transition-colors ${
          activa
            ? 'border-primary-600 bg-primary-600 text-white'
            : 'border-transparent bg-primary-50 text-primary-700 hover:border-primary-300'
        }`}
      >
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <span
        className={`max-w-[72px] text-center text-xs font-medium leading-tight ${
          activa ? 'text-primary-700' : 'text-neutral-600'
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

export function CategoryChips({ activa }: { activa?: string }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none]">
      <Chip href="/catalogo" icon={LayoutGrid} label="Todo" activa={!activa} />
      {CATEGORIAS.map((categoria) => (
        <Chip
          key={categoria.slug}
          href={`/catalogo?categoria=${categoria.slug}`}
          icon={ICONOS[categoria.icono] ?? Shapes}
          label={categoria.nombre}
          activa={activa === categoria.slug}
        />
      ))}
    </div>
  );
}
