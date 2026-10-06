# Ker Hub — frontend

App clínica (React 18 + Vite + TypeScript + Tailwind + shadcn/ui). La API y la base viven en el
repositorio `branzontech/smartform-backend` (Hono + Better Auth + Neon); este front habla con ella por
`/api` (`src/integrations/datos/cliente.ts`, `src/integrations/api/client.ts`). Nada de Supabase.

## Ramas

- `dev`: la que se despliega en Railway (`kerhub-web`). Todo el trabajo va aquí.
- `main`: sincronizada con Lovable; no tocar.

## UX/UI

Antes de crear o cambiar cualquier pantalla, seguir **`docs/ux-ui/convenciones.md`** y usar la skill
`.claude/skills/ui-ux-pro-max/`. Las convenciones del equipo y la marca mandan sobre la skill.

## Comprobaciones

- `npx tsc -p tsconfig.app.json --noEmit`
- `npx eslint <archivos>` (los `no-explicit-any` existentes son deuda conocida)
- `npm run build`
- Instalar con `npm install` (el `.npmrc` ya fija el registro oficial y `legacy-peer-deps`).
