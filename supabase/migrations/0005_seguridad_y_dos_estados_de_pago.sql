-- ============================================================================
-- 0005_seguridad_y_dos_estados_de_pago.sql
--
-- 1. Un pago solo tiene dos estados: 'pendiente' y 'validado' (el
--    administrador valida el comprobante; ya no existe "rechazado").
-- 2. Cierra los huecos de las políticas de 0002/0003 que permitían:
--      - que un usuario se pusiera rol 'admin' (perfiles);
--      - que un vendedor activara su negocio sin pagar (emprendimientos);
--      - que un vendedor se insertara un pago ya aprobado (pagos);
--      - leer por la API los productos de negocios suspendidos o sin pagar;
--      - registrarse con un correo que no es @unjbg.edu.pe.
-- 3. La suscripción tiene vigencia (emprendimientos.activo_hasta) y se valida
--    en una sola transacción (validar_pago).
--
-- Se ejecuta con el SQL Editor de Supabase o `supabase db push`. Es seguro
-- repetirla (usa IF EXISTS / OR REPLACE). Pruebas: `pnpm test`.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Dos estados de pago
-- ----------------------------------------------------------------------------
-- Los pagos rechazados ya no existen como estado: se eliminan (el vendedor
-- puede volver a enviar su comprobante). Los aprobados pasan a 'validado'.
delete from public.pagos where estado = 'rechazado';

alter table public.pagos drop constraint if exists pagos_estado_check;
update public.pagos set estado = 'validado' where estado = 'aprobado';
alter table public.pagos
  add constraint pagos_estado_check check (estado in ('pendiente', 'validado'));

alter table public.pagos drop column if exists motivo_rechazo;

-- ----------------------------------------------------------------------------
-- 2. Vigencia de la suscripción
-- ----------------------------------------------------------------------------
-- Fecha hasta la que el emprendimiento aparece en el catálogo. La fija
-- validar_pago(); sin ella (o vencida) el negocio no es visible para el público.
alter table public.emprendimientos
  add column if not exists activo_hasta timestamptz;

-- Los negocios que ya estaban activos reciben 30 días de gracia.
update public.emprendimientos
   set activo_hasta = now() + interval '30 days'
 where estado = 'activo' and activo_hasta is null;

-- ----------------------------------------------------------------------------
-- 3. Perfiles: nadie cambia su propio rol ni su correo
-- ----------------------------------------------------------------------------
-- auth.uid() es NULL cuando escribe el service role o el SQL Editor (así se
-- asigna 'admin', ver constants/roles.ts); el administrador también puede.
create or replace function public.proteger_perfil()
returns trigger
language plpgsql
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'El identificador del perfil no se puede cambiar.';
  end if;
  if auth.uid() is not null and new.rol is distinct from old.rol and not public.es_admin() then
    raise exception 'No puedes cambiar tu rol.';
  end if;
  if auth.uid() is not null and new.email is distinct from old.email then
    raise exception 'El correo de tu cuenta no se puede cambiar desde el perfil.';
  end if;
  return new;
end;
$$;

drop trigger if exists proteger_perfil on public.perfiles;
create trigger proteger_perfil
  before update on public.perfiles
  for each row execute procedure public.proteger_perfil();

-- ----------------------------------------------------------------------------
-- 4. Emprendimientos: el estado, la vigencia y las vistas no los toca el dueño
-- ----------------------------------------------------------------------------
create or replace function public.proteger_emprendimiento()
returns trigger
language plpgsql
as $$
begin
  -- service role, SQL Editor o administrador: sin restricciones
  if auth.uid() is null or public.es_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.estado := 'pendiente';
    new.vistas := 0;
    new.activo_hasta := null;
    return new;
  end if;

  if new.estado is distinct from old.estado
     or new.activo_hasta is distinct from old.activo_hasta
     or new.vistas is distinct from old.vistas
     or new.usuario_id is distinct from old.usuario_id then
    raise exception 'Solo un administrador puede cambiar el estado o la vigencia del emprendimiento.';
  end if;
  return new;
end;
$$;

drop trigger if exists proteger_emprendimiento on public.emprendimientos;
create trigger proteger_emprendimiento
  before insert or update on public.emprendimientos
  for each row execute procedure public.proteger_emprendimiento();

-- Borrar un emprendimiento arrastra sus pagos (on delete cascade): solo lo
-- hace el administrador. La eliminación de cuenta (service role) sigue
-- funcionando porque no pasa por estas políticas.
drop policy if exists "emprendimientos_delete_propio_o_admin" on public.emprendimientos;
drop policy if exists "emprendimientos_delete_admin" on public.emprendimientos;
create policy "emprendimientos_delete_admin"
  on public.emprendimientos for delete
  using (public.es_admin());

-- Público: solo negocios activos con suscripción vigente.
drop policy if exists "emprendimientos_select_activos_publico" on public.emprendimientos;
create policy "emprendimientos_select_activos_publico"
  on public.emprendimientos for select
  using (
    (estado = 'activo' and activo_hasta > now())
    or usuario_id = auth.uid()
    or public.es_admin()
  );

-- ----------------------------------------------------------------------------
-- 5. Productos: lo no visible en el catálogo tampoco sale por la API
-- ----------------------------------------------------------------------------
drop policy if exists "productos_select_publico" on public.productos;
create policy "productos_select_publico"
  on public.productos for select
  using (
    exists (
      select 1 from public.emprendimientos e
      where e.id = productos.emprendimiento_id
        and (
          e.usuario_id = auth.uid()
          or public.es_admin()
          or (productos.disponible and e.estado = 'activo' and e.activo_hasta > now())
        )
    )
  );

