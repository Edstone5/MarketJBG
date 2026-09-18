-- ============================================================================
-- 0003_storage.sql
-- Buckets de Supabase Storage: fotos de producto/logo son públicas (se
-- muestran en el catálogo); los comprobantes de pago son privados y solo
-- los puede leer el dueño del emprendimiento o un administrador.
-- ============================================================================

insert into storage.buckets (id, name, public)
values
  ('logos', 'logos', true),
  ('productos', 'productos', true),
  ('comprobantes', 'comprobantes', false)
on conflict (id) do nothing;

-- logos: cualquiera lee, solo el dueño autenticado sube a su propia carpeta
-- (convención: <usuario_id>/archivo.ext)
create policy "logos_select_publico"
  on storage.objects for select
  using (bucket_id = 'logos');

create policy "logos_insert_propio"
  on storage.objects for insert
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "logos_update_propio"
  on storage.objects for update
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "logos_delete_propio"
  on storage.objects for delete
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

-- productos: mismas reglas que logos.
create policy "productos_imgs_select_publico"
  on storage.objects for select
  using (bucket_id = 'productos');

create policy "productos_imgs_insert_propio"
  on storage.objects for insert
  with check (bucket_id = 'productos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "productos_imgs_delete_propio"
  on storage.objects for delete
  using (bucket_id = 'productos' and (storage.foldername(name))[1] = auth.uid()::text);

-- comprobantes: privado. Solo el propio usuario (que sube a su carpeta) y
-- los administradores pueden leer.
create policy "comprobantes_insert_propio"
  on storage.objects for insert
  with check (bucket_id = 'comprobantes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "comprobantes_select_propio_o_admin"
  on storage.objects for select
  using (
    bucket_id = 'comprobantes'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.es_admin())
  );
