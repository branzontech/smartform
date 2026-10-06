# Auditoría UX/UI estática del frontend de Ker Hub

- Repositorio: `C:\Users\Deimer Domingo\Music\smartform`, rama `dev` (último commit `c51970e`).
- Alcance: `src/` (306 `.tsx` + 64 `.ts`, unas 80 000 líneas). Solo lectura, no se modificó nada.
- Fuentes de reglas: `.claude/skills/ui-ux-pro-max/references/quick-reference.md` (ids entre comillas invertidas), `pro-rules.md`, consultas a `search.py --stack shadcn|react`, y las convenciones de Ker Hub, que tienen prioridad.
- Método: conteos con `grep -rnE` sobre `src` y dos analizadores pequeños en Node (botones de solo icono, celdas de tabla, elementos clicables). Salvo que se diga otra cosa, los conteos excluyen `src/components/ui/` (las primitivas de shadcn).
- Nota: en la copia de trabajo hay trabajo **sin confirmar** (`src/components/kit/**`, `src/components/ui/searchable-select.tsx`, cambios en `ui/table.tsx` e `index.css`). Ninguna pantalla lo usa todavía (0 importaciones de `kit/tabla`), así que no altera los conteos. Ese kit es justo el arreglo previsto para varios hallazgos de tablas y desplegables.
- «Verificar en navegador» marca lo que no se puede confirmar sin ejecutar la app.

---

## 1. Tabla resumen

| Categoría | Hallazgos | CRÍTICA | ALTA | MEDIA | BAJA |
|---|---:|---:|---:|---:|---:|
| Accesibilidad | 8 | 2 | 3 | 3 | 0 |
| Interacción / táctil | 5 | 1 | 2 | 2 | 0 |
| Rendimiento percibido | 4 | 0 | 2 | 1 | 1 |
| Estilo / consistencia | 5 | 0 | 1 | 2 | 2 |
| Layout / responsive | 5 | 0 | 1 | 2 | 2 |
| Tipografía y color | 5 | 0 | 2 | 2 | 1 |
| Animación | 3 | 0 | 0 | 2 | 1 |
| Formularios y feedback | 5 | 0 | 2 | 2 | 1 |
| Navegación | 5 | 0 | 1 | 2 | 2 |
| Datos / gráficas | 5 | 1 | 0 | 2 | 2 |
| Convenciones Ker Hub | 10 | 1 | 7 | 1 | 1 |
| **Total** | **60** | **5** | **21** | **21** | **13** |

---

## 2. Hallazgos por categoría

### 2.1 Accesibilidad

**A1. Botones de solo icono sin nombre accesible. CRÍTICA** (`aria-labels`, `icon-context`)
- 39 botones de solo icono no tienen `aria-label` ni `sr-only` (analizador de bloques JSX). Ninguna de las 75 líneas con `size="icon"` lleva `aria-label`, y en todo `src` solo hay 11 `aria-label`. 4 usan `title` como sustituto, lo que no basta.
- Ejemplos: `src/components/chat/ChatInterface.tsx:171` (5 en el archivo), `src/components/appointments/PatientPanel.tsx:150` (4), `src/components/ai-assistant/AIAssistant.tsx:141`, `src/components/appointments/scheduling/SchedulingSidebar.tsx:397`, `src/components/appointments/wizard/MapPanelDrawer.tsx:90`, `src/pages/inventory/InventoryList.tsx` (3).
- Arreglo: poner `aria-label="Editar paciente"` (en español y con el objeto) en cada `<Button size="icon">`, y `aria-hidden` en el icono de lucide. Conviene una regla de ESLint (`jsx-a11y/control-has-associated-label`) o un `IconButton` del kit que exija `etiqueta: string`.

**A2. Elementos clicables que no son botones y no funcionan con teclado. CRÍTICA** (`keyboard-nav`)
- De 44 `div/li/Card/tr/TableRow` con `onClick`, 43 no tienen `role`, `tabIndex` ni `onKeyDown`.
- Ejemplos: `src/components/admissions/DiagnosisSearch.tsx:216` (resultado de diagnóstico), `src/components/admissions/PatientSearch.tsx:216` (resultado de paciente), `src/components/appointments/PatientPanel.tsx:228`, `src/components/appointments/wizard/AdmissionStep.tsx:279` y `:298` (tarjetas de selección), `src/pages/cotizaciones/CotizacionList.tsx:298` (fila).
- Arreglo: en listas de resultados usar `<button type="button" className="w-full text-left …">` o el `Command` de shadcn (ya trae flechas y Enter). En filas, poner un `<Link>`/`<button>` en la primera celda en lugar del `onClick` en `TableRow`.

**A3. Modales hechos a mano sin semántica de diálogo. ALTA** (`escape-routes`, `focus-not-obscured`)
- 4 superposiciones `fixed inset-0` sin `role="dialog"`, sin `aria-modal`, sin manejar Escape y sin atrapar el foco (0 de 4).
- Ejemplos: `src/components/layout/SearchModal.tsx:74`, `src/components/layout/AppLauncherModal.tsx:71`, `src/components/medical/MedicationManager.tsx:407`, `src/components/appointments/wizard/MapPanelDrawer.tsx:66` y `:75`.
- Arreglo: migrarlas a `Dialog`/`Sheet` de Radix (foco, Escape y `aria` incluidos), o a `CommandDialog` en el caso del buscador, que ya existe en `layout/index.tsx`.

**A4. Campos sin etiqueta. ALTA** (`form-labels`, `input-labels`)
- 105 de 284 `<Input>` no tienen `Label`/`FormLabel` ni `aria-label` cerca (±5 líneas). En su mayoría son buscadores con solo marcador de posición. Solo 2 `<Input … id=>` en la misma línea frente a 118 `htmlFor`.
- Ejemplos: `src/components/admissions/DiagnosisSearch.tsx:189`, `src/components/admissions/PatientSearch.tsx:191`, `src/components/appointments/PatientPanel.tsx:209`, `src/components/appointments/wizard/PatientSearchStep.tsx:258`, `src/components/billing/InvoiceList.tsx:96`.
- Arreglo: dar a los buscadores `aria-label="Buscar paciente por nombre o documento"`. En formularios, usar `<Label htmlFor>` con `id` o `FormField` de react-hook-form.

