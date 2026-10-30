'use client';

import { useEffect } from 'react';
import { registrarVisita, type TipoVisita } from '@emprende/db';
import { createClient } from '@/lib/supabase/client';
import { obtenerVisitante } from '@/lib/visitante';

/**
 * No dibuja nada: al abrirse el perfil o la publicación avisa a la base de datos para
 * contar la visita (RF09). Se hace desde el navegador a propósito: los robots que no
 * ejecutan JavaScript no suman, y una falla aquí nunca debe romper la página.
 */
export function RegistrarVisita({
  emprendimientoId,
  productoId = null,
  tipo,
}: {
  emprendimientoId: string;
  productoId?: string | null;
  tipo: Extract<TipoVisita, 'perfil' | 'producto'>;
}) {
  useEffect(() => {
    registrarVisita(createClient(), {
      emprendimientoId,
      productoId,
      tipo,
      visitante: obtenerVisitante(),
    }).catch(() => {
      // contar visitas es secundario: se ignora cualquier error
    });
  }, [emprendimientoId, productoId, tipo]);

  return null;
}
