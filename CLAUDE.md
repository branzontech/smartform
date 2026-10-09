# Ker Hub — frontend

App clínica (React 18 + Vite + TypeScript + Tailwind + shadcn/ui). La API y la base viven en el
repositorio `branzontech/smartform-backend` (Hono + Better Auth + Neon); este front habla con ella por
`/api` (`src/integrations/data/client.ts`, `src/integrations/api/client.ts`). Nada de Supabase.

## Leer antes de tocar nada

**`docs/kerhub_docs.md`** es el documento del producto y manda sobre todo lo demás. Lo esencial:

- **Interoperabilidad HL7 FHIR R4.** Cada tabla clínica corresponde a un recurso (pacientes = Patient,
  admisiones = Encounter, formularios = Questionnaire, respuestas = QuestionnaireResponse, pagadores =
  Organization…). Antes de crear algo clínico, identificar su recurso FHIR. Toda tabla clínica lleva
  `fhir_extensions` (jsonb). El backend expone `/api/fhir/R4` (solo lectura).
- **Varios países** (Colombia, México, Ecuador, Perú). Nada regulatorio fijo en el código: idioma y
  formatos, moneda, tipos de documento, regímenes y pagadores salen de la configuración del país
  (`src/config/country`) o de `metadata_regulatoria` / `datos_regulatorios` / `fhir_extensions`.
- **Terminologías** con su URI de sistema (CIE-10/11, CUPS, ATC, LOINC, SNOMED).

## Idioma

| Qué | Idioma |
|---|---|
| Código: variables, funciones, componentes, tipos, archivos, rutas de la API | Inglés |
| Interfaz: etiquetas, mensajes, textos que ve el usuario | Español |
| Tablas y columnas de la base | Español, plural, snake_case (`pacientes`, `numero_documento`) |

Los tipos que reflejan filas de la base conservan los nombres de las columnas.

## Datos remotos

Siempre con TanStack React Query (`useQuery` / `useMutation`), nunca `useState` + `useEffect` para
cargar datos. Validación de entradas con Zod.

## Ramas

- `dev`: la que se despliega en Railway (`kerhub-web`). Todo el trabajo va aquí.
- `main`: sincronizada con Lovable; no tocar.

## UX/UI

Antes de crear o cambiar cualquier pantalla, seguir **`docs/ux-ui/convenciones.md`** y
**`docs/ux-ui/sistema-diseno.md`** (tarjetas, cifras, calendario: `src/components/kit/surface/`), y usar la skill
`.claude/skills/ui-ux-pro-max/`. Las convenciones del equipo y la marca mandan sobre la skill. Toda
tabla usa el kit `src/components/kit/` (modelo: `src/pages/patients/PatientList.tsx`).

## Comprobaciones

- `npx tsc -p tsconfig.app.json --noEmit`
- `npx eslint <archivos>` (los `no-explicit-any` existentes son deuda conocida)
- `npm run build`
- Instalar con `npm install` (el `.npmrc` ya fija el registro oficial y `legacy-peer-deps`).
