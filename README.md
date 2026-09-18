# Emprende UNJBG

Catálogo de emprendimientos estudiantiles de la Universidad Nacional Jorge Basadre Grohmann
(Tacna, Perú). Conecta a estudiantes emprendedores con consumidores dentro de la comunidad
universitaria, con perfiles verificados por correo institucional y una micro-suscripción
mensual validada manualmente por Yape.

Este repositorio es un **monorepo** con la app web (Next.js) y la app móvil (Expo /
React Native) compartiendo la misma lógica de negocio, tipos y conexión a base de datos.

## Estructura del monorepo

```
emprende-unjbg/
├── apps/
│   ├── web/          # Next.js 16 (App Router) — catálogo público + paneles
│   └── mobile/        # Expo / React Native (expo-router) — Android + iOS
├── packages/
│   ├── core/          # Esquemas Zod, tipos y constantes de negocio compartidas
│   ├── db/             # Cliente y queries tipadas de Supabase (usadas por web y móvil)
│   ├── ui/              # Design tokens compartidos (colores, tipografía, spacing)
│   └── tsconfig/        # tsconfig base compartido
├── supabase/
│   ├── migrations/     # Esquema SQL versionado (fuente de verdad de la base de datos)
│   └── seed/            # Datos iniciales (categorías)
└── .github/workflows/   # CI y build/submit a las tiendas (EAS)
```

## Stack

- **Web**: Next.js 16 (App Router, Turbopack), Tailwind CSS v4, TypeScript.
- **Móvil**: Expo + React Native, expo-router (navegación por archivos), NativeWind.
- **Backend**: Supabase (PostgreSQL + Auth + Storage), con Row Level Security separando
  los roles consumidor / emprendedor / admin directamente en la base de datos.
- **Validación**: Zod, con los mismos esquemas reutilizados en web, móvil y consultas a la DB.
- **Monorepo**: pnpm workspaces + Turborepo.

## Requisitos

- Node.js 20+
- pnpm 9+ (`corepack enable` o `npm install -g pnpm`)
- Una cuenta de [Supabase](https://supabase.com) (plan gratuito alcanza para empezar)
- Para compilar la app móvil: cuenta de [Expo](https://expo.dev) (EAS Build/Submit)

## Puesta en marcha

```bash
pnpm install
```

### 1. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Aplica el esquema: con la [Supabase CLI](https://supabase.com/docs/guides/cli) instalada,
   `supabase link` a tu proyecto y luego `supabase db push` (aplica todo lo que hay en
   `supabase/migrations/`), o pega el contenido de cada archivo `.sql` en el SQL Editor del
   dashboard, en orden.
3. Ejecuta `supabase/seed/seed.sql` para cargar las categorías iniciales.
4. En **Authentication > Providers**, deja habilitado el login por correo/contraseña.
5. Copia la URL del proyecto y la `anon key` (Project Settings > API).

### 2. Variables de entorno

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env
```

Completa ambos archivos con la URL y `anon key` de tu proyecto de Supabase.

### 3. Levantar la web

```bash
pnpm dev:web
```

Abre http://localhost:3000.

### 4. Levantar la app móvil

```bash
pnpm dev:mobile
```

Escanea el QR con la app **Expo Go**, o presiona `a` / `i` para emulador Android / iOS.

## Despliegue

### Web → Vercel

1. Importa este repositorio en [vercel.com](https://vercel.com).
2. Root Directory: `apps/web`. Vercel detecta Next.js automáticamente.
3. Agrega las variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`) en el proyecto de Vercel.
4. Cada push a `main` despliega a producción; cada PR obtiene una URL de preview.

### Móvil → EAS Build + tiendas

```bash
npm install -g eas-cli
cd apps/mobile
eas login
eas build:configure
```

- `eas build --profile preview --platform android` → genera un `.apk` para probar en un
  dispositivo real sin pasar por la tienda.
- `eas build --profile production --platform all` → genera los binarios `.aab` (Android) y
  `.ipa` (iOS) listos para publicar.
- `eas submit` sube el build a Google Play Console / App Store Connect.

El workflow [`.github/workflows/eas-build.yml`](.github/workflows/eas-build.yml) automatiza
esto desde GitHub Actions (disparo manual, para no gastar créditos de build sin querer).

**Antes de poder publicar necesitas:**

- Cuenta de **Google Play Console** (pago único de USD 25). Las cuentas nuevas exigen una
  prueba cerrada con ~12 testers durante 14 días antes de publicar en producción — inicia
  ese trámite con anticipación.
- Cuenta de **Apple Developer Program** (USD 99/año).
- Una **política de privacidad** publicada en una URL pública (puedes alojarla como una
  página más de `apps/web`).

## Scripts útiles

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Corre web y móvil en paralelo |
| `pnpm build` | Build de producción de todo el monorepo |
| `pnpm lint` | Lint de todos los paquetes |
| `pnpm typecheck` | Chequeo de tipos de todo el monorepo |
| `pnpm format` | Formatea con Prettier |

## Modelo de datos

El esquema completo vive en [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
Entidades principales: `perfiles` (extiende `auth.users`), `emprendimientos`, `productos`,
`categorias` y `pagos` (registro de suscripción + comprobante Yape, sección 2.7 del documento
base del proyecto). Las políticas de seguridad por fila están en
[`0002_rls.sql`](supabase/migrations/0002_rls.sql).

## Contribuir

Ver [CONTRIBUTING.md](./CONTRIBUTING.md).
