import { z } from 'zod';
import { CATEGORIA_SLUGS } from '../constants/categorias';
import { TIPOS_PRODUCTO } from '../constants/producto';

export const productoSchema = z.object({
  id: z.string().uuid(),
  emprendimientoId: z.string().uuid(),
  tipo: z.enum(TIPOS_PRODUCTO).default('producto'),
  nombre: z.string().min(2).max(100),
  descripcion: z.string().min(5).max(1000),
  precio: z.number().positive().max(50000),
  categoriaSlug: z.enum(CATEGORIA_SLUGS),
  // Opcional: un servicio (p. ej. tutorías) no siempre tiene una foto
  // representativa. Cuando hay fotos, se permite hasta 6.
  imagenes: z.array(z.string().url()).max(6).default([]),
  disponible: z.boolean().default(true),
  creadoEn: z.string().datetime().optional(),
});

export type Producto = z.infer<typeof productoSchema>;

export const crearProductoSchema = productoSchema.pick({
  tipo: true,
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
  tipo: z.enum(TIPOS_PRODUCTO).optional(),
  precioMin: z.number().nonnegative().optional(),
  precioMax: z.number().positive().optional(),
  ordenarPor: z.enum(['recientes', 'precio-asc', 'precio-desc']).default('recientes'),
});

export type FiltroCatalogo = z.infer<typeof filtroCatalogoSchema>;
