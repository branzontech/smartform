# Convenciones de UX/UI de Ker Hub

Reglas para toda pantalla nueva o modificada. Combinan las convenciones del equipo (mandan siempre) con
las reglas de la skill **UI/UX Pro Max** (`.claude/skills/ui-ux-pro-max/`, 119 reglas), filtradas a lo que
aplica a una app clínica de escritorio y celular hecha con React + Tailwind + shadcn/ui.

Cuando una recomendación de la skill choca con esta página, **gana esta página**.

## 1. Marca (no se negocia)

- Paleta: morado `#8B35E9` (`--primary`), violeta `#4C1D95`, lavanda `#E9DDFB`, lima `#A2F603` solo como
  acento. La skill propone cian y neumorfismo para salud: **no aplica**, Ker Hub ya tiene marca.
- Colores siempre por token (`bg-primary`, `text-muted-foreground`…). **Cero hex en componentes.**
- Logos en `public/kerhub-logo-color.png` (fondos oscuros o morados) y `kerhub-logo-blanco.png`.
- Íconos 3D (`IconoModulo`) **solo para módulos principales** (tarjetas de Inicio, lanzador). Todo lo
  demás con Lucide. Nunca emojis como íconos.
- Nada de degradados morado-rosa decorativos en textos (la skill los marca como «estética de IA»).

## 2. Convenciones del equipo (prohibiciones)

| Regla | En vez de eso |
|---|---|
| Punto o viñeta de color dentro de etiquetas de estado («● Activo») | Solo texto; el estado se distingue por color de texto o de fondo de la píldora |
| Barra vertical de acento en hover, activo o seleccionado | Tinte de fondo o anillo neutro |
| Barras de progreso gruesas | Anillo, chip o línea de 1 px |
| Doble scroll (scroll dentro de un panel que ya hace scroll) | Un solo contenedor con scroll |
| Botón «Eliminar» visible en filas o tarjetas | Menú «Más acciones» + confirmación (nunca `window.confirm`) |
| «Cargando…» con rueda | Esqueletos (`Skeleton`) con la forma del contenido |
| Modal encima de modal | Paso interno o subvista dentro del mismo modal |
| Tarjetas KPI en listas y tablas | KPIs solo en dashboards |
| Listas de más de 7 opciones sin buscador | Selector con búsqueda; maestros en orden alfabético (es) |
| Cerrar sesión flotante | Dentro de la barra o el menú de usuario |
| Textos en inglés o anglicismos innecesarios | Español claro, para personal no técnico |

## 3. Tablas, pestañas y páginas de módulo (kit obligatorio)

Toda tabla usa el kit `src/components/kit/` (convención de Equipo Tracker, la misma de Magnet). Modelo
completo: `src/pages/patients/PatientList.tsx`.

| Pieza | Para qué |
|---|---|
| `EncabezadoModulo` | Título · máx. 2 secundarias · «…» con lo ocasional · engranaje · 1 primaria |
| `PestanasCarpeta` | Vistas del módulo (listas que se consultan). Tipo carpeta, a la derecha, «Más» para fijar/desfijar |
| `useTablaDatos` + `BarraTabla` + `TablaDatos` | Listados: segmentos con conteo, Filtrar (ventana), Ordenar, Opciones (columnas y CSV), búsqueda desplegable, esqueleto, paginación, acciones fijas |
| `AccionesFila` | «Ver» + «Más acciones»; Eliminar solo ahí y con confirmación |
| `CeldaEstado` | La única celda con color de fondo: la columna «Estado» |
| `TablaSimple` | Ítems de factura/cotización/orden y comparativos: mismo aspecto, sin barra |
| `useConfirmar` | Reemplazo de `window.confirm` |

```tsx
const t = useTablaDatos({ id: "modulo.vista", filas, columnas: COLUMNAS, claveFila, filtros: FILTROS, segmentos: SEGMENTOS });

<div className="mx-auto max-w-7xl space-y-5 py-6">
  <EncabezadoModulo titulo="Módulo" primaria={{ titulo: "Nuevo …", onClick }} />
  <PestanasCarpeta id="modulo.pestanas" etiqueta="Vistas" pestanas={PESTANAS} activa={vista} onCambio={setVista} visiblesIniciales={[…]} />
  <TablaDatos t={t} cargando={cargando} onFilaClick={ver}
    barra={<BarraTabla t={t} nombre={["registro", "registros"]} placeholder="Buscar…" />}
    acciones={(f) => <AccionesFila nombre={f.nombre} onVer={() => ver(f)} onEliminar={() => eliminar(f)} />}
    vacio="Aún no hay registros." />
</div>
```

Reglas:
- Una celda, un dato, una línea. Lo accesorio va en el detalle o en columnas `oculta: true`.
- Nada de selects ni buscadores sueltos encima de la tabla: todo vive en la barra.
- Columna de acciones siempre visible y fija a la derecha.
- Estado vacío explícito con una acción («Aún no hay pacientes. Registra uno con «Nueva atención»»).
- Las páginas no dibujan su propio `<Header />` ni contenedores con scroll: el `Layout` ya los da.

## 4. Accesibilidad (prioridad 1 de la skill)

- Contraste de texto ≥ 4.5:1 (≥ 3:1 en texto grande e íconos que transmiten estado).
- Todo botón solo-ícono con `aria-label`. Íconos decorativos con `aria-hidden`.
- Foco visible siempre (`focus-visible:ring-2 ring-primary/40`); nunca quitar el foco sin reemplazo.
- Todo campo con `<Label htmlFor>` visible; el placeholder no reemplaza la etiqueta.
- Navegación completa con teclado; `Esc` cierra diálogos; el foco vuelve al disparador.
- Respetar «reducir movimiento» (ya activo con `MotionConfig reducedMotion="user"`).

## 5. Interacción y celular (prioridad 2)

- Objetivos táctiles ≥ 44 × 44 px en celular, con ≥ 8 px entre ellos.
- Nada que dependa solo de hover (acciones, información).
- Retroalimentación inmediata: botón deshabilitado + indicador mientras se guarda; toast al terminar.
- Sin desborde horizontal en 375 px. Nada fijo que tape contenido en celular.

## 6. Tipografía, espaciado y animación

- Texto de contenido ≥ 14 px (mínimo absoluto 12 px solo en metadatos); interlineado ~1.5.
- Una escala de espaciado (4/8/12/16/24/32) y radios coherentes (`rounded-xl` tarjetas, `rounded-lg` controles).
- Animaciones de 150–250 ms, con propósito; animar `transform`/`opacity`, no `height`/`width`
  (salvo colapsables `0 → auto`, que se aceptan).

## 7. Formularios

- Etiqueta visible, ayuda breve debajo, error junto al campo y en lenguaje humano.
- Validación al salir del campo, no en cada tecla.
- Formularios largos por pasos o secciones plegables.
- Datos con fuente oficial (municipios DANE, tipos de documento, EPS…) nunca en texto libre.

## 8. Cómo usar la skill

Desde la raíz del repositorio:

```
python .claude/skills/ui-ux-pro-max/scripts/search.py "icon button accessible label" --domain ux
python .claude/skills/ui-ux-pro-max/scripts/search.py "data table pagination" --stack shadcn
python .claude/skills/ui-ux-pro-max/scripts/search.py "form validation inline" --stack react
```

Consultas de una sola intención, 2–5 palabras. Antes de entregar una pantalla, revisar
`.claude/skills/ui-ux-pro-max/references/pro-rules.md` (lista previa a la entrega) y esta página.