**A5. Errores y cambios de estado no se anuncian. MEDIA** (`aria-live-errors`, `contextual-live-badge-updates`)
- Fuera de `ui/` hay 0 `role="alert"`/`aria-live` y 5 `aria-invalid`/`aria-describedby`. Las 66 `<FormMessage>` de react-hook-form sí los cubren, pero los formularios manuales (consulta, órdenes, inventario) no.
- Ejemplos: `src/components/orders/MedicationOrderForm.tsx`, `src/components/inventario/RegistrarMovimientoDialog.tsx`, `src/pages/patients/NewConsultation.tsx`.
- Arreglo: poner `aria-invalid` y `aria-describedby` con un `<p id role="alert">` bajo cada campo con error.

**A6. Estructura de página. MEDIA** (`skip-links`, `heading-hierarchy`, `focus-on-route-change`)
- No hay enlace para saltar al contenido (0 resultados).
- Hay 26 `<main>` en 21 archivos: el de `layout/index.tsx:119` más unos 20 `<main>` dentro de páginas, así que quedan landmarks `main` anidados (p. ej. `src/pages/patients/PatientList.tsx:207`, `src/components/config/settings.tsx:315`, `src/pages/appointments/AppointmentList.tsx:796`).
- El título del documento solo cambia en 1 de 60 páginas (`Helmet`).
- Arreglo: dejar un solo `<main id="contenido">` en el layout y convertir los de las páginas en `<div>`/`<section>`. Añadir el enlace «Saltar al contenido». Poner un `<Helmet><title>Pacientes · Ker Hub</title>` por ruta y llevar el foco al `h1` al cambiar de ruta.

**A7. Contraste dudoso. ALTA** (`color-contrast`, `color-accessible-pairs`)
- `text-gray-400`: 125 usos (unos 2,5:1 sobre blanco, no cumple).
- `text-muted-foreground/40…/60`: 69 usos (el gris atenuado con opacidad baja de 4,5:1).
- `text-lime` como color de texto: 44 usos (la lima de marca sobre fondo claro da unos 1,5:1).
- Ejemplos: `src/components/appointments/scheduling/AppointmentTypeSelector.tsx:302`, `src/components/appointments/scheduling/DoctorSearchCombobox.tsx:162`, `src/components/appointments/scheduling/DoctorStatsDrawer.tsx:378`, `src/components/appointments/wizard/PatientSearchStep.tsx:388`.
- Arreglo: usar `text-muted-foreground` sin opacidad como mínimo. La lima solo como fondo (`bg-lime text-lime-foreground`), nunca como texto sobre claro. Verificar en navegador con el verificador de contraste en los dos temas.

**A8. Información solo por color. MEDIA** (`color-not-only`)
- El indicador de existencias `StockDot` (`src/pages/inventario/InventarioPage.tsx:261`, usado en `:544`) distingue agotado, bajo y normal solo por color.
- Las tarjetas de cita en `src/pages/appointments/AppointmentList.tsx:390-394` codifican el estado con color de fondo y barra.
- El punto de estado del formulario en `src/pages/FormViewer.tsx:1381`.
- Arreglo: añadir texto («Agotado», «Bajo») o un icono con `aria-label`.

> Positivo: `App.tsx` envuelve la app en `MotionConfig reducedMotion="user"`, `index.html` declara `lang="es"`, y la metaetiqueta viewport no bloquea el zoom.

### 2.2 Interacción / táctil

**I1. Botones flotantes superpuestos en todas las pantallas. CRÍTICA** (`z-index-management`, `fixed-element-offset`)
- `FloatingChatButton` (`src/components/layout/floating-chat-button.tsx:18`) y el botón del Asistente IA (`src/components/ai-assistant/AIAssistant.tsx:122`, montado en `src/routes/AppRoutes.tsx:124`) usan los dos `fixed bottom-6 right-6 z-50 w-14 h-14`.
- En Configuración, el botón «Guardar» (`src/components/config/settings.tsx:562`) también está en `fixed bottom-6 right-6 z-50`.
- Con el mismo `z-50`, gana el que va después en el DOM, y `FloatingChatButton` se monta después de `<main>`. El chat tapa al asistente en todas las rutas y tapa «Guardar» en Configuración. Verificar en navegador.
- Arreglo: dejar un solo lanzador flotante, o apilarlos (`bottom-24` para el segundo). Sacar «Guardar» de Configuración a la barra superior del módulo y ocultar los flotantes en rutas de edición.

**I2. Acciones que solo aparecen al pasar el ratón. ALTA** (`hover-vs-tap`)
- 10 casos de `opacity-0 group-hover:opacity-100`, y solo 1 tiene su pareja `focus-within`/`focus-visible`. En pantalla táctil o con teclado, las acciones no se ven.
- Ejemplos: `src/components/customers/CustomerTable.tsx:236` (menú de acciones de la fila), `src/components/config/settings.tsx:465`, `src/components/ui/question.tsx:127`, `src/components/forms/question/index.tsx:58`, `src/components/config/InstitutionHeaderConfig.tsx:324`.
- Arreglo: dejarlas visibles (la convención de tablas lo exige) o, como mínimo, añadir `group-focus-within:opacity-100 focus-visible:opacity-100`.

