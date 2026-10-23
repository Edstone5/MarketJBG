import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { CATEGORIAS } from '@emprende/core';
import { obtenerEmprendimientoPorId } from '@emprende/db';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProductCard, type ProductoCatalogo } from '@/components/ProductCard';
import { createClient } from '@/lib/supabase/server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata: Metadata = { title: 'Emprendimiento' };

/** Perfil público de un emprendimiento: lo ve cualquiera mientras su suscripción esté vigente (lo decide la base de datos). */
export default async function EmprendimientoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  let emprendimiento: Awaited<ReturnType<typeof obtenerEmprendimientoPorId>>;
  try {
    emprendimiento = await obtenerEmprendimientoPorId(supabase, id);
  } catch {
    notFound();
  }

  const categoria = CATEGORIAS.find((c) => c.slug === emprendimiento.categoria_slug);
  const productos: ProductoCatalogo[] = (emprendimiento.productos ?? [])
    .filter((producto) => producto.disponible)
    .map((producto) => ({
      id: producto.id,
      tipo: producto.tipo,
      nombre: producto.nombre,
      precio: producto.precio,
      imagenes: producto.imagenes ?? [],
      emprendimiento: { id: emprendimiento.id, nombre: emprendimiento.nombre, logo_url: emprendimiento.logo_url },
    }));

  const mensaje = encodeURIComponent(`Hola, vi "${emprendimiento.nombre}" en MarketJBG y me interesa 🙂`);
  const linkWhatsapp = `https://wa.me/${emprendimiento.whatsapp.replace(/\D/g, '')}?text=${mensaje}`;

  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8">
        <section className="flex flex-col gap-4 rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-neutral-100">
            {emprendimiento.logo_url && (
              <Image src={emprendimiento.logo_url} alt="" fill className="object-cover" />
            )}
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <h1 className="text-2xl font-bold text-neutral-900">{emprendimiento.nombre}</h1>
            {categoria && <p className="text-sm text-primary-700">{categoria.nombre}</p>}
            <p className="whitespace-pre-line text-sm text-neutral-600">{emprendimiento.descripcion}</p>
          </div>
          <a
            href={linkWhatsapp}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-full bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700"
          >
            <MessageCircle className="h-5 w-5" aria-hidden />
            Contactar por WhatsApp
          </a>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-neutral-900">
            Productos y servicios ({productos.length})
          </h2>
          {productos.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {productos.map((producto) => (
                <ProductCard key={producto.id} producto={producto} />
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
              Este emprendimiento todavía no tiene publicaciones disponibles.
            </p>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
