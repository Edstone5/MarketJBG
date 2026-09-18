-- ============================================================================
-- 0001_init.sql
-- Esquema inicial: catálogo, perfiles, emprendimientos, productos y pagos.
-- Basado en el modelo de dominio de la sección 2.2 (Diseño Conceptual) del
-- documento "Desarrollo de App Web para Emprendimiento Estudiantil UNJBG".
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- categorias: taxonomía fija del catálogo (sección 1.8).
-- ----------------------------------------------------------------------------
create table if not exists public.categorias (
  slug   text primary key,
  nombre text not null,
  icono  text not null
);

-- ----------------------------------------------------------------------------
-- perfiles: extiende auth.users (1:1). Se crea automáticamente vía trigger
-- cuando un usuario se registra con su correo institucional.
-- ----------------------------------------------------------------------------
create table if not exists public.perfiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  email               text not null unique,
  nombre_completo     text not null,
  rol                 text not null default 'consumidor'
                        check (rol in ('consumidor', 'emprendedor', 'admin')),
  escuela_profesional text,
  avatar_url          text,
  telefono_whatsapp   text,
  creado_en           timestamptz not null default now()
);

-- Crea el perfil automáticamente al registrarse en Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.perfiles (id, email, nombre_completo)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nombre_completo', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- emprendimientos: un usuario gestiona un único emprendimiento (unique).
-- ----------------------------------------------------------------------------
create table if not exists public.emprendimientos (
  id             uuid primary key default gen_random_uuid(),
  usuario_id     uuid not null unique references public.perfiles (id) on delete cascade,
  nombre         text not null check (char_length(nombre) between 2 and 80),
  descripcion    text not null check (char_length(descripcion) between 10 and 600),
  categoria_slug text not null references public.categorias (slug),
  logo_url       text,
  whatsapp       text not null,
  estado         text not null default 'pendiente'
                   check (estado in ('activo', 'pendiente', 'vencido', 'suspendido')),
  vistas         integer not null default 0,
  creado_en      timestamptz not null default now()
);

create index if not exists emprendimientos_categoria_idx on public.emprendimientos (categoria_slug);
create index if not exists emprendimientos_estado_idx on public.emprendimientos (estado);

-- ----------------------------------------------------------------------------
-- productos
-- ----------------------------------------------------------------------------
create table if not exists public.productos (
  id                uuid primary key default gen_random_uuid(),
  emprendimiento_id uuid not null references public.emprendimientos (id) on delete cascade,
  nombre            text not null check (char_length(nombre) between 2 and 100),
  descripcion       text not null check (char_length(descripcion) between 5 and 1000),
  precio            numeric(10, 2) not null check (precio > 0),
  categoria_slug    text not null references public.categorias (slug),
  imagenes          text[] not null check (array_length(imagenes, 1) between 1 and 6),
  disponible        boolean not null default true,
  creado_en         timestamptz not null default now()
);

create index if not exists productos_emprendimiento_idx on public.productos (emprendimiento_id);
create index if not exists productos_categoria_idx on public.productos (categoria_slug);
create index if not exists productos_disponible_idx on public.productos (disponible);

-- ----------------------------------------------------------------------------
-- pagos: unifica "Transacción" + "Comprobante" del documento base.
-- Cada pago referencia el comprobante Yape subido, pendiente de revisión
-- manual por un administrador (sección 2.7 "Validación por Yape").
-- ----------------------------------------------------------------------------
create table if not exists public.pagos (
  id                uuid primary key default gen_random_uuid(),
  emprendimiento_id uuid not null references public.emprendimientos (id) on delete cascade,
  metodo            text not null default 'yape' check (metodo in ('yape')),
  monto_reportado   numeric(10, 2) not null check (monto_reportado > 0),
  comprobante_url   text not null,
  estado            text not null default 'pendiente'
                       check (estado in ('pendiente', 'aprobado', 'rechazado')),
  periodo_inicio    timestamptz,
  periodo_fin       timestamptz,
  revisado_por      uuid references public.perfiles (id),
  revisado_en       timestamptz,
  motivo_rechazo    text,
  creado_en         timestamptz not null default now()
);

create index if not exists pagos_emprendimiento_idx on public.pagos (emprendimiento_id);
create index if not exists pagos_estado_idx on public.pagos (estado);