**I3. Objetivos pequeños. MEDIA** (`web-target-size` de 24×24 px, `touch-target-size`)
- 4 botones `h-6` (`src/components/customers/CustomerContact.tsx:46`, `:61`, `:76`, `src/components/customers/CustomerFilters.tsx:198`).
- 4 botones de icono `h-5…h-7` (`SchedulingSidebar.tsx:397`, `InstitutionHeaderConfig.tsx:322`, `orders/RightPanelTabs.tsx:339`, `catalogo/CatalogoProductosPage.tsx:439`).
- 22 botones `h-7` y 48 `Input`/`SelectTrigger` `h-7`/`h-8`. Eliminar con icono de `w-2.5` en `src/components/zones/ZoneSidebar.tsx:251` y `src/components/zones/DistanceCalculator.tsx:455`.
- Arreglo: como mínimo `h-8 w-8` (32 px) en escritorio y `h-10` en tabletas. Para iconos pequeños, ampliar el área con `p-2` o `after:absolute after:-inset-2`.

**I4. Botones que no hacen nada. ALTA** (`state-clarity`, `disabled-states`)
- `src/pages/reports/ReportsPage.tsx:175` (eliminar) y `:172` (descargar) no tienen `onClick`.
- Arreglo: conectarlos, o quitarlos o deshabilitarlos con explicación.

**I5. Barras de desplazamiento invisibles en toda la app. MEDIA** (`no-precision-required`, `scroll-behavior`)
- `src/index.css:95-127` aplica a `*` una barra de 4 px, transparente salvo al pasar el ratón (`border/0.4`). El usuario no ve que hay más contenido y le cuesta agarrarla.
- Arreglo: barra de 6–8 px siempre visible y discreta en los contenedores que se desplazan. La clase `.scroll-tabla` del trabajo en curso va en esa línea. Verificar en navegador.

### 2.3 Rendimiento percibido

**P1. Spinners en lugar de esqueletos. ALTA** (`progressive-loading`, `loading-states`; convención «Skeleton, nunca Cargando…»)
- 76 `animate-spin` en 48 archivos, de los cuales 33 son spinners de vista (`h-5` o más). 17 textos «Cargando…» en 16 archivos. `<Skeleton>` solo aparece en 5 archivos.
- Ejemplos: `src/components/auth/ProtectedRoute.tsx:12-13`, `src/components/patients/PatientHistoryPanel.tsx:250`, `src/components/patients/PatientAdmissionHistoryPanel.tsx:169`, `src/components/shifts/ShiftVisualization.tsx:468-469`, `src/components/forms/RegistroAtenciones.tsx:417`.
- Arreglo: esqueletos con la forma del contenido (`TablaSkeleton` del kit, o tarjetas y filas con `Skeleton`). Reservar `Loader2` para el botón que envía.

**P2. Sin división de código. ALTA** (`bundle-splitting`, `lazy-loading`)
- 0 `lazy()`. `src/routes/AppRoutes.tsx` importa 54 módulos de forma estática. `dist/assets/index-BIsXreTU.js` pesa 2,99 MB en un solo fragmento, más 175 KB de CSS.
- Arreglo: `const PatientList = lazy(() => import("@/pages/patients/PatientList"))` por ruta, con `<Suspense fallback={<EsqueletoPagina/>}>`. Cargar aparte recharts, `@xyflow/react` y los mapas.

**P3. Listas largas sin virtualizar. MEDIA** (`virtualize-lists`)
- No hay ninguna librería de virtualización. Hay listas con `.map` de datos de la base (`PatientList`, `AppointmentList`, `PriceLists`, `CatalogoProductosPage`). Verificar en navegador con volúmenes reales; si pasan de unos 100 elementos, paginar (el kit trae `PaginacionTabla`) o virtualizar.

**P4. Imágenes sin dimensiones. BAJA** (`image-dimension`, `lazy-load-below-fold`)
- 14 `<img>`, 2 con `loading="lazy"` y 0 con `width`/`height`. Arreglo: declarar dimensiones o `aspect-square`.

### 2.4 Estilo / consistencia

**S1. Colores hex en componentes. ALTA** (`color-semantic`; convención «cero hex»)
- 191 hex en 32 archivos. Sin contar las plantillas de impresión de `src/utils/*-document.ts` (52) ni `ui/` (7), quedan **132 en 25 componentes y páginas**.
- Ejemplos: `src/components/zones/DistanceCalculator.tsx` (33), `src/pages/FormCreator.tsx` (24), `src/pages/billing/PriceLists.tsx` (13), `src/components/customers/CustomerStats.tsx:83` (12), `src/components/billing/BillingReports.tsx:94` (8).
- Arreglo: `hsl(var(--primary))`/`hsl(var(--lime))` en SVG y estilos, y las variables `--chart-1…5` para gráficas. En mapas de Google, leer las variables con `getComputedStyle`.

**S2. Paleta cruda de Tailwind en lugar de tokens. MEDIA** (`color-semantic`, `dark-mode-pairing`)
- 1480 usos de `red/green/blue/yellow/purple/amber/emerald…-N` en 136 archivos. 884 de `gray/slate/zinc-N` en 110 archivos. 63 `bg-white`, 33 de ellos sin variante `dark:`.
- `index.css` no define tokens `success`, `warning` ni `info`, y por eso cada pantalla elige su verde o su ámbar.
- Arreglo: añadir `--exito`, `--aviso` e `--info` (claro y oscuro) en `index.css` y `tailwind.config.ts`, y sustituir por fases empezando por insignias de estado.

**S3. Dos sistemas de notificaciones. MEDIA** (`consistency`)
- `useToast` de shadcn en 42 archivos y `sonner` en 39. Se montan los dos `<Toaster/>` (`App.tsx`), con estilos y posiciones distintas.
- Arreglo: quedarse con `sonner` y crear un ayudante `notificar.exito/error`.

**S4. Escala de radios y sombras dispersa. BAJA** (`elevation-consistent`)
- Radios: `rounded-md` 93, `rounded-lg` 246, `rounded-xl` 354, `rounded-2xl` 76, `rounded-3xl` 8.
- Sombras: `shadow-lg` 53, `shadow-xl` 11, `shadow-2xl` 5, más 8 valores arbitrarios.
- Arreglo: fijar 3 niveles por tipo de superficie (tarjeta, menú, diálogo).

