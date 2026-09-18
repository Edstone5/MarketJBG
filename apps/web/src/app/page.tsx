import Link from 'next/link';
import { ArrowRight, ShieldCheck, Smartphone, Sparkles } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { SearchBar } from '@/components/SearchBar';
import { CategoryChips } from '@/components/CategoryChips';
import { ProductCard, type ProductoCatalogo } from '@/components/ProductCard';
import { createClient } from '@/lib/supabase/server';
import { listarProductosCatalogo } from '@emprende/db';

export default async function HomePage() {
  const supabase = await createClient();
  let productos: ProductoCatalogo[] = [];

  try {
    const data = await listarProductosCatalogo(supabase, { ordenarPor: 'recientes' });
    productos = (data ?? []).slice(0, 8) as unknown as ProductoCatalogo[];
  } catch {
    // Supabase aún no está configurado en este entorno: la página igual
    // debe renderizar el resto del catálogo vacío en vez de romperse.
    productos = [];
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-8">
        <section className="flex flex-col items-center gap-6 rounded-2xl bg-gradient-to-br from-primary-700 to-primary-900 px-6 py-14 text-center text-white">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Exclusivo para la comunidad UNJBG
          </span>
          <h1 className="max-w-2xl text-3xl font-bold sm:text-4xl">
            El catálogo de emprendimientos de la UNJBG
          </h1>
          <p className="max-w-xl text-primary-100">
            Descubre comida, servicios, moda y tecnología hechos por estudiantes verificados de
            la Universidad Nacional Jorge Basadre Grohmann. Compra con confianza, apoya a tu
            comunidad.
          </p>
          <div className="w-full max-w-md">
            <SearchBar />
          </div>
          <Link
            href="/mi-emprendimiento"
            className="inline-flex items-center gap-1.5 rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-primary-950 hover:bg-accent-400"
          >
            Publica tu emprendimiento
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              titulo: 'Estudiantes verificados',
              texto: 'Cada perfil se crea con correo institucional @unjbg.edu.pe.',
            },
            {
              icon: Smartphone,
              titulo: 'Contacto directo',
              texto: 'Coordina la compra por WhatsApp directamente con el vendedor.',
            },
            {
              icon: Sparkles,
              titulo: 'Sin comisiones por venta',
              texto: 'Solo una micro-suscripción mensual validada por Yape.',
            },
          ].map(({ icon: Icon, titulo, texto }) => (
            <div key={titulo} className="rounded-xl border border-neutral-200 bg-white p-5">
              <Icon className="mb-2 h-6 w-6 text-primary-600" aria-hidden />
              <p className="font-semibold text-neutral-900">{titulo}</p>
              <p className="text-sm text-neutral-500">{texto}</p>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-900">Recién publicado</h2>
            <Link href="/catalogo" className="text-sm font-medium text-primary-700">
              Ver todo el catálogo →
            </Link>
          </div>
          <CategoryChips />
          {productos.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {productos.map((producto) => (
                <ProductCard key={producto.id} producto={producto} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
              Todavía no hay productos publicados. Conecta el proyecto a Supabase (ver
              apps/web/.env.example) y sé el primer emprendimiento del catálogo.
            </p>
          )}
        </section>
      </main>
    </>
  );
}
