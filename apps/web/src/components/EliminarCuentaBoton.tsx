'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function EliminarCuentaBoton() {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [password, setPassword] = useState('');
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
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
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
      setPassword('');
    }
  }

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => {
          setConfirmando(true);
          setError(null);
        }}
        className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
      >
        Eliminar mi cuenta
      </button>
    );
  }

  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault();
        void eliminar();
      }}
      className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4"
    >
      <p className="text-sm text-red-800">
        Esto eliminará tu cuenta, tu perfil de emprendimiento, tus productos y tu historial de
        pagos de forma permanente. Esta acción no se puede deshacer. Para confirmar, escribe tu
        contraseña.
      </p>
      <div className="flex flex-col gap-1">
        <label htmlFor="confirmar-contrasena" className="text-sm font-medium text-red-900">
          Contraseña
        </label>
        <input
          id="confirmar-contrasena"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(evento) => setPassword(evento.target.value)}
          disabled={eliminando}
          required
          className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={eliminando || password.length === 0}
          className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {eliminando ? 'Eliminando…' : 'Sí, eliminar definitivamente'}
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirmando(false);
            setPassword('');
            setError(null);
          }}
          disabled={eliminando}
          className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-white"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