**S5. Desenfoque y degradados decorativos. BAJA** (`blur-purpose`, `effects-match-style`)
- 81 `backdrop-blur` y 59 `bg-gradient-to`, por ejemplo el botón del asistente con degradado morado e índigo (`AIAssistant.tsx:122`) y el degradado de `SchedulingStep.tsx:1242`.
- Arreglo: reservar el desenfoque para el fondo de los modales y usar color plano de marca.

### 2.5 Layout / responsive

**L1. Doble y triple scroll. ALTA** (`scroll-behavior`; convención «nunca doble scroll»)
- El contenedor principal ya se desplaza (`src/components/layout/index.tsx:119`, `main … overflow-y-auto`). Dentro hay 76 `overflow-auto/scroll` y 33 `ScrollArea`. Se identificaron **18 anidamientos**:
  - `src/pages/patients/PatientList.tsx:207`: otro `<main overflow-y-auto>` dentro del principal.
  - `src/pages/appointments/AppointmentList.tsx:972`: `overflow-auto max-h-[600px] pb-40`.
  - `src/pages/patients/NewConsultation.tsx:485` → `:555` (`ScrollArea h-[260px]`) → `:784` (`max-h-[240px]`): triple scroll en la consulta médica.
  - `src/components/appointments/scheduling/SchedulingSidebar.tsx:342` → `:600` → `:711`.
  - `src/components/inventario/ProductoDialog.tsx:356` + `:365` y `src/components/inventario/RegistrarMovimientoDialog.tsx:340` + `:349`: `DialogContent overflow-y-auto` con otro cuerpo `overflow-y-auto` dentro.
  - También `components/config/settings.tsx:315` → `ServiciosClinicosConfig.tsx:291/322`, `PatientSearchStep.tsx:236` → `:284`, `FormViewer.tsx:1330` → `:1461`, `shifts/ShiftAssignment.tsx:347`, `shifts/ShiftModification.tsx:262`, `medical/MedicationManager.tsx:316/367`, `customers/NotificationForm.tsx:605` y `billing/ContractsPage.tsx:593`.
- Arreglo: un único contenedor que se desplaza por vista. En diálogos, `DialogContent flex flex-col max-h-[85vh] overflow-hidden` con cabecera y pie fijos y un solo cuerpo `flex-1 overflow-y-auto`. Las listas internas crecen sin `max-h`.

**L2. Alturas con `100vh`. MEDIA** (`viewport-units`)
- 52 usos de `h-screen`, `min-h-screen` o `100vh`, y 0 de `dvh`. En tabletas, la barra del navegador corta los pies de página.
- Arreglo: usar `h-dvh` o `min-h-dvh`.

**L3. Anchos fijos que rompen en tableta. MEDIA** (`horizontal-scroll`, `mobile-first`)
- 13 `w-[≥300px]` y 26 `min-w-[px]`. Ejemplos: `src/components/layout/enhanced-nav-menu.tsx:43` (`w-[800px]`), `src/components/customers/CustomerReminders.tsx:245` (`w-[550px]`), `src/components/locations/OfficeFloorPlan.tsx:175`, `src/components/appointments/scheduling/DoctorStatsDrawer.tsx:165`.
- 24 rejillas de 3 o más columnas sin prefijo responsive.
- Arreglo: `w-full sm:w-[550px]`, `max-w-[…]`, y `grid-cols-1 md:grid-cols-3`.

**L4. Sin escala de capas. BAJA** (`z-index-management`)
- `z-50` 36 veces, más `z-[100]` (6), `z-[70]`, `z-[60]` y `z-[1]`, sin ningún criterio común. Es la causa directa de I1.
- Arreglo: tokens `z-base/z-flotante/z-menu/z-modal/z-toast` en `tailwind.config.ts`.

**L5. Anchos de contenido desiguales. BAJA** (`container-width`)
- `container` 58, `max-w-7xl` 7, `max-w-6xl` 2, `max-w-5xl` 10. Las páginas cambian de ancho al navegar.
- Arreglo: un solo ancho por tipo de vista (lista a ancho completo, ficha con `max-w-6xl`).

### 2.6 Tipografía y color

**T1. Texto diminuto. ALTA** (`readable-font-size`, `dynamic-type`)
- 368 usos de `text-[8px]`…`text-[11px]` en 55 archivos: `text-[10px]` 228 veces y `text-[8px]`/`text-[9px]` 44.
- Ejemplos: `src/components/appointments/scheduling/DoctorSearchCombobox.tsx:158` (`text-[9px]`), `src/pages/catalogo/CatalogoProductosPage.tsx:426` (estado en `text-[10px]`), `src/components/zones/ZoneSidebar.tsx:250`, `src/components/appointments/scheduling/DoctorStatsDrawer.tsx:378`.
- Arreglo: mínimo `text-xs` (12 px) para metadatos y `text-sm` para datos de tabla. Los usuarios no son técnicos y a menudo trabajan en pantallas pequeñas de consultorio.

**T2. Campos con texto de 12 px. MEDIA** (`readable-font-size`, `touch-friendly-input`)
- 43 `Input`/`SelectTrigger`/`Textarea` con `text-xs`. En iPad o iPhone fuerzan zoom al enfocar.
- Arreglo: `text-base md:text-sm` en los campos.

**T3. Lima como texto. ALTA** (`color-accessible-pairs`)
- 44 `text-lime` (ver A7). La marca se mantiene; solo cambia su uso: la lima va de fondo o acento y nunca como texto sobre claro.

