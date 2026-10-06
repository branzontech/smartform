# React Doctor — frontend SmartForm (2026-10-06)

`npx react-doctor@0.9.17 .` sobre `main` (commit `eb46f17`). Resultado completo en
`docs/react-doctor-2026-10-06.json`.

**Puntuación: 27/100 («Critical»)** — 860 hallazgos (63 errores, 797 avisos) en 224 archivos.

| Categoría | Hallazgos |
|---|---|
| Accesibilidad | 299 |
| Rendimiento | 221 |
| Errores (bugs) | 199 |
| Mantenibilidad | 119 |
| Seguridad | 22 |

## Errores (63)

| Regla | Cantidad | Qué pasa |
|---|---|---|
| `no-layout-property-animation` | 31 en 9 archivos | Se anima `height`: la página se recalcula en cada fotograma (tirones). |
| `effect-needs-cleanup` | 18 en 11 archivos | `setTimeout`/`addListener`/`watch` sin limpieza: fugas y actualizaciones sobre componentes desmontados (ZoneMap, DistanceCalculator, useGoogleMaps, CatalogoProductosPage ×6, FormViewer…). |
| `supabase-rls-policy-risk` | 11 migraciones | Políticas que permiten escribir a cualquiera. Confirma la revisión manual; se corrige en el backend nuevo. |
| `supabase-client-owned-authz-field` | `src/lib/correccionService.ts:49` | El navegador escribe campos de usuario/rol que debería fijar el servidor. |
| `no-prop-callback-in-render` | `src/components/correcciones/CorrectionDialog.tsx:105` | Un callback del padre se ejecuta durante el render: puede dispararse varias veces. |
| `require-reduced-motion` | proyecto | Usa framer-motion sin respetar `prefers-reduced-motion` (WCAG 2.3.3). |

## Seguridad (avisos)

- **HTML inyectado** (`document.write` con plantillas): `utils/print-utils.ts:67`,
  `utils/orders/order-actions.ts:16`, `utils/incapacidades/incapacidad-actions.ts:16`,
  `components/forms/RegistroAtenciones.tsx:349,401`, `utils/forms/form-document.ts:314`.
  `form-document.ts` sí escapa las respuestas; los demás hay que revisarlos campo por campo
  (nombre del paciente, diagnóstico…) porque es una vía de XSS.
- **Clave de Google Maps en `localStorage`**: `AppointmentWizard.tsx:66`, `ZonesPage.tsx:128,329,340`.
  La entrega la función `get-maps-config` a cualquiera. Debe quedar restringida por dominio
  en Google Cloud o servirse desde el backend.

## Errores lógicos frecuentes (avisos)

- 62 `key={index}` en listas que se reordenan o filtran (43 archivos): se pueden enviar datos de la fila equivocada.
- 31 `useEffect` con dependencias incompletas (datos viejos en pantalla).
- 24 indicadores de «cargando» que no se apagan si la petición falla (falta `finally`).
- 17 `setState` después de `await` dentro de efectos (respuestas que llegan desordenadas).
- 6 componentes definidos dentro de otros (`DoctorAppointments`, `NotificationCenter`,
  `AppointmentList`, `NewConsultation`, `PatientMedicationPanel`): pierden su estado en cada render.

## Accesibilidad

73 controles sin nombre, 68 etiquetas sin `htmlFor`, 64 botones de solo icono sin `aria-label`,
40 campos con solo placeholder y 25 clics sin equivalente de teclado.

## Rendimiento y mantenibilidad

- 41 importaciones de `motion` completas (~30 kB): usar `LazyMotion` + `m`.
- 39 `transition-all`; 10 importaciones de `recharts` que podrían cargarse bajo demanda.
- 56 componentes de más de 300 líneas. Los archivos con más hallazgos: `pages/FormViewer.tsx` (31),
  `config/ServiciosClinicosConfig.tsx` (29), `ordenes/OrdenProcedimientoDialog.tsx` (22),
  `pages/patients/NewConsultation.tsx` (21), `pages/appointments/AppointmentList.tsx` (20).

## Orden sugerido

1. Seguridad: escapar todo lo que entra en las plantillas de impresión y sacar la clave de Maps del navegador.
2. Fugas de efectos (`effect-needs-cleanup`) y `finally` en los indicadores de carga.
3. `key={index}` en listas editables (formularios, ítems de órdenes y cotizaciones).
4. Accesibilidad de botones de icono y etiquetas (lote mecánico).
5. Rendimiento: `LazyMotion`, `transition-all`, carga diferida de `recharts`.
