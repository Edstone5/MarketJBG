-- ============================================================================
-- 0006_estadisticas_visitas.sql
--
-- RF09: estadísticas de tráfico y desempeño para el emprendedor.
--   - tabla `visitas`: una fila por visita al perfil, a un producto o clic en
--     «Contactar por WhatsApp». Nadie la escribe directamente: solo
--     registrar_visita(), que cuenta únicamente lo que el público puede ver.
--   - estadisticas_emprendimiento(): totales, visitas por día, por hora (hora
--     pico en hora de Lima) y productos más vistos. Solo el dueño o un admin.
--   - se elimina `emprendimientos.vistas`: era un contador que nadie escribía
--     ni leía y que el emprendedor no podía tocar (0005). La tabla lo reemplaza.
--
-- Se ejecuta con el SQL Editor de Supabase o `supabase db push`. Es seguro
-- repetirla (usa IF EXISTS / OR REPLACE). Pruebas: `pnpm test`.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Fuera el contador `vistas` (primero el disparador que lo mencionaba)
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
    new.activo_hasta := null;
    return new;
  end if;

  if new.estado is distinct from old.estado
     or new.activo_hasta is distinct from old.activo_hasta
     or new.usuario_id is distinct from old.usuario_id then
    raise exception 'Solo un administrador puede cambiar el estado o la vigencia del emprendimiento.';
  end if;
  return new;
end;
$$;

alter table public.emprendimientos drop column if exists vistas;

-- ----------------------------------------------------------------------------
-- 2. Tabla de visitas
-- ----------------------------------------------------------------------------
-- producto_id queda en NULL si el producto se borra: el historial del negocio
-- (totales, días, horas) no cambia aunque el emprendedor elimine publicaciones.
create table if not exists public.visitas (
  id                bigint generated always as identity primary key,
  emprendimiento_id uuid not null references public.emprendimientos (id) on delete cascade,
  producto_id       uuid references public.productos (id) on delete set null,
  tipo              text not null check (tipo in ('perfil', 'producto', 'contacto')),
  -- identificador aleatorio del navegador o de la app (no es una cuenta ni una IP):
  -- sirve solo para no contar dos veces la misma visita seguida
  visitante         text check (visitante is null or char_length(visitante) between 8 and 64),
  visitado_en       timestamptz not null default now()
);

create index if not exists visitas_emprendimiento_fecha_idx
  on public.visitas (emprendimiento_id, visitado_en desc);
create index if not exists visitas_producto_idx
  on public.visitas (producto_id) where producto_id is not null;

alter table public.visitas enable row level security;

-- Escribir: nadie desde la API (solo registrar_visita). Leer: el dueño y el admin.
revoke all on public.visitas from anon, authenticated;
grant select on public.visitas to authenticated;

drop policy if exists "visitas_select_dueno_o_admin" on public.visitas;
create policy "visitas_select_dueno_o_admin"
  on public.visitas for select
  using (
    exists (
      select 1 from public.emprendimientos e
      where e.id = visitas.emprendimiento_id and e.usuario_id = auth.uid()
    )
    or public.es_admin()
  );

-- ----------------------------------------------------------------------------
-- 3. Registrar una visita (la puede llamar cualquiera, también sin cuenta)
-- ----------------------------------------------------------------------------
-- Devuelve true si la visita se contó. No se cuenta (y no es un error):
--   - un negocio que el público no ve (pendiente, vencido, suspendido);
--   - una visita del propio dueño a su negocio;
--   - un producto que no es de ese negocio o está oculto;
--   - la misma visita del mismo visitante en los últimos 30 minutos.
create or replace function public.registrar_visita(
  p_emprendimiento_id uuid,
  p_tipo              text,
  p_producto_id       uuid default null,
  p_visitante         text default null
)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_emp       public.emprendimientos;
  v_visitante text := case when char_length(p_visitante) between 8 and 64 then p_visitante end;
begin
  if p_tipo is null or p_tipo not in ('perfil', 'producto', 'contacto') then
    raise exception 'Tipo de visita no válido.';
  end if;
  if p_tipo = 'producto' and p_producto_id is null then
    raise exception 'Una visita a un producto debe indicar el producto.';
  end if;

  select * into v_emp from public.emprendimientos where id = p_emprendimiento_id;
  if not found
     or v_emp.estado <> 'activo'
     or v_emp.activo_hasta is null
     or v_emp.activo_hasta <= now() then
    return false;
  end if;

  if auth.uid() is not null and v_emp.usuario_id = auth.uid() then
    return false;
  end if;

  if p_producto_id is not null and not exists (
    select 1 from public.productos
    where id = p_producto_id and emprendimiento_id = p_emprendimiento_id and disponible
  ) then
    return false;
  end if;

  if v_visitante is not null and exists (
    select 1 from public.visitas
    where emprendimiento_id = p_emprendimiento_id
      and tipo = p_tipo
      and producto_id is not distinct from p_producto_id
      and visitante = v_visitante
      and visitado_en > now() - interval '30 minutes'
  ) then
    return false;
  end if;

  insert into public.visitas (emprendimiento_id, producto_id, tipo, visitante)
  values (p_emprendimiento_id, p_producto_id, p_tipo, v_visitante);
  return true;