**T4. Formato de números y moneda inconsistente. MEDIA** (`number-tabular`, `number-formatting`)
- 46 `toFixed()` frente a 59 `toLocaleString`/`Intl`. Solo 4 `es-CO` y solo 20 `tabular-nums` en una app con tarifas, cotizaciones y facturas.
- Arreglo: ayudantes `formatearCOP()` y `formatearNumero()` con `Intl.NumberFormat("es-CO")`, más `tabular-nums` en columnas de importes.

**T5. Escala de títulos desigual. BAJA** (`font-scale`)
- Los `h1` usan cinco tamaños: `text-2xl` 20, `text-3xl` 20, `text-xl` 6, `text-4xl` 4, `text-lg` 3. El `EncabezadoModulo` del kit puede unificarlos.

### 2.7 Animación

**AN1. `transition-all` en exceso. MEDIA** (`transform-performance`)
- 110 usos, que también animan ancho, alto y sombra. Arreglo: `transition-colors`, `transition-opacity` o `transition-transform` según el caso.

**AN2. Pulsos infinitos decorativos. MEDIA** (`excessive-motion`, `motion-meaning`, `reduced-motion`)
- 30 `animate-pulse` en 20 archivos: el cerebro del Asistente IA late sin parar (`AIAssistant.tsx:125`), y hay puntos que laten en `SchedulingStep.tsx:1149`, `:1333` y `:1456`.
- `MotionConfig` solo cubre framer-motion. Las animaciones de CSS solo respetan «reducir movimiento» en 19 `motion-safe:`/`motion-reduce:`.
- Arreglo: quitar los pulsos decorativos y usar `motion-safe:animate-…` en los que queden.

**AN3. Duraciones sin tokens. BAJA** (`motion-consistency`)
- Tailwind usa `duration-200` 47, `duration-300` 38, `duration-150` 6, `duration-500` 2 y `duration-1000` 1. framer usa duraciones de 0.15, 0.2, 0.4 y 0.5 s, además de muelles.
- Arreglo: dos o tres tokens (rápido 150 ms, base 200 ms, entrada 250 ms).

### 2.8 Formularios y feedback

**F1. Diálogos nativos del navegador. ALTA** (`confirmation-dialogs`; convención «nunca window.confirm/alert»)
- 2 `window.confirm`: `src/pages/inventory/InventoryDetail.tsx:40` y `src/pages/inventory/InventoryList.tsx:78`.
- 4 `alert()`: `src/utils/forms/form-document.ts:311`, `src/utils/incapacidades/incapacidad-actions.ts:12`, `src/utils/orders/order-actions.ts:12` y `src/utils/print-utils.ts:26`.
- Arreglo: `AlertDialog` para confirmar, y un aviso (`toast`) para «Permite las ventanas emergentes».

**F2. Mensajes técnicos al usuario. MEDIA** (`error-clarity`, `error-recovery`)
- 11 avisos con `description: error.message` en 8 archivos. Ejemplos: `src/components/config/InstitutionHeaderConfig.tsx:206`, `src/components/profile/AvatarUploader.tsx:75`, `src/components/profile/SignatureUploader.tsx:87`, `src/components/zones/DistanceCalculator.tsx:314`.
- Arreglo: un mensaje en español que diga la causa y qué hacer («No se pudo subir el logo. Usa PNG o JPG de menos de 2 MB»). El detalle va a la consola o al registro.

**F3. Estados vacíos ausentes. ALTA** (`empty-states`; convención «estados vacíos en listas y tablas»)
- De 23 archivos con tabla, 6 no tienen ninguna rama para cuando está vacía: `src/components/customers/CustomerTable.tsx`, `src/components/reports/DataTable.tsx`, `src/pages/billing/InvoiceDetail.tsx`, `src/pages/billing/InvoiceForm.tsx`, `src/pages/cotizaciones/CotizacionDetail.tsx` y `src/components/inventario/ProductoDialog.tsx`.
- `EmptyState` (`ui/empty-state.tsx`) solo se usa en 5 archivos.
- Arreglo: `EmptyState` con mensaje y acción primaria («Crear el primer cliente»).

**F4. Campos obligatorios sin marcar. MEDIA** (`required-indicators`)
- Solo 5 asteriscos o marcas de obligatorio en toda la app, con más de 280 campos.
- Arreglo: un `Label` con la prop `obligatorio` que pinte «*» y añada `aria-required`.

**F5. Tipos de campo semánticos escasos. BAJA** (`input-type-keyboard`, `autofill-support`)
- 14 `type="email|tel"`, 3 `inputMode` y 4 `autoComplete`. Arreglo: `inputMode="numeric"` en documentos y teléfonos, y `autoComplete` en los datos del paciente.

### 2.9 Navegación

**N1. Modal sobre modal y superposición sobre superposición. ALTA** (`modal-vs-navigation`; convención «nunca modal encima de modal»)
- `src/components/correcciones/CorrectionDialog.tsx:381` abre un `AlertDialog` (`:391`) encima del `Dialog` abierto (`:159`).
- `MapPanelDrawer` (`z-[60]`/`z-[70]`) se abre sobre el paso de agenda, que ya es una capa `fixed inset-0 z-50` (`SchedulingStep.tsx:856`). Verificar en navegador.
- Arreglo: confirmar dentro del mismo diálogo, con un segundo paso en el pie («¿Confirmas?» con los botones Cancelar y Aplicar corrección). Hacer el mapa como panel lateral dentro del paso.

**N2. El título del documento no cambia. MEDIA** (`deep-linking`, `state-preservation`)
- `Helmet` aparece en 1 de 60 páginas. Todas las pestañas del navegador dicen «Ker Hub | El futuro del cuidado…». Arreglo: un título por ruta (ver A6).

**N3. Sin foco al cambiar de ruta. MEDIA** (`focus-on-route-change`)
- No hay ningún manejo. Arreglo: un efecto en el layout que enfoque el `h1` o `#contenido` cuando cambie `location.pathname`.

