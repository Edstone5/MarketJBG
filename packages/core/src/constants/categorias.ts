/**
 * Taxonomía inicial del catálogo (sección 1.8 del documento base).
 * El slug es estable y se usa como clave foránea legible en la base de datos;
 * el icono referencia un nombre de ícono de lucide-react / lucide-react-native
 * para mantener consistencia visual entre web y móvil.
 */
export interface Categoria {
  slug: string;
  nombre: string;
  icono: string;
}

export const CATEGORIAS: Categoria[] = [
  { slug: 'comida', nombre: 'Comida y bebidas', icono: 'utensils' },
  { slug: 'postres', nombre: 'Postres y repostería', icono: 'cake' },
  { slug: 'ropa-accesorios', nombre: 'Ropa y accesorios', icono: 'shirt' },
  { slug: 'tecnologia', nombre: 'Tecnología', icono: 'laptop' },
  { slug: 'utiles-libros', nombre: 'Útiles y libros', icono: 'book' },
  { slug: 'servicios-academicos', nombre: 'Servicios académicos', icono: 'graduation-cap' },
  { slug: 'diseno-impresiones', nombre: 'Diseño e impresiones', icono: 'printer' },
  { slug: 'belleza-cuidado', nombre: 'Belleza y cuidado personal', icono: 'sparkles' },
  { slug: 'arte-manualidades', nombre: 'Arte y manualidades', icono: 'palette' },
  { slug: 'otros', nombre: 'Otros', icono: 'shapes' },
];

export const CATEGORIA_SLUGS = CATEGORIAS.map((c) => c.slug) as [string, ...string[]];
