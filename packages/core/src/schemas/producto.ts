import { z } from 'zod';
import { CATEGORIA_SLUGS } from '../constants/categorias';

export const productoSchema = z.object({
  id: z.string().uuid(),
  emprendimientoId: z.string().uuid(),
  nombre: z.string().min(2).max(100),
  descripcion: z.string().min(5).max(1000),
  precio: z.number().positive().max(50000),
  categoriaSlug: z.enum(CATEGORIA_SLUGS),
  imagenes: z.array(z.string().url()).min(1, 'Sube al menos una foto').max(6),
  disponible: z.boolean().default(true),
  creadoEn: z.string().datetime().optional(),
});

export type Producto = z.infer<typeof productoSchema>;

export const crearProductoSchema = productoSchema.pick({
  nombre: true,
  descripcion: true,
  precio: true,
  categoriaSlug: true,
  imagenes: true,
});

export type CrearProductoInput = z.infer<typeof crearProductoSchema>;

export const actualizarProductoSchema = crearProductoSchema.partial().extend({
  disponible: z.boolean().optional(),
});

export type ActualizarProductoInput = z.infer<typeof actualizarProductoSchema>;

/** Filtros del buscador del catálogo (sección 1.6 y anexo "módulo tres"). */
export const filtroCatalogoSchema = z.object({
  query: z.string().max(120).optional(),
  categoriaSlug: z.enum(CATEGORIA_SLUGS).optional(),
  precioMin: z.number().nonnegative().optional(),
  precioMax: z.number().positive().optional(),
  ordenarPor: z.enum(['recientes', 'precio-asc', 'precio-desc']).default('recientes'),
});

export type FiltroCatalogo = z.infer<typeof filtroCatalogoSchema>;