-- Las fotos deben estar en el bucket 'productos', en la carpeta del dueño
-- del emprendimiento (así no se enlazan imágenes de otros sitios).
create or replace function public.validar_producto()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_usuario uuid;
  v_url text;
begin
  select usuario_id into v_usuario
    from public.emprendimientos where id = new.emprendimiento_id;

  foreach v_url in array coalesce(new.imagenes, '{}'::text[]) loop
    if position('/storage/v1/object/public/productos/' || v_usuario::text || '/' in v_url) = 0 then
      raise exception 'Las fotos deben subirse desde la aplicación.';
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists validar_producto on public.productos;
create trigger validar_producto
  before insert or update on public.productos
  for each row execute procedure public.validar_producto();

-- ----------------------------------------------------------------------------
-- 6. Pagos: el vendedor solo puede crear pagos 'pendiente'
-- ----------------------------------------------------------------------------
-- Cuenta los pagos pendientes de un emprendimiento. Es una función aparte
-- (security definer) porque una política de pagos no puede consultar pagos
-- directamente: Postgres lo rechaza por recursión infinita.
create or replace function public.pagos_pendientes(p_emprendimiento_id uuid)
returns integer
language sql
security definer set search_path = public
stable
as $$
  select count(*)::integer from public.pagos
  where emprendimiento_id = p_emprendimiento_id and estado = 'pendiente';
$$;

drop policy if exists "pagos_insert_propio" on public.pagos;
create policy "pagos_insert_propio"
  on public.pagos for insert
  with check (
    metodo = 'yape'
    and estado = 'pendiente'
    and revisado_por is null
    and revisado_en is null
    and periodo_inicio is null
    and periodo_fin is null
    -- el comprobante debe estar en su propia carpeta del bucket privado
    and split_part(comprobante_url, '/', 1) = auth.uid()::text
    and exists (
      select 1 from public.emprendimientos e
      where e.id = pagos.emprendimiento_id and e.usuario_id = auth.uid()
    )
    -- máximo 3 pagos esperando revisión (evita llenar la cola del administrador)
    and public.pagos_pendientes(emprendimiento_id) < 3
  );

-- El administrador ya no edita pagos a mano: los valida con validar_pago().
drop policy if exists "pagos_update_admin" on public.pagos;

-- ----------------------------------------------------------------------------
-- 7. Validar un pago: una sola transacción, con vigencia
-- ----------------------------------------------------------------------------
create or replace function public.validar_pago(p_pago_id uuid)
returns public.pagos
language plpgsql
security definer set search_path = public
as $$
declare
  v_pago   public.pagos;
  v_emp    public.emprendimientos;
  v_inicio timestamptz;
  v_fin    timestamptz;
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede validar pagos.';
  end if;

  select * into v_pago from public.pagos where id = p_pago_id for update;
  if not found then
    raise exception 'El pago no existe.';
  end if;
  if v_pago.estado <> 'pendiente' then
    raise exception 'Este pago ya fue validado.';
  end if;

  select * into v_emp from public.emprendimientos where id = v_pago.emprendimiento_id for update;
  if v_emp.estado = 'suspendido' then
    raise exception 'El emprendimiento está suspendido: levanta la suspensión antes de validar el pago.';
  end if;

  -- si aún tenía días de suscripción, el nuevo mes se suma al final
  v_inicio := greatest(now(), coalesce(v_emp.activo_hasta, now()));
  v_fin := v_inicio + interval '1 month';

  update public.pagos
     set estado = 'validado',
         revisado_por = auth.uid(),
         revisado_en = now(),
         periodo_inicio = v_inicio,
         periodo_fin = v_fin
   where id = p_pago_id
   returning * into v_pago;

  update public.emprendimientos
     set estado = 'activo', activo_hasta = v_fin
   where id = v_emp.id;

  return v_pago;
end;
$$;

revoke all on function public.validar_pago(uuid) from public, anon;
grant execute on function public.validar_pago(uuid) to authenticated;

-- Marca como 'vencido' lo que ya pasó su vigencia. La app no depende de esto
-- (el catálogo mira activo_hasta), pero deja el estado guardado al día. Se
-- puede programar con pg_cron, por ejemplo:
--   select cron.schedule('vencer-suscripciones', '0 5 * * *', 'select public.vencer_suscripciones()');
create or replace function public.vencer_suscripciones()
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_filas integer;
begin
  update public.emprendimientos
     set estado = 'vencido'
   where estado = 'activo' and (activo_hasta is null or activo_hasta <= now());
  get diagnostics v_filas = row_count;
  return v_filas;
end;
$$;

revoke all on function public.vencer_suscripciones() from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 8. Solo correos @unjbg.edu.pe (antes solo lo exigía el formulario)
-- ----------------------------------------------------------------------------
-- Mantener el dominio sincronizado con DOMINIO_INSTITUCIONAL
-- (packages/core/src/constants/roles.ts). La excepción aborta el registro.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if lower(coalesce(new.email, '')) !~ '^[^@[:space:]]+@unjbg\.edu\.pe$' then
    raise exception 'Solo se permiten correos @unjbg.edu.pe.';
  end if;

  insert into public.perfiles (id, email, nombre_completo)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nombre_completo', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 9. Storage: solo imágenes y hasta 5 MB en los buckets de fotos y comprobantes
-- ----------------------------------------------------------------------------
update storage.buckets
   set file_size_limit = 5242880,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
 where id in ('logos', 'productos', 'comprobantes');
