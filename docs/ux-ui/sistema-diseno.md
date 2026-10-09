# Sistema de diseño de Ker Hub: tarjetas, cifras y calendario

Complementa `convenciones.md` (que manda en caso de choque). Referencias aprobadas por el usuario en
`referencias/tarjetas-y-fechas.png` y `referencias/panel-y-calendario.png`: de ellas se toma la
**estructura** (lienzo gris, tarjetas blancas amplias, cifras protagonistas, fechas en baldosas), no sus
colores ni sus barras gruesas.

## 1. Principios: nada de «estética de IA»

| No | Sí |
|---|---|
| Brillos difuminados de fondo, destellos (`Sparkles`), emojis | Lienzo liso; el contenido es la decoración |
| Texto con degradado, chips decorativos («Ker Hub») | Texto sólido; el color se reserva para lo que significa algo |
| Animaciones con rebote, tarjetas que «saltan» al pasar el mouse | Aparición de 150–250 ms; al pasar el mouse cambia la sombra o el tono |
| Tres acentos de color en una misma tarjeta | **Un acento por tarjeta** (morado de marca); lima solo para «hoy» o lo destacado |
| Barras de progreso gruesas | Anillo (`ProgressRing`) o línea de 1 px |
| Puntos de color en etiquetas o leyendas | Texto; en leyendas, una baldosa con la misma forma del elemento |
| Tarjetas KPI encima de una tabla | Cifras solo en paneles (Inicio, dashboards) |
| Botones o círculos negros como acento | Acento de acción en **lima de marca** (`bg-highlight`), con texto violeta |
| Controles secundarios siempre visibles en cada tarjeta | Aparecen al pasar el mouse o con el foco; la tarjeta entera ya es el enlace |

## 2. Tokens

| Token | Uso | Clase |
|---|---|---|
| `--canvas` | Fondo de toda pantalla de la app (gris frío) | `bg-canvas` |
| `--card` | Tarjeta (blanca en claro) | `bg-card` |
| `--highlight` | Lima de marca #A2F603 con texto violeta: flecha de acción, «hoy» | `bg-highlight text-highlight-foreground` |
| Radio de tarjeta 24 px | Tarjetas y paneles | `rounded-card` |
| Radio de baldosa 16 px | Elementos dentro de una tarjeta (fechas, ítems, íconos) | `rounded-tile` |
| Píldora | Chips, franjas horarias, botones de rango | `rounded-full` |
| Sombra única | Tarjeta en reposo | `shadow-card` |
| Sombra elevada | Tarjeta interactiva al pasar el mouse | `shadow-card-hover` |

- Sin bordes en modo claro (la sombra separa); en oscuro, borde `border-border` y sin sombra.
- Relleno de tarjeta: 20 px en celular, 24 px desde `md` (`p-5 md:p-6`). Separación entre tarjetas: 16 px (`gap-4`).
- Colores siempre por token; nunca hex en componentes.

## 3. Tipografía dentro de tarjetas

| Elemento | Estilo |
|---|---|
| Título de tarjeta | 15 px, `font-semibold`, `text-foreground` |
| Subtítulo o ayuda | 13 px, `text-muted-foreground` |
| Cifra protagonista | 28–32 px, `font-semibold`, `tabular-nums`; la unidad en 13 px al lado |
| Rótulo de cifra | 12–13 px, `text-muted-foreground`, debajo de la cifra |

## 4. Componentes (`src/components/kit/surface/`)

### SurfaceCard
Tarjeta base. Encabezado opcional: título, subtítulo, y a la derecha un selector de rango en píldora
(«Este mes ▾») o el menú «⋮». Todo panel nuevo parte de aquí; no se escriben tarjetas a mano.

### ModuleCard (Inicio, lanzador)
Ícono 3D en la esquina superior, título y una línea de descripción. Toda la tarjeta es el enlace. Al
pasar el mouse (o con el foco) aparece abajo a la derecha una flecha pequeña de 28 px en lima
(`bg-highlight`); en reposo no se ve nada más.

