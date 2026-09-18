import { z } from 'zod';
import { ESTADOS_PAGO, METODOS_PAGO } from '../constants/suscripcion';

/**
 * Registro de pago de la micro-suscripción (Transacción + Comprobante del
 * doc. base, unificados: cada pago referencia un único comprobante subido
 * por el emprendedor y queda pendiente hasta la revisión manual del admin).
 */
export const pagoSchema = z.object({
  id: z.string().uuid(),
  emprendimientoId: z.string().uuid(),
  metodo: z.enum(METODOS_PAGO).default('yape'),
  montoReportado: z.number().positive(),
  // Ruta dentro del bucket privado `comprobantes` (no una URL pública: el
  // bucket exige URLs firmadas y de corta duración para su lectura).
  comprobanteUrl: z.string().min(3),
  estado: z.enum(ESTADOS_PAGO).default('pendiente'),
  periodoInicio: z.string().datetime().nullable().optional(),
  periodoFin: z.string().datetime().nullable().optional(),
  revisadoPor: z.string().uuid().nullable().optional(),
  revisadoEn: z.string().datetime().nullable().optional(),
  motivoRechazo: z.string().max(300).nullable().optional(),
  creadoEn: z.string().datetime().optional(),
});

export type Pago = z.infer<typeof pagoSchema>;

/** Lo que sube el emprendedor al reportar su pago Yape. */
export const reportarPagoSchema = pagoSchema.pick({
  montoReportado: true,
  comprobanteUrl: true,
});

export type ReportarPagoInput = z.infer<typeof reportarPagoSchema>;

/** Acción del administrador al revisar un comprobante. */
export const revisarPagoSchema = z.object({
  pagoId: z.string().uuid(),
  aprobar: z.boolean(),
  motivoRechazo: z.string().max(300).optional(),
});

export type RevisarPagoInput = z.infer<typeof revisarPagoSchema>;