**N4. Sin migas de pan en jerarquías profundas. BAJA** (`breadcrumb-web`)
- 0 `Breadcrumb` usados, aunque hay rutas de tres niveles (`configuracion/catalogo-productos`, `clientes/notificaciones/nueva`). Hay 42 `BackButton`, lo cual está bien. Arreglo: migas en el `EncabezadoModulo`.

**N5. «Cerrar sesión» duplicado. BAJA** (`navigation-consistency`)
- Aparece en `src/components/layout/header.tsx:305` («Cerrar sesión») y en `src/components/layout/app-sidebar.tsx:222` («Cerrar Sesión», con otra capitalización). Los dos están dentro de barras, así que cumplen la convención. Arreglo: un único sitio y redacción en minúsculas.

### 2.10 Datos / gráficas

**D1. Datos simulados en pantallas reales. CRÍTICA** (`empty-data-state`, `error-feedback`)
- 142 referencias `mock*` en 39 archivos, por ejemplo `billing/BillingReports.tsx`, `billing/BillingStats.tsx`, `billing/InvoiceList.tsx`, `billing/PendingPayments.tsx`, `chat/ChatInterface.tsx`, `appointments/scheduling/AppointmentActionsPanel.tsx:324` (`mockOffices`), `DoctorStatsDrawer.tsx` y `WaitingListPanel.tsx`.
- En una app clínica y de facturación, ver cifras inventadas lleva a decisiones erróneas. Verificar en navegador qué rutas las muestran.
- Arreglo: conectar a la API, o mostrar un estado vacío o «Módulo en preparación» y ocultar la ruta del menú.

**D2. Gráficas con colores hex y sin modo oscuro. MEDIA** (`color-guidance`, `contrast-data`)
- Los 9 archivos de gráficas usan hex (37 en total). Solo 6 usan `ChartContainer` de `ui/chart`. Ejemplos: `src/components/customers/CustomerStats.tsx:83`, `src/components/billing/BillingReports.tsx:139`, `src/components/patients/dashboard/consultations-status-chart.tsx` y `patients-by-gender-chart.tsx`.
- Arreglo: `ChartContainer` con `config` y colores `var(--chart-n)`, derivados del morado y la lima de marca.

**D3. Gráficas sin estado de carga ni vacío. MEDIA** (`loading-chart`, `empty-data-state`)
- Ninguno de los 9 archivos de gráficas tiene esqueleto. Solo 2 tratan el caso vacío (`DoctorStatisticsPanel.tsx` y `ReportPreview.tsx`).

**D4. Gráficas de pastel. BAJA** (`no-pie-overuse`)
- 8 `PieChart`. Hay que verificar en navegador que ninguno pase de 5 categorías (`consultations-status-chart` tiene 2).

**D5. Tablas sin ordenar. BAJA** (`sortable-table`)
- 0 `aria-sort`. El kit trae `MenusOrdenOpciones`, que puede resolverlo.

### 2.11 Convenciones Ker Hub

**K1. Puntos de color en etiquetas de estado. ALTA**
- 14 puntos `rounded-full` de 1,5–2 en 11 archivos. Son infracciones claras (punto junto a un texto de estado o como única señal de estado):
  - `src/components/workflow/WorkflowBuilder.tsx:269` (`Badge` «● Activo»)
  - `src/pages/catalogo/CatalogoProductosPage.tsx:430` (columna Estado, «● Activo»)
  - `src/pages/inventario/InventarioPage.tsx:267`/`:544` (`StockDot`)
  - `src/components/patients/AdmissionHistorySection.tsx:89`
  - `src/pages/patients/NewConsultation.tsx:788`
  - `src/pages/FormViewer.tsx:1381`
- El resto son marcadores de línea de tiempo o calendario.
- Arreglo: dejar solo el texto, con un tinte de fondo si hace falta (`bg-primary/10 text-primary`).

**K2. Barra lateral de acento. ALTA**
- 14 `border-l-2/4` en 8 archivos (sin contar las 2 citas neutras). Casos:
  - `src/components/config/settings.tsx:284` (elemento activo del menú de Configuración)
  - `src/components/forms/RegistroAtenciones.tsx:686-687` (fila seleccionada)
  - `src/components/forms/question/index.tsx:54` (al pasar el ratón)
  - `src/pages/appointments/AppointmentList.tsx:390-394` (estado de la cita)
  - `src/components/user-portal/AppointmentsSection.tsx:217`
  - `src/components/reports/ChartBuilder.tsx:53`
  - `src/components/forms/RegistroAtenciones.tsx:895`
- Arreglo: tinte (`bg-primary/10`) o anillo neutro (`ring-1 ring-border`).

**K3. Barras de progreso gruesas. ALTA**
- La base `src/components/ui/progress.tsx:13` es `h-4`. 6 usos llevan `h-2`:
  - `src/components/tenant/TenantStatusBar.tsx:52`: se ve en **todas** las pantallas durante la prueba.
  - `DoctorStatsDrawer.tsx:320` y `:327`
  - `locations/OfficeCard.tsx:64`
  - `locations/OfficeFloorPlan.tsx:217`
  - `shifts/ShiftStatsPanel.tsx:113`
- A eso se suma la barra manual de degradado `SchedulingStep.tsx:1242` (`h-2`).
- Arreglo: base de `h-px` (1 px) en `progress.tsx`, o un anillo o una cifra en chip («12 de 30 días»).

