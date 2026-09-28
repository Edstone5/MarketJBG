import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MessageCircle, ShieldCheck } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { createClient } from '@/lib/supabase/server';
import { obtenerProductoPorId } from '@emprende/db';

const formatoPEN = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
});

export default async function ProductoPage({ params }: PageProps<'/catalogo/[productoId]'>) {
  const { productoId } = await params;
  const supabase = await createClient();

  let producto: Awaited<ReturnType<typeof obtenerProductoPorId>> | null = null;
  try {
    producto = await obtenerProductoPorId(supabase, productoId);
  } catch {
    notFound();
  }
  if (!producto) notFound();

  const emprendimiento = producto.emprendimiento as unknown as {
    id: string;
    nombre: string;
    logo_url: string | null;
    whatsapp: string;
    estado: string;
  } | null;

  const mensajeWhatsapp = encodeURIComponent(
    `Hola, vi "${producto.nombre}" en Emprende UNJBG y me interesa 🙂`,
  );
  const linkWhatsapp = emprendimiento
    ? `https://wa.me/${emprendimiento.whatsapp.replace(/\D/g, '')}?text=${mensajeWhatsapp}`
    : undefined;

  return (
    <>
      <Navbar />
      <main className="mx-auto grid w-full max-w-5xl flex-1 grid-cols-1 gap-8 px-4 py-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100 shadow-sm">
          {producto.imagenes[0] ? (
            <Image
              src={producto.imagenes[0]}
              alt={producto.nombre}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-neutral-400">
              Sin foto
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-neutral-900">{producto.nombre}</h1>
          <p className="inline-flex w-fit items-baseline rounded-full bg-accent-50 px-3 py-1 text-2xl font-bold text-accent-600">
            {formatoPEN.format(producto.precio)}
          </p>
          <p className="whitespace-pre-line text-neutral-600">{producto.descripcion}</p>

          {emprendimiento && (
            <Link
              href={`/emprendimientos/${emprendimiento.id}`}
              className="flex items-center gap-3 rounded-2xl border border-neutral-100 p-3 shadow-sm hover:border-primary-300"
            >
              <div className="relative h-10 w-10 overflow-hidden rounded-full bg-neutral-100">
                {emprendimiento.logo_url && (
                  <Image src={emprendimiento.logo_url} alt="" fill className="object-cover" />
                )}
              </div>
              <div>
                <p className="flex items-center gap-1 text-sm font-medium text-neutral-900">
                  {emprendimiento.nombre}
                  <ShieldCheck className="h-4 w-4 text-primary-500" aria-hidden />
                </p>
                <p className="text-xs text-neutral-500">Emprendimiento estudiantil verificado</p>
              </div>
            </Link>
          )}

          {linkWhatsapp && (
            <a
              href={linkWhatsapp}
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex items-center justify-center gap-2 rounded-full bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
            >
              <MessageCircle className="h-5 w-5" aria-hidden />
              Contactar por WhatsApp
            </a>
          )}
        </div>
      </main>
    </>
  );
}
