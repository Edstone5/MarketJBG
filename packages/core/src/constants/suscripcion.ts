/**
 * Modelo de micro-suscripción (sección 1.2 y Cap. II.7 del documento base):
 * pago manual por Yape, validado por un administrador antes de activar
 * la visibilidad del emprendimiento en el catálogo.
 */

/** Un pago solo tiene dos estados: lo reporta el emprendedor y lo valida el administrador. */
export const ESTADOS_PAGO = ['pendiente', 'validado'] as const;
export type EstadoPago = (typeof ESTADOS_PAGO)[number];

export const ETIQUETAS_ESTADO_PAGO: Record<EstadoPago, string> = {
  pendiente: 'Pendiente de revisión',
  validado: 'Validado',
};

export const ESTADOS_EMPRENDIMIENTO = ['activo', 'pendiente', 'vencido', 'suspendido'] as const;
export type EstadoEmprendimiento = (typeof ESTADOS_EMPRENDIMIENTO)[number];

/** Precio referencial de la micro-suscripción mensual, en soles (S/). */
export const PRECIO_SUSCRIPCION_MENSUAL = 5;

/** Cuántos pagos puede tener un emprendimiento esperando revisión (lo exige la base de datos). */
export const MAX_PAGOS_PENDIENTES = 3;

export const METODOS_PAGO = ['yape'] as const;
export type MetodoPago = (typeof METODOS_PAGO)[number];

/**
 * Estado real de un emprendimiento: si dice 'activo' pero su suscripción ya
 * venció, para el público y para el dueño es 'vencido'. La base de datos hace
 * la misma comprobación con `activo_hasta` en sus políticas de lectura.
 */
export function estadoEfectivo(
  estado: EstadoEmprendimiento,
  activoHasta: string | null | undefined,
  ahora: Date = new Date(),
): EstadoEmprendimiento {
  if (estado !== 'activo') return estado;
  if (!activoHasta || new Date(activoHasta).getTime() <= ahora.getTime()) return 'vencido';
  return 'activo';
}

/** Fecha corta en español de Perú (p. ej. 15/11/2026). */
export function formatearFecha(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