**K4. Botón eliminar visible en filas y tarjetas. CRÍTICA**
- 13 botones de eliminar registros a la vista; solo 3 están en un menú «Más acciones» (`CustomerTable.tsx:270`, `CatalogoProductosPage.tsx:451`, `InventoryList.tsx:320`).
- Visibles: `src/pages/cotizaciones/CotizacionList.tsx:321`, `src/pages/inventory/InventoryList.tsx:219` (además con `window.confirm`), `src/pages/reports/ReportsPage.tsx:175` (y sin acción), `src/components/locations/OfficeCard.tsx:101`, `src/components/locations/SiteCard.tsx:82`, `src/components/ui/form-card.tsx:108`, `src/components/customers/CustomerReminders.tsx:461`, `src/components/zones/ZoneSidebar.tsx:245`, `src/pages/inventory/InventoryDetail.tsx:250`, `src/pages/appointments/AppointmentDetail.tsx:387`, `src/components/workflow/WorkflowSidebar.tsx:111`, `src/components/reports/ChartBuilder.tsx:63`, `src/components/zones/DistanceCalculator.tsx:455`.
- **Dos borran sin confirmar.** `ZoneSidebar.tsx:245` llama a `handleDeleteZone` (`src/pages/zones/ZonesPage.tsx:227`), que hace `.delete()` en la base al primer clic. `CustomerReminders.tsx:461` borra al instante.
- Hay además 12 botones de «quitar ítem» en formularios en edición (líneas de orden, de factura o de campos). Son aceptables como «Quitar» de un borrador, pero conviene que sean menos llamativos.
- Arreglo: `DropdownMenu` «Más acciones» y luego `AlertDialog` de confirmación, en todos los casos.

**K5. Modal sobre modal. ALTA.** Ver N1 (`CorrectionDialog.tsx:381`).

**K6. Tablas fuera de convención. ALTA**
- Ninguno de los 23 archivos con tabla fija la columna de acciones a la derecha (0 `sticky right-0`).
- 9 celdas con dos datos o dos líneas: `src/pages/patients/PatientList.tsx:391` (teléfono y correo) y la de última visita (fecha y hora), `src/components/customers/CustomerTable.tsx:196` y `:210`, `src/pages/billing/ContractsPage.tsx:429`, `src/pages/billing/PriceLists.tsx:725`, `src/pages/inventario/InventarioPage.tsx:520` y `src/pages/billing/InvoiceDetail.tsx:170`.
- Las acciones de `CustomerTable.tsx:236` están ocultas hasta pasar el ratón.
- En `PatientList.tsx`, el sexo se pinta con `Badge variant="default"` (morado) para «Masculino».
- Arreglo: migrar al `kit/tabla/TablaDatos` (en curso), con la celda de acciones `sticky right-0 bg-background` y un dato por celda.

**K7. Tarjetas KPI en vistas operativas. MEDIA**
- `src/pages/inventario/InventarioPage.tsx:421-425` (4 `MetricCard` encima del inventario).
- `src/pages/shifts/ShiftManagement.tsx:121` (`ShiftStatsPanel`, 4 tarjetas).
- `src/components/shifts/ShiftVisualization.tsx:269`.
- `src/pages/locations/SiteDetailPage.tsx:234-252` (4 cifras grandes).
- `src/components/appointments/scheduling/DoctorStatsDrawer.tsx` (13 `StatCard` dentro de la agenda).
- Los tableros (`BillingDashboard`, `PatientDashboard`) sí pueden tenerlas.
- Arreglo: mover los indicadores al tablero o a un resumen en una línea de chips.

**K8. Desplegables largos sin buscador y sin orden alfabético. ALTA**
- Solo hay 4 `CommandInput` fuera de `ui/` frente a 133 `<Select>` y 69 `SelectContent` con `.map`. Confirmados con más de 7 opciones:
  - Tipo de documento (unos 22): `appointments/wizard/PatientDetailStep.tsx:293` y `PatientSearchStep.tsx:459`.
  - Forma farmacéutica (16): `inventario/ProductoDialog.tsx:469`.
  - Vía de administración (11): `ProductoDialog.tsx:498` y `orders/MedicationOrderForm.tsx:328`.
  - Horas (29): `scheduling/SchedulingSidebar.tsx:546` y `:562`.
  - Tipos de campo: `config/DynamicFieldConfigurator.tsx:238`.
- `FORMAS` y `VIAS` (`ProductoDialog.tsx:20-22`) no están en orden alfabético.
- Las listas que vienen de la base de datos (contratos, servicios, sedes, médicos, pacientes) hay que verificarlas en navegador.
- Arreglo: el `searchable-select.tsx` en curso (basado en `Command`) para cualquier lista de más de 7 opciones, y `localeCompare("es")` en los maestros.

**K9. Textos en inglés y anglicismos. MEDIA**
- En inglés, dentro de primitivas que se ven o se leen en toda la app:
  - `sr-only "Close"` en `src/components/ui/dialog.tsx:47` y `src/components/ui/sheet.tsx:68`: el lector de pantalla dice «Close» en cada diálogo.
  - `Previous`/`Next` en `src/components/ui/pagination.tsx:73` y `:88`.
  - `"Toggle Sidebar"` en `src/components/ui/sidebar.tsx:296` y `:299`.
- Anglicismos: «Dashboard» en `src/pages/billing/BillingDashboard.tsx:44` y en `src/pages/patients/PatientDashboard.tsx:70` («Dashboard de Pacientes»); «Workflow» en `src/components/workflow/WorkflowBuilder.tsx:363` y `:368`; «Email» en 8 etiquetas (`settings.tsx:511`, `locations/SiteForm.tsx:154`, `customers/NotificationForm.tsx:228`, etc.).
- Arreglo: «Cerrar», «Anterior», «Siguiente», «Mostrar u ocultar menú», «Tablero» o «Resumen», «Flujo de trabajo» y «Correo electrónico».

**K10. Cerrar sesión. BAJA (cumple).** Está en las barras del encabezado y del menú lateral, no flota. Solo falta unificar (ver N5). Lo que sí flota son los lanzadores de chat y asistente (ver I1).

---

## 3. Los 10 problemas de mayor impacto para el usuario final

