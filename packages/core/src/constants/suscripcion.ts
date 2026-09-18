/**
 * Modelo de micro-suscripción (sección 1.2 y Cap. II.7 del documento base):
 * pago manual por Yape, validado por un administrador antes de activar
 * la visibilidad del emprendimiento en el catálogo.
 */
export const ESTADOS_PAGO = ['pendiente', 'aprobado', 'rechazado'] as const;
export type EstadoPago = (typeof ESTADOS_PAGO)[number];

export const ESTADOS_EMPRENDIMIENTO = ['activo', 'pendiente', 'vencido', 'suspendido'] as const;
export type EstadoEmprendimiento = (typeof ESTADOS_EMPRENDIMIENTO)[number];

/** Precio referencial de la micro-suscripción mensual, en soles (S/). */
export const PRECIO_SUSCRIPCION_MENSUAL = 10;

export const METODOS_PAGO = ['yape'] as const;
export type MetodoPago = (typeof METODOS_PAGO)[number];