### StatCard (por construir al rediseñar dashboards)
Rótulo arriba, cifra protagonista, variación en chip de texto («+12 % vs. mes anterior», verde o rojo
solo en el texto). Opcional: `ProgressRing` a la derecha o mini-gráfica de área sin ejes. El rango se
cambia con el selector en píldora del encabezado, nunca con pestañas sueltas.

### Gráficas
Área o barras suaves con el color de marca al 15–25 %, sin cuadrícula salvo líneas horizontales de 1 px,
ejes en 11–12 px `text-muted-foreground`, valor destacado en una etiqueta píldora sobre el punto
seleccionado. Una gráfica por tarjeta.

## 5. Calendario y fechas

### Baldosa de fecha (`DateTile`): selección rápida de días
Cuadrado de 16 px de radio con día grande (24 px, semibold) y mes debajo (13 px). Estados:

| Estado | Aspecto |
|---|---|
| Disponible | Fondo `card`, borde `border` |
| Seleccionada | Fondo `primary`, texto blanco, sin borde |
| Hoy | Anillo de 2 px lima (`ring-highlight`) |
| No disponible | Texto `muted-foreground/50`, sin borde, no clicable |

### Mes (`MonthGrid`): agendar citas
Cuadrícula de 7 columnas con días en círculo de 36–40 px; encabezado de días en 12 px
(`Lun Mar Mié…`, empezando en lunes). Estados: disponible (tinte `primary/10`), lleno (texto tachado
suave, no clicable), seleccionado (`primary` sólido), hoy (anillo lima), fuera del mes (30 % de opacidad).
Leyenda debajo con baldosas circulares pequeñas del mismo estilo, nunca puntos sueltos.

### Franjas horarias (`TimeSlot`)
Píldoras de 36 px de alto en rejilla de 3; seleccionada en `primary`, ocupada en `muted` tachada. Botón de
confirmación ancho al final del panel, en píldora.

## 6. Movimiento

- Entrada de tarjetas: opacidad 0 → 1 y 8 px de desplazamiento, 200 ms, escalonado de 30 ms.
- Al pasar el mouse: `shadow-card` → `shadow-card-hover` y aparecen los controles secundarios (opacidad y 4 px de desplazamiento).
- Respeta «reducir movimiento» (`MotionConfig reducedMotion="user"`).

## 7. Diligenciamiento de formatos (elegido por el usuario: dirección C sin nota en vivo)

Aplica a **todo formato**, existente o nuevo: lo pinta el renderizador común de formularios, nunca un
diseño por formato. Prototipo de referencia: artefacto «Ker Hub · Diligenciar historia clínica».

- **Encabezado del paciente** siempre visible: nombre, edad, sexo, documento, HC, régimen y alertas
  (alergias en rojo), con el avance de obligatorios en anillo.
- **Una tarjeta por sección** (`SurfaceCard`), en una sola columna centrada de máx. 960 px, con su
  contador «2/3» de obligatorios. Sin panel lateral.
- **Simetría:** todo campo de texto (corto o largo) va a **ancho completo**. Solo se emparejan dos
  controles cortos del mismo tipo (p. ej. dos grupos de chips); nunca un campo a media fila.
- **Tipografía:** etiqueta 15 px semibold color de texto; ayuda 13 px; valor 16 px. Asterisco en morado.
- **Campos:** caja con fondo suave (`--field`), radio 14 px, borde morado al enfocar.
- **Selección de 2 a 5 opciones:** chips de 44 px de alto (nunca una lista desplegable).
- **Escalas con puntaje:** cada opción es una fila táctil de 52 px con su puntaje en una píldora a la
  derecha; la elegida se tiñe de morado. El **total** va en un bloque con el número grande (44 px),
  «/ máximo», la interpretación en color de texto semántico y los rangos como píldoras (sin puntos).
- **Signos vitales:** baldosas con número de 28 px, unidad y estado en texto («Normal», «Elevada»);
  IMC y TAM calculados en baldosas propias.
- **Acciones:** barra flotante inferior en píldora con el anillo de avance, «Guardar» y
  «Completar atención» (deshabilitado hasta completar los obligatorios).
