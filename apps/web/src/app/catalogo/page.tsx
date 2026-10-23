import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SearchBar } from '@/components/SearchBar';
import { CategoryChips } from '@/components/CategoryChips';
import { ProductCard, type ProductoCatalogo } from '@/components/ProductCard';
import { createClient } from '@/lib/supabase/server';
import { CATEGORIA_SLUGS } from '@emprende/core';
import { listarProductosCatalogo, type FiltroCatalogo } from '@emprende/db';

export const metadata: Metadata = {
  title: 'Catálogo',
};

export default async function CatalogoPage({
  searchParams,
}: PageProps<'/catalogo'>) {
  const params = await searchParams;
  const categoriaSlug =
    typeof params.categoria === 'string' && (CATEGORIA_SLUGS as readonly string[]).includes(params.categoria)
      ? (params.categoria as FiltroCatalogo['categoriaSlug'])
      : undefined;
  const query = typeof params.q === 'string' ? params.q.slice(0, 120) : undefined;

  const supabase = await createClient();
  let productos: ProductoCatalogo[] = [];
  let errorConexion = false;

  try {
    const filtro: Partial<FiltroCatalogo> = {
      categoriaSlug,
      query,
      ordenarPor: 'recientes',
    };
    const data = await listarProductosCatalogo(supabase, filtro);
    productos = (data ?? []) as unknown as ProductoCatalogo[];
  } catch (error) {
    console.error('No se pudo cargar el catálogo', error);
    errorConexion = true;
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-neutral-900">Catálogo de emprendimientos</h1>
          <SearchBar initialQuery={query} />
          <CategoryChips activa={categoriaSlug} />
        </div>

        {errorConexion ? (
          <p className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
            No pudimos cargar el catálogo en este momento. Inténtalo de nuevo en unos minutos.
          </p>
        ) : productos.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {productos.map((producto) => (
              <ProductCard key={producto.id} producto={producto} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
            No encontramos productos con esos filtros.
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}
