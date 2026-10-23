import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { ProductoForm } from '@/components/ProductoForm';
import { createClient } from '@/lib/supabase/server';
import { obtenerMiEmprendimiento } from '@emprende/db';

export const metadata: Metadata = { title: 'Editar publicación' };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/mi-emprendimiento/productos/${id}/editar`);

  const emprendimiento = await obtenerMiEmprendimiento(supabase, user.id);
  if (!emprendimiento) redirect('/mi-emprendimiento');
  // Solo se edita lo propio: se busca entre las publicaciones de su emprendimiento.
  const producto = emprendimiento.productos?.find((p) => p.id === id);
  if (!producto) notFound();

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-neutral-900">Editar publicación</h1>
        <ProductoForm emprendimientoId={emprendimiento.id} producto={producto} />
      </main>
    </>
  );
}
