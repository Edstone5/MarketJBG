-- ============================================================================
-- seed.sql
-- Datos iniciales de categorías. Debe mantenerse sincronizado a mano con
-- packages/core/src/constants/categorias.ts (fuente de verdad para el
-- frontend). Se ejecuta automáticamente con `supabase db reset`.
-- ============================================================================

insert into public.categorias (slug, nombre, icono) values
  ('comida',               'Comida y bebidas',          'utensils'),
  ('postres',               'Postres y repostería',      'cake'),
  ('ropa-accesorios',       'Ropa y accesorios',         'shirt'),
  ('tecnologia',            'Tecnología',                'laptop'),
  ('utiles-libros',         'Útiles y libros',           'book'),
  ('servicios-academicos',  'Servicios académicos',      'graduation-cap'),
  ('diseno-impresiones',    'Diseño e impresiones',      'printer'),
  ('belleza-cuidado',       'Belleza y cuidado personal','sparkles'),
  ('arte-manualidades',     'Arte y manualidades',       'palette'),
  ('otros',                 'Otros',                     'shapes')
on conflict (slug) do update set nombre = excluded.nombre, icono = excluded.icono;
