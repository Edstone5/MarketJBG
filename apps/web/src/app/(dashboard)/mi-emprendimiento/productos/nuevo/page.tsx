import { redirect } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { ProductoForm } from '@/components/ProductoForm';
import { createClient } from '@/lib/supabase/server';
import { obtenerMiEmprendimiento } from '@emprende/db';

export default async function NuevoProductoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/mi-emprendimiento/productos/nuevo');

  const emprendimiento = await obtenerMiEmprendimiento(supabase, user.id);
  if (!emprendimiento) redirect('/mi-emprendimiento');

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-neutral-900">Nuevo producto</h1>
        <ProductoForm emprendimientoId={emprendimiento.id} />
      </main>
    </>
  );
}
