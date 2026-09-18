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

Completa ambos archivos con la URL y `anon key` de tu proyecto de Supabase. En
`apps/web/.env.local` completa también `SUPABASE_SERVICE_ROLE_KEY` (Project Settings > API >
`service_role`) — la usa únicamente el Route Handler `/api/cuenta` para procesar la
eliminación de cuentas; nunca debe llevar el prefijo `NEXT_PUBLIC_` ni exponerse al cliente.

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
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`) en el
   proyecto de Vercel. Marca `SUPABASE_SERVICE_ROLE_KEY` como variable sensible/secreta.
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
- La web desplegada en Vercel, para poder pegar sus URLs de política de privacidad y
  eliminación de cuenta en Play Console / App Store Connect (ver siguiente sección).

## Páginas legales (requeridas por las tiendas)

La web incluye las páginas que Google Play y App Store exigen antes de aprobar una app que
crea cuentas de usuario:

| Página | URL | Para qué la piden |
|---|---|---|
| Política de Privacidad | `/privacidad` | Apple (campo obligatorio) y Google Play (Data safety form) |
| Términos y Condiciones | `/terminos` | Buena práctica / referenciada desde la política de privacidad |
| Eliminar mi cuenta | `/eliminar-cuenta` | Google Play exige una URL pública, accesible sin instalar la app, que explique cómo borrar la cuenta y los datos |

**Antes de publicar:**

1. Abre [`apps/web/src/app/(legal)/privacidad/page.tsx`](apps/web/src/app/(legal)/privacidad/page.tsx)
   y [`.../terminos/page.tsx`](apps/web/src/app/(legal)/terminos/page.tsx) y resuelve la nota
   en amarillo: define quién es el responsable legal del tratamiento de datos (¿el equipo del
   taller, una asociación de estudiantes, la UNJBG?) y reemplaza los correos de contacto
   placeholder (`privacidad@emprendeunjbg.com`, `soporte@emprendeunjbg.com`) por uno real que el
   equipo revise.
2. Pide que un asesor legal o la oficina competente de la UNJBG revise ambos documentos — el
   texto actual es una plantilla funcional, no asesoría legal.
3. En **Google Play Console > App content > Data safety**, declara los datos que se listan en
   la sección "Qué datos recopilamos" de `/privacidad`, y pega la URL de `/eliminar-cuenta` en
   el campo de solicitud de eliminación de datos.
4. En **App Store Connect > App Privacy**, completa el cuestionario de privacidad con la misma
   información y pega la URL de `/privacidad` en "Privacy Policy URL".

La eliminación de cuenta es funcional de extremo a extremo: el botón en `/mi-cuenta` (web) y en
la pestaña Perfil (móvil) llama a [`/api/cuenta`](apps/web/src/app/api/cuenta/route.ts), que
verifica la sesión, borra los archivos del usuario en Storage y elimina el usuario en Supabase
Auth (lo que en cascada borra su perfil, emprendimiento, productos y pagos).

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
