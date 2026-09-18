-- ============================================================================
-- 0002_rls.sql
-- Row Level Security: separa los perfiles de emprendedor / consumidor / admin
-- descritos en la sección 1.10 del documento base directamente en la capa
-- de datos, en vez de confiar solo en la lógica de la aplicación.
-- ============================================================================

-- Función auxiliar: ¿el usuario autenticado es administrador?
create or replace function public.es_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'admin'
  );
$$;

-- ----------------------------------------------------------------------------
-- categorias: lectura pública, sin escritura desde el cliente.
-- ----------------------------------------------------------------------------
alter table public.categorias enable row level security;

create policy "categorias_select_publico"
  on public.categorias for select
  using (true);

-- ----------------------------------------------------------------------------
-- perfiles
-- ----------------------------------------------------------------------------
alter table public.perfiles enable row level security;

create policy "perfiles_select_propio_o_admin"
  on public.perfiles for select
  using (auth.uid() = id or public.es_admin());

create policy "perfiles_update_propio"
  on public.perfiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "perfiles_update_admin"
  on public.perfiles for update
  using (public.es_admin());

-- ----------------------------------------------------------------------------
-- emprendimientos
-- ----------------------------------------------------------------------------
alter table public.emprendimientos enable row level security;

create policy "emprendimientos_select_activos_publico"
  on public.emprendimientos for select
  using (estado = 'activo' or usuario_id = auth.uid() or public.es_admin());

create policy "emprendimientos_insert_propio"
  on public.emprendimientos for insert
  with check (usuario_id = auth.uid());

create policy "emprendimientos_update_propio"
  on public.emprendimientos for update
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

create policy "emprendimientos_update_admin"
  on public.emprendimientos for update
  using (public.es_admin());

create policy "emprendimientos_delete_propio_o_admin"
  on public.emprendimientos for delete
  using (usuario_id = auth.uid() or public.es_admin());

-- ----------------------------------------------------------------------------
-- productos
-- ----------------------------------------------------------------------------
alter table public.productos enable row level security;

create policy "productos_select_publico"
  on public.productos for select
  using (
    disponible = true
    or exists (
      select 1 from public.emprendimientos e
      where e.id = productos.emprendimiento_id
        and (e.usuario_id = auth.uid() or public.es_admin())
    )
  );

create policy "productos_insert_propio"
  on public.productos for insert
  with check (
    exists (
      select 1 from public.emprendimientos e
      where e.id = productos.emprendimiento_id and e.usuario_id = auth.uid()
    )
  );

create policy "productos_update_propio"
  on public.productos for update
  using (
    exists (
      select 1 from public.emprendimientos e
      where e.id = productos.emprendimiento_id and e.usuario_id = auth.uid()
    )
  );

create policy "productos_delete_propio_o_admin"
  on public.productos for delete
  using (
    exists (
      select 1 from public.emprendimientos e
      where e.id = productos.emprendimiento_id and e.usuario_id = auth.uid()
    )
    or public.es_admin()
  );

-- ----------------------------------------------------------------------------
-- pagos: el emprendedor solo puede crear y ver los suyos; solo el admin
-- puede aprobarlos o rechazarlos (sección 2.7 Validación por Yape).
-- ----------------------------------------------------------------------------
alter table public.pagos enable row level security;

create policy "pagos_select_propio_o_admin"
  on public.pagos for select
  using (
    exists (
      select 1 from public.emprendimientos e
      where e.id = pagos.emprendimiento_id and e.usuario_id = auth.uid()
    )
    or public.es_admin()
  );

create policy "pagos_insert_propio"
  on public.pagos for insert
  with check (
    exists (
      select 1 from public.emprendimientos e
      where e.id = pagos.emprendimiento_id and e.usuario_id = auth.uid()
    )
  );

create policy "pagos_update_admin"
  on public.pagos for update
  using (public.es_admin());
