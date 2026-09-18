import { z } from 'zod';
import { CATEGORIA_SLUGS } from '../constants/categorias';
import { ESTADOS_EMPRENDIMIENTO } from '../constants/suscripcion';

export const emprendimientoSchema = z.object({
  id: z.string().uuid(),
  usuarioId: z.string().uuid(),
  nombre: z.string().min(2).max(80),
  descripcion: z.string().min(10).max(600),
  categoriaSlug: z.enum(CATEGORIA_SLUGS),
  logoUrl: z.string().url().nullable().optional(),
  whatsapp: z.string().regex(/^\+?[0-9]{9,15}$/, 'Número de WhatsApp inválido'),
  estado: z.enum(ESTADOS_EMPRENDIMIENTO).default('pendiente'),
  vistas: z.number().int().nonnegative().default(0),
  creadoEn: z.string().datetime().optional(),
});

export type Emprendimiento = z.infer<typeof emprendimientoSchema>;

/** Datos que el emprendedor completa al crear su perfil comercial. */
export const crearEmprendimientoSchema = emprendimientoSchema.pick({
  nombre: true,
  descripcion: true,
  categoriaSlug: true,
  whatsapp: true,
});

export type CrearEmprendimientoInput = z.infer<typeof crearEmprendimientoSchema>;

export const actualizarEmprendimientoSchema = crearEmprendimientoSchema.partial();
export type ActualizarEmprendimientoInput = z.infer<typeof actualizarEmprendimientoSchema>;
