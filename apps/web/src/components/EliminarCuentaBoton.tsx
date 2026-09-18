'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function EliminarCuentaBoton() {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function eliminar() {
    setEliminando(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('Tu sesión expiró, vuelve a iniciar sesión.');

      const respuesta = await fetch('/api/cuenta', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!respuesta.ok) {
        const { error: mensaje } = await respuesta.json().catch(() => ({ error: null }));
        throw new Error(mensaje ?? 'No se pudo eliminar la cuenta.');
      }

      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la cuenta.');
      setEliminando(false);
    }
  }

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
      >
        Eliminar mi cuenta
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="text-sm text-red-800">
        Esto eliminará tu cuenta, tu perfil de emprendimiento, tus productos y tu historial de
        pagos de forma permanente. Esta acción no se puede deshacer. ¿Confirmas?
      </p>
      {error && <p className="text-sm font-medium text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={eliminar}
          disabled={eliminando}
          className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {eliminando ? 'Eliminando…' : 'Sí, eliminar definitivamente'}
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          disabled={eliminando}
          className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-white"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
