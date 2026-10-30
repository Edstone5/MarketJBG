'use client';

import type { ReactNode } from 'react';
import { MessageCircle } from 'lucide-react';
import { registrarVisita } from '@emprende/db';
import { createClient } from '@/lib/supabase/client';
import { obtenerVisitante } from '@/lib/visitante';

/** Enlace a WhatsApp que, además de abrir el chat, cuenta el clic como «contacto» (RF09). */
export function BotonWhatsApp({
  href,
  emprendimientoId,
  productoId = null,
  className,
  children,
}: {
  href: string;
  emprendimientoId: string;
  productoId?: string | null;
  className: string;
  children: ReactNode;
}) {
  function contarContacto() {
    registrarVisita(createClient(), {
      emprendimientoId,
      productoId,
      tipo: 'contacto',
      visitante: obtenerVisitante(),
    }).catch(() => {
      // el chat se abre igual aunque no se pueda contar el clic
    });
  }

  return (
    <a href={href} target="_blank" rel="noreferrer" onClick={contarContacto} className={className}>
      <MessageCircle className="h-5 w-5" aria-hidden />
      {children}
    </a>
  );
}