end;
$$;

revoke all on function public.registrar_visita(uuid, text, uuid, text) from public;
grant execute on function public.registrar_visita(uuid, text, uuid, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4. Estadísticas de un emprendimiento
-- ----------------------------------------------------------------------------
-- Los días y las horas se calculan en hora de Perú (America/Lima, UTC-5 todo el
-- año): la «hora pico» es la hora del día con más visitas. `p_dias` incluye hoy
-- (entre 1 y 365). Se ejecuta con los permisos de quien llama (RLS), pero además
-- comprueba de forma explícita que sea el dueño o un administrador.
create or replace function public.estadisticas_emprendimiento(
  p_emprendimiento_id uuid,
  p_dias              integer default 30
)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_dias  integer := least(greatest(coalesce(p_dias, 30), 1), 365);
  v_hoy   date    := (now() at time zone 'America/Lima')::date;
  v_desde date    := (now() at time zone 'America/Lima')::date
                     - (least(greatest(coalesce(p_dias, 30), 1), 365) - 1);
begin
  if not exists (
    select 1 from public.emprendimientos e
    where e.id = p_emprendimiento_id
      and (e.usuario_id = auth.uid() or public.es_admin())
  ) then
    raise exception 'No tienes acceso a las estadísticas de este emprendimiento.';
  end if;

  return (
    with v as (
      select tipo,
             producto_id,
             (visitado_en at time zone 'America/Lima')::date as dia,
             extract(hour from visitado_en at time zone 'America/Lima')::integer as hora
        from public.visitas
       where emprendimiento_id = p_emprendimiento_id
         and (visitado_en at time zone 'America/Lima')::date between v_desde and v_hoy
    ),
    por_dia as (
      select d::date as dia,
             count(v.tipo) filter (where v.tipo in ('perfil', 'producto')) as visitas,
             count(v.tipo) filter (where v.tipo = 'contacto') as contactos
        from generate_series(v_desde::timestamp, v_hoy::timestamp, interval '1 day') d
        left join v on v.dia = d::date
       group by d
    ),
    por_hora as (
      select h as hora,
             count(v.tipo) filter (where v.tipo in ('perfil', 'producto')) as visitas
        from generate_series(0, 23) h
        left join v on v.hora = h
       group by h
    ),
    top_productos as (
      select p.id as producto_id,
             p.nombre,
             count(*) filter (where v.tipo = 'producto') as visitas,
             count(*) filter (where v.tipo = 'contacto') as contactos
        from v
        join public.productos p on p.id = v.producto_id
       group by p.id, p.nombre
       order by 3 desc, 4 desc, p.nombre
       limit 10
    )
    select jsonb_build_object(
      'desde', v_desde,
      'hasta', v_hoy,
      'dias', v_dias,
      'visitas_perfil', (select count(*) from v where tipo = 'perfil'),
      'visitas_productos', (select count(*) from v where tipo = 'producto'),
      'contactos', (select count(*) from v where tipo = 'contacto'),
      'por_dia', (
        select coalesce(
          jsonb_agg(jsonb_build_object('dia', dia, 'visitas', visitas, 'contactos', contactos) order by dia),
          '[]'::jsonb)
          from por_dia
      ),
      'por_hora', (
        select jsonb_agg(jsonb_build_object('hora', hora, 'visitas', visitas) order by hora)
          from por_hora
      ),
      'hora_pico', (
        select hora from por_hora where visitas > 0 order by visitas desc, hora limit 1
      ),
      'productos', (
        select coalesce(
          jsonb_agg(
            jsonb_build_object('producto_id', producto_id, 'nombre', nombre, 'visitas', visitas, 'contactos', contactos)
            order by visitas desc, contactos desc, nombre),
          '[]'::jsonb)
          from top_productos
      )
    )
  );
end;
$$;

revoke all on function public.estadisticas_emprendimiento(uuid, integer) from public, anon;
grant execute on function public.estadisticas_emprendimiento(uuid, integer) to authenticated;
