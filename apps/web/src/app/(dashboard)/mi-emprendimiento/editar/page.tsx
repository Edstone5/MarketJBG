import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { EmprendimientoForm } from '@/components/EmprendimientoForm';
import { createClient } from '@/lib/supabase/server';
import { obtenerMiEmprendimiento } from '@emprende/db';

export const metadata: Metadata = { title: 'Editar mi emprendimiento' };

export default async function EditarEmprendimientoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/mi-emprendimiento/editar');

  const emprendimiento = await obtenerMiEmprendimiento(supabase, user.id);
  if (!emprendimiento) redirect('/mi-emprendimiento');

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="mb-1 text-2xl font-bold text-neutral-900">Editar mi emprendimiento</h1>
        <p className="mb-6 text-sm text-neutral-500">
          Estos datos se ven en tu perfil público del catálogo. El estado de tu suscripción no cambia.
        </p>
        <EmprendimientoForm
          emprendimiento={{
            id: emprendimiento.id,
            nombre: emprendimiento.nombre,
            descripcion: emprendimiento.descripcion,
            categoria_slug: emprendimiento.categoria_slug,
            whatsapp: emprendimiento.whatsapp,
          }}
        />
      </main>
    </>
  );
}
