# Contribuir

## Flujo de trabajo (trunk-based)

1. Crea una rama corta desde `main`: `feat/nombre-corto`, `fix/nombre-corto`, `chore/nombre-corto`.
2. Commits siguiendo [Conventional Commits](https://www.conventionalcommits.org/es/):
   `feat: agrega filtro de precio al catálogo`, `fix: corrige validación de whatsapp`.
3. Abre un Pull Request hacia `main` usando la plantilla. Necesitas al menos 1 aprobación y
   que el CI (`pnpm lint`, `pnpm typecheck`, build) pase en verde.
4. Mergea con "Squash and merge" para mantener el historial de `main` limpio.

No se trabaja directamente sobre `main`, y no se usan ramas de larga duración tipo
`develop`/`release`: cada rama vive lo que dura su PR.

## Antes de abrir un PR

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm build
```

## Estructura del monorepo

Ver [README.md](./README.md#estructura-del-monorepo).

## Variables de entorno

Cada app tiene su propio `.env.example` (`apps/web/.env.example`,
`apps/mobile/.env.example`). Cópialo a `.env.local` / `.env` y complétalo con las
credenciales del proyecto de Supabase compartido por el equipo — nunca commitees esos
archivos.

## Cambios al esquema de base de datos

Todo cambio de esquema va en una migración nueva dentro de `supabase/migrations/`
(numerada secuencialmente), nunca editando una migración ya mergeada a `main`. Si agregas
una categoría nueva, actualiza también `packages/core/src/constants/categorias.ts` y
`supabase/seed/seed.sql` en el mismo PR para que no se desincronicen.