1. **Botones flotantes encimados** (chat, asistente IA y «Guardar» de Configuración, los tres en `bottom-6 right-6 z-50`). En Configuración, el usuario no puede guardar porque el botón del chat tapa «Guardar». Archivos: `floating-chat-button.tsx:18`, `AIAssistant.tsx:122` y `settings.tsx:562`.
2. **Datos simulados en pantallas reales** (142 `mock*` en 39 archivos de facturación, pagos, chat y agenda). Pueden mostrar cifras clínicas o financieras falsas.
3. **Borrados peligrosos**: 13 botones de eliminar a la vista en filas y tarjetas, 2 que borran sin confirmar (zonas, ya en la base de datos, y recordatorios), 2 `window.confirm` y 4 `alert()`.
4. **Doble y triple scroll en vistas clave**: consulta médica, agenda, listado de pacientes y citas, y diálogos de inventario (18 anidamientos). Sumado a barras de desplazamiento invisibles.
5. **Cargas con spinner y «Cargando…»** (33 de vista y 17 textos; `Skeleton` en solo 5 archivos), gráficas sin estado de carga ni vacío, y 6 tablas sin estado vacío.
6. **Controles inaccesibles**: 39 botones de icono sin nombre, 43 elementos clicables sin teclado, 4 modales caseros sin foco ni Escape, y «Close» en inglés en cada diálogo.
7. **Desplegables largos sin buscador**: tipo de documento (unas 22 opciones), forma farmacéutica (16), vía (11) y horas (29). Los maestros no están en orden alfabético.
8. **Texto diminuto y poco contraste**: 368 usos de 8–11 px, 125 `text-gray-400`, 69 grises con opacidad y 44 textos en lima sobre fondo claro.
9. **Tablas fuera de convención**: ninguna de 23 tiene acciones fijas a la derecha, las acciones aparecen solo al pasar el ratón (`CustomerTable.tsx:236`), hay 9 celdas con dos datos, y estados que se marcan con color y barra lateral (`AppointmentList.tsx:390`).
10. **Primera carga pesada**: un solo JS de 2,99 MB y 0 rutas con `lazy()`. Es lenta en las redes de las IPS y en equipos de consultorio.

Le siguen de cerca: la barra de prueba `h-2` visible en todas las pantallas (`TenantStatusBar.tsx:52`), los puntos «● Activo» (6), las barras laterales de acento (7 casos) y las tarjetas KPI en Inventario y Turnos.

---

## 4. Recomendaciones de la skill que NO aplican a Ker Hub (o se adaptan)

| Recomendación de la skill | Por qué no aplica o cómo se adapta |
|---|---|
| `color-palette-from-product` / `style-match` / `--design-system` (proponer una paleta «médica» azul o verde azulado) | La marca es **morada (`--primary 271 76% 53%`) y lima (`--lime`)** y no se cambia. Solo se ajusta su **uso** (lima nunca como texto sobre claro) y se añaden tokens semánticos que faltan (éxito, aviso, información). |
| Reglas de landing, hero, SEO y `og` | No hay landing: `/` redirige a `/app/home` (`App.tsx`). `PricingPage` es interna. |
| `pro-rules.md` completo (zonas seguras, Dynamic Island, háptica, Dynamic Type, gestos de iOS y Android) | Su alcance declarado es la UI **nativa o móvil**. Ker Hub es una web de escritorio y tableta. Se usa `quick-reference.md`. |
| `touch-target-size` 44 pt / 48 dp | En escritorio se aplica `web-target-size` (24×24 px, WCAG 2.2). Se recomiendan 32 px como mínimo práctico y 40 px en tabletas de consultorio. |
| `bottom-nav-limit`, `tab-bar-ios`, `top-app-bar-android`, `bottom-nav-top-level`, `gesture-nav-support`, `swipe-clarity`, `haptic-feedback`, `spring-physics` | No hay navegación inferior ni gestos nativos. La navegación es por barra lateral y encabezado. |
| `multi-step-progress` («barra de progreso» en flujos de varios pasos) | La convención prohíbe barras gruesas. El asistente de citas debe usar chips de paso o una línea de 1 px. |
| `toast-dismiss` (autocierre a los 3–5 s) | Solo para avisos de éxito. Los errores clínicos o de facturación deben quedarse hasta que se cierren a mano. |
| `confirmation-dialogs` aplicado a cualquier botón de eliminar visible | La convención es más estricta: eliminar solo desde «Más acciones» y con `AlertDialog`, nunca un botón suelto aunque tenga confirmación. |
| Tarjetas de métricas como patrón de resumen | La convención las limita a tableros. En vistas operativas no van. |
| `undo-support` («Deshacer» en el aviso) | Opcional. En registros clínicos se prefiere confirmar antes y registrar en auditoría, no deshacer. |
| `mobile-first` | El uso real es mayoritariamente de escritorio en IPS. Se recomienda **escritorio primero con adaptación a tableta**, sin dejar de evitar el scroll horizontal. |
| `parallax-subtle`, `shared-element-transition`, `stagger-sequence` | Animaciones de producto de consumo. En una app clínica operativa basta con transiciones de estado cortas. |

---

### Comandos base usados (reproducibles desde la raíz del repositorio)

```bash
grep -rnE --include=*.tsx --include=*.ts '(window\.)?confirm\(' src
grep -rnoE --include=*.tsx --include=*.ts '#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b' src | cut -d: -f1 | sort | uniq -c
grep -rnE --include=*.tsx 'border-l-(2|4|\[)' src
grep -rnE --include=*.tsx 'overflow-(y-)?(auto|scroll)|<ScrollArea' src/pages src/components
grep -rnE --include=*.tsx '<Trash2?\b' src
grep -rnoE --include=*.tsx 'text-\[(8|9|10|11)px\]' src | grep -v components/ui/ | wc -l
grep -rn "lazy(" --include=*.tsx src | wc -l
```
Los analizadores en Node (botones de icono, celdas de tabla y clicables) recorren `src/**/*.tsx` sin `components/ui` y buscan bloques `<Button>…</Button>`, `<TableCell>…</TableCell>` y etiquetas con `onClick`.
