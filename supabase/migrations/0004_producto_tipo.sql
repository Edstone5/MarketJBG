-- ============================================================================
-- 0004_producto_tipo.sql
-- El catálogo no solo vende bienes físicos: también hay servicios
-- (tutorías, diseño, impresiones, etc.). Se agrega un campo explícito para
-- distinguirlos y se relaja la exigencia de fotos, ya que un servicio no
-- siempre tiene una imagen representativa.
-- ============================================================================

alter table public.productos
  add column if not exists tipo text not null default 'producto'
    check (tipo in ('producto', 'servicio'));

alter table public.productos
  alter column imagenes drop not null;

alter table public.productos
  alter column imagenes set default '{}';

alter table public.productos
  drop constraint if exists productos_imagenes_check;

alter table public.productos
  add constraint productos_imagenes_check
    check (imagenes is null or array_length(imagenes, 1) <= 6);

create index if not exists productos_tipo_idx on public.productos (tipo);
