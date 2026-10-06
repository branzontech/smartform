# Auditoría UX/UI visual de Ker Hub (http://localhost:5341)

Fecha: 2026-10-06. Solo observación, sin cambios de código. Sesión: «Administrador de prueba».

## Método

- Navegador integrado, escritorio a 1440x900 y celular con el preset mobile (375x812). Tema oscuro activado con el botón de la barra (la app guarda `theme` en localStorage e ignora `prefers-color-scheme`).
- Se inyectó un script de medición en cada pantalla:
  - desborde (`scrollWidth`);
  - controles recortados fuera del viewport;
  - objetivos táctiles menores de 44x44;
  - controles sin nombre accesible;
  - inputs sin label;
  - contraste WCAG calculado sobre el fondo efectivo, mezclando las capas con transparencia;
  - tamaños de letra;
  - contenedores con scroll;
  - elementos fijos;
  - layouts y headers duplicados.
- Foco: se pulsó Tab 8 a 10 veces sobre Pacientes y se registró cada elemento enfocado con su posición y su estilo.
- Advertencias:
  - Durante la auditoría alguien estaba editando el código. La consola muestra recargas HMR fallidas de `App.tsx` y `ui/table.tsx` y una navegación que no lancé yo. Los números corresponden al estado del 06-10 entre las 15:00 y las 15:30 aprox.
  - Los conteos de «pequeños» incluyen los elementos duplicados por el header doble.
  - En una carga inicial Pacientes mostró «0 pacientes» y después 10. Probablemente se estaba sembrando la base, así que no se reporta como fallo.

---

## Hallazgos transversales (afectan a casi todas las pantallas)

### T1. Encabezado y menú inaccesibles en celular. CRÍTICA
- La cápsula del header termina en x=359, pero sus botones siguen más allá: el de tema (luna) ocupa 337–377 y queda medio recortado, y el de menú (`lucide-menu`, `header.tsx:338`) ocupa 385–425, **fuera de una pantalla de 375 px**.
- No hay desborde de página (`scrollWidth`=375) porque el contenedor recorta. Por eso el botón desaparece sin aviso y **en celular no hay forma de abrir la navegación lateral**.
- Se repite en las 14 rutas internas.

### T2. Botones flotantes superpuestos. CRÍTICA
- «Abrir Chat Médico» (`floating-chat-button.tsx:16`) y «Asistente IA» (`AIAssistant.tsx:120`) están los dos en `fixed bottom-6 right-6`, con 56x56 y z-50, en la misma coordenada (1360,820 en escritorio y 295,732 en celular).
- `elementsFromPoint` devuelve primero el botón de chat, así que **el Asistente IA no se puede pulsar** (solo en /app/chat queda visible).
- En Turnos, Admisiones, Facturación y Tarifarios aparecen **dos** botones «Abrir Chat Médico», por el layout duplicado (T3).
- Configuración: el botón fijo «Guardar» (1319,840, 97x36) queda tapado por el FAB en 2 de los 3 puntos medidos (x=1367 y x=1411 caen sobre «Abrir Chat Médico»). En celular pasa lo mismo: Guardar va de 254 a 351 y el FAB de 295 a 351.
- Citas en celular: el FAB tapa parcialmente el último botón del dock (271–315).

### T3. Layout o header renderizado dos veces. CRÍTICA
| Pantalla | Causa observada |
|---|---|
| /app/pacientes | `PatientList.tsx:205` monta su propio header (2 headers y 2 `<main>`) |
| /app/citas | `AppointmentList.tsx:794` monta su propio header |
| /app/turnos | `<Layout>` anidado (2 layouts, 2 main con scroll: 804/900 y 804/2050) |
| /app/admisiones | `<Layout>` anidado |
| /app/facturacion | `<Layout>` anidado (2 main con scroll) |
| /app/facturacion/tarifarios | `<Layout>` anidado |
| /app/configuracion | 2 headers y 2 main |
| /app/medicos | `DoctorList.tsx:89` monta su propio header |
| /app/chat | `<Layout>` anidado (en celular hay 3 contenedores con scroll) |

Efectos medidos:
- **Espacio en blanco arriba.** En Facturación el H1 está en y=252 px, cuando en las pantallas sin duplicado está hacia y≈110 px: pt-20 se aplica dos veces (160 px).
- **Padding lateral doble.** Son 24+24 px por lado. En celular la columna útil se reduce a unos 280 px y las tarjetas quedan con un hueco grande a la derecha.
- **Foco duplicado.** Con Tab se recorren los 7 controles del header dos veces.
- **Scroll anidado.** Dos `<main>` con `overflow-y-auto`.

### T4. Controles solo-ícono sin nombre accesible. ALTA
- Header:
  - el botón de tema (`header.tsx:324` en escritorio y `:312` en celular) no tiene texto, aria-label ni title;
  - el de menú en celular (`header.tsx:338`) tampoco;
  - el nombre accesible de las notificaciones es solo «2».
- Pacientes: «ver» (ojo) y «documento» en cada fila (`PatientList.tsx:413/421`), 20 botones con 10 filas.
- Citas: las flechas de día anterior y siguiente (`AppointmentList.tsx:817/830`) y los 5 botones del dock (`dock.tsx:106`). En Nueva cita hay 3 del dock más.
- Configuración: `settings.tsx:203` y `:212`.
- Lanzador de aplicaciones: el botón de cerrar (`<button class="p-2 rounded-full">`, sin nombre).
- Facturación en celular: las 4 pestañas quedan solo con ícono (46x28), sin nombre, y «Generar» mide 0x0, así que desaparece.

### T5. Inputs sin label (solo placeholder). ALTA
Afecta al buscador principal de Pacientes, Nueva consulta, Citas, Nueva cita, Admisiones, Tarifarios, Inventario y Cotizaciones. En Configuración y Médicos, además del buscador, hay un `<select>` sin label. El login sí etiqueta bien sus campos.

### T6. Contraste. ALTA
- Header, en todas las pantallas:
  - atajo «⌘ K»: 2.93:1 (10–12 px);
  - placeholder «Buscar en la navegación…»: 3.34:1;
  - contador «2» de notificaciones (blanco sobre #ef4444): 3.76:1.
- Peores casos por pantalla en tema claro (texto normal, mínimo 4.5:1):

| Texto | Pantalla | Ratio | Tamaño |
|---|---|---|---|
| Etiquetas de sección «General», «Clínica», «Facturación»… | Configuración | 2.27:1 | 11 px |
| Estado vacío «Crea tu primer tarifario…» | Tarifarios | 2.29:1 | 14 px |
| «Los registros aparecerán…» | Inventario | 2.29:1 | 11 px |
| Badge «Vacaciones» / «Activo» | Médicos | 2.15:1 / 2.28:1 | 12 px |
| Días fuera del mes | Turnos | 2.43:1 | 14 px |
| «Slot disponible» (en 28 elementos) | Citas | 2.52:1 | 14 px |
| Horas de mensajes | Chat | 2.54:1 | 12 px |
| Descripciones de tarjetas | Inicio | 3.25:1 | 12 px |
| Badge «Vencida» (blanco sobre #ef4444) | Facturación | 3.76:1 | 12 px |

### T7. Objetivos táctiles menores de 44x44 en celular. MEDIA
- Están en todas las pantallas. En el header:
  - lanzador: 36x36;
  - buscar: 116x40;
  - notificaciones, avatar y tema: 40x40.
- Otros:
  - acciones de fila en Pacientes: 36x36;
  - flechas de Citas y pasos de los asistentes: 36x36;
  - botones de Inventario: 32 de alto;
  - filtros de Cotizaciones: 36 de alto;
  - ítems del menú de usuario: 30 de alto;
  - cerrar el lanzador: 34x34;
  - login: ojo de la contraseña 32x32 y «¿Olvidaste tu contraseña?» 20 de alto.
- Conteo de controles pequeños sobre visibles en celular:

| Pantalla | Pequeños / visibles |
|---|---|
| Inicio | 5/15 |
| Pacientes | 17/20 |
| Nueva consulta | 8/11 |
| Citas | 16/23 |
| Nueva cita | 14/17 |
| Turnos | 15/18 |
| Admisiones | 14/17 |
| Facturación | 16/19 |
| Tarifarios | 12/15 |
| Inventario | 14/16 |
| Cotizaciones | 11/13 |
| Configuración | 30/32 |
| Médicos | 14/16 |
| Chat | 10/11 |
| Login | 4/5 |

### T8. Foco visible. MEDIA
- El anillo de foco existe y se ve: `box-shadow` de 2 px en color primario (rgb(138,44,226)), comprobado en el buscador y en los enlaces.
- **El primer Tab va a un botón de la barra lateral cerrada, en x=-223** (`app-sidebar.tsx:182`). El foco queda invisible fuera de pantalla.
- Por T3, el recorrido del header se repite dos veces.

### T9. Botones primarios recortados en celular. ALTA
El desborde no se ve porque el contenedor recorta (scrollWidth=375):

| Pantalla | Elemento recortado | Posición (px) |
|---|---|---|
| Pacientes | «Nueva atención» | 270–433 |
| Turnos | «Asignar Turnos» / «Modificar Turnos» | 381–554 |
| Facturación | «Nueva factura» | 234–379 |
| Inventario | «Nuevo producto» | 305–440 |
| Médicos | «Nuevo Profesional» | 215–395 |
| Citas | flecha «siguiente día» | 357–393 |
| Citas | «Día / Semana / Mes» | 430–610, invisibles |

### T10. Textos en inglés y estilo de mayúsculas. BAJA
- Textos en inglés:
  - «Dashboard» en la pestaña de Facturación;
  - «Dashboard» 3 veces en el lanzador («Dashboard», «Dashboard Pacientes», «Dashboard Facturación»);
  - «Slot disponible» en Citas.
- Mayúsculas inconsistentes:
  - en Title Case: «Gestión de Turnos», «Asignar Turnos», «Nueva Cotización», «Médicos y Profesionales», «Nuevo Profesional»;
  - en frase: «Nueva atención», «Nueva factura», «Nuevo producto»;
  - error de mayúscula: «Octubre De 2026» en Turnos.

---

## Por pantalla

### /app/login (en una pestaña aparte; la sesión no se cerró)
- Escritorio y celular: sin desborde y sin fallos de contraste (0 de 7 textos). Los labels están bien asociados.
- Con la sesión ya iniciada, **no redirige a /app/home** y se queda en el formulario. BAJA.
- En celular: inputs de 40 px de alto, ojo de 32x32, enlace «¿Olvidaste…?» de 20 px de alto.

### /app/home
- Escritorio: sin desborde. Es la única pantalla del grupo sin layout duplicado. Tiene 12 textos con contraste bajo; el peor son las descripciones de tarjeta, a 3.25:1 con 12 px. Un solo H1.
- Celular: sin desborde. Aplica T1 y T2. Las tarjetas se ven bien en dos columnas.
- Tema oscuro: 5 fallos. El peor es «Ker Hub» del header, a 3.2:1. Los bordes de las tarjetas casi no se ven. Durante la transición del tema (~1 s) las tarjetas aparecen gris claro, como un parpadeo. BAJA.

### /app/pacientes
- Hay header duplicado (T3). Los 20 botones de acción de fila no tienen nombre (T4) y el buscador no tiene label (T5).
- Carga con esqueleto. No muestra «Cargando…» ni botones de eliminar visibles.
- Celular:
  - «Nueva atención» queda recortado;
  - el badge «10 pacientes» se parte en 2 líneas;
  - la tabla mide 863 px dentro de 294 px, con scroll horizontal interno y la columna «Edad» cortada;
  - no hay vista de tarjetas.
- Tema oscuro: 8 fallos, todos del header. La tabla se lee bien.
- Hay un enlace «Volver» en una página raíz. BAJA.

### /app/pacientes/nueva-consulta
- No tiene H1: empieza en H2 «¿Quién es el paciente?».
- Las subetiquetas del paso a paso («Seleccionar», «Elegir formato») miden 10 px.
- El buscador no tiene label.
- En celular los pasos son solo ícono, sin nombre, de 36x36.

### /app/citas
- Header duplicado.
- **Doble scroll:** un `div.overflow-auto.max-h-[600px]` (600/1684) dentro de `main`, que también hace scroll.
- **Barra vertical de acento:** las tarjetas de cita llevan `border-left` de 4 px verde (`AppointmentList.tsx:398`), lo que va contra la convención.
- «Slot disponible» está en inglés y tiene 2.52:1.
- El H1 es la fecha («6 octubre 2026») y salta a H3.
- El dock flotante (78 px) tapa la parte de abajo de la lista y la insignia «6» mide 10 px.
- En celular desaparecen Día/Semana/Mes y la flecha siguiente, el nombre «Juan Pérez» se parte en 2 líneas y el FAB tapa parte del dock.

### /app/citas/nueva
- No tiene H1. Las subetiquetas del paso a paso miden 10 px y el «!» del dock también.
- El dock tiene 3 botones sin nombre.
- Consola: aviso de React `Invalid prop supplied to React.Fragment (data-lov-id)` en `AppointmentWizard`.
- En celular el paso a paso queda pegado o tapado bajo el header. El texto de ayuda «Escribe el nombre o documento del paciente» se parte en 5 líneas de una palabra.

### /app/turnos
- Layout anidado, con dos main con scroll (804/900 y 804/2050) y dos FAB de chat.
- **4 tarjetas KPI** en una vista operativa (Total de Turnos, Reasignaciones, Profesionales, No Disponibles).
- **Barras de progreso de 8 px** en «Utilización por Profesional».
- En celular el H1 «Gestión de Turnos» ocupa 3 líneas y el botón de asignar o modificar turnos queda fuera de pantalla.

### /app/admisiones
- Layout anidado. El buscador no tiene label. Fuera de eso no hay hallazgos propios.

### /app/facturacion
- Layout anidado: el H1 está en y=252.
- **Las cifras cambian en cada carga.** «Total facturado» dio $83,615 → $76,827 → $138,071 → $128,416 en 4 cargas, y «Pagos recibidos» $34,890 → $18,726 → $57,020 → $55,026. Parecen datos de prueba aleatorios en una vista financiera. CRÍTICA de confianza.
- La moneda va en formato en-US («$83,615.00») y además es inconsistente: «$11600.00», «$1586.00» aparecen sin separador de miles.
- Pestaña «Dashboard» en inglés.
- El badge «Vencida» tiene 3.76:1.
- En celular las pestañas quedan solo con ícono y sin nombre, «Generar» mide 0x0 y «Nueva factura» queda recortado.
- Tema oscuro: 17 fallos. Badges «Pendiente» a 2.15:1 y «Pagada» a 2.28:1.

### /app/facturacion/tarifarios
- Layout anidado.
- El texto del estado vacío tiene 2.29:1 y el buscador no tiene label.

### /app/inventario
- **4 tarjetas KPI** (Total productos, Stock disponible, Stock bajo, Por vencer) sobre la tabla operativa, con etiquetas de 11 px.
- «Los registros aparecerán…» mide 11 px y tiene 2.29:1.
- Los botones miden 32 px de alto.
- La tabla usa esqueleto, bien hecho.
- En celular «Nuevo producto» queda recortado, las KPI se apilan con texto partido («POR / VENCER / (90D)») y la pestaña «Movimientos» queda en el borde.

### /app/cotizaciones
- Sin layout duplicado. Los filtros miden 36 px de alto y el buscador no tiene label.
- Mezcla de mayúsculas: «Nueva Cotización».

### /app/configuracion
- Header duplicado.
- El botón «Guardar», fijo, queda tapado por el FAB (T2).
- La navegación interna (`NAV overflow-y-auto`, 788/794) hace scroll dentro de `main`: doble scroll.
- Las etiquetas de sección miden 11 px con 2.27:1.
- Hay 2 controles solo-ícono sin nombre y un select sin label.
- **Celular inutilizable:** la navegación de ajustes ocupa unas dos terceras partes del ancho y el contenido queda en ~60 px, con texto de una palabra por línea. El select de idioma y un interruptor quedan fuera de pantalla (389–497 y 426–470). ALTA.

### /app/medicos
- Header duplicado (`DoctorList.tsx:89`).
- Badges de estado «Vacaciones» a 2.15:1 y «Activo» a 2.28:1.
- Buscador y select sin label.
- En celular «Nuevo Profesional» queda recortado.

### /app/chat
- Layout anidado.
- En celular hay **3 contenedores con scroll anidados** (main 716/812, main 716/804 y ScrollArea 550/640).
- Los nombres de los médicos usan H3 de unos 24 px y se truncan («Dr. María…»).
- Las horas tienen 2.54:1.
- Aquí solo aparece el FAB «Asistente IA».

### Lanzador de aplicaciones
- Tiene 22 accesos y 3 de ellos se llaman «Dashboard».
- El disparador no tiene `aria-expanded` ni `aria-haspopup`.
- El panel no tiene `role="dialog"` ni `aria-modal`.
- El botón de cerrar no tiene nombre.
- Escape lo cierra, pero el foco vuelve a `BODY` y no al botón.
- En celular:
  - ocupa toda la pantalla y tiene un scroll interno (487/1379), aceptable por ser modal;
  - se muestra «Presiona ESC para cerrar», que no aplica en táctil;
  - las tarjetas miden 83x146.

### Menú de usuario
- `role="menu"` y `aria-expanded` funcionan bien.
- Tiene 2 ítems («Mi perfil» y «Cerrar sesión») de 204x30, por debajo de 44 px en táctil.
- No muestra el nombre ni el rol del usuario.

### Convenciones del usuario (resumen)
| Convención | Resultado |
|---|---|
| Puntos de color dentro de etiquetas de estado | No se detectaron (0 en todas las pantallas). Los puntos verdes del chat son de presencia en el avatar, no de badge. |
| Barra vertical de acento | **Incumple**: tarjetas de cita en /app/citas (4 px a la izquierda). |
| Barras de progreso gruesas | **Incumple**: 8 px en Turnos. |
| Doble scroll | **Incumple**: Citas, Configuración, Turnos, Facturación y Chat (triple en celular). |
| Eliminar visible en filas | No se detectó. |
| Esqueletos en vez de «Cargando…» | Cumple: no aparece «Cargando…» y Pacientes e Inventario usan esqueleto. |
| Sin KPI en vistas operativas | **Incumple**: Inventario y Turnos. |

### Errores de consola
- Aviso de React en `AppointmentWizard`: prop inválida en `React.Fragment` (`data-lov-id`, del tagger de Lovable).
- Durante la auditoría hubo errores 500 y `[hmr] Failed to reload /src/App.tsx` y `/src/components/ui/table.tsx`, por ediciones simultáneas. No son del producto.

---

## Resumen por severidad

| Severidad | # | Problemas |
|---|---|---|
| CRÍTICA | 4 | Menú y tema fuera de pantalla en celular (T1). FAB de chat tapa el Asistente IA y el botón «Guardar» (T2). Layout o header duplicado en 9 pantallas (T3). Cifras de Facturación aleatorias en cada carga. |
| ALTA | 6 | Botones primarios recortados en celular, en 6 pantallas (T9). Configuración inutilizable en celular. Controles solo-ícono sin nombre (T4). Inputs sin label en 10 pantallas (T5). Contraste de badges y textos secundarios, hasta 2.15:1 (T6). Doble o triple scroll en 5 pantallas. |
| MEDIA | 9 | Barra vertical de 4 px en las citas. KPI en Inventario y Turnos. Barras de progreso de 8 px. Objetivos táctiles menores de 44 px (T7). Letra de 10–11 px (⌘K, paso a paso, KPI de Inventario, secciones de Configuración, insignias del dock). Foco a la barra lateral oculta en x=-223 (T8). Moneda en formato en-US e inconsistente. Jerarquía de títulos (asistentes sin H1, saltos de H1 a H3). Lanzador sin semántica de diálogo. |
| BAJA | 7 | Textos en inglés («Dashboard» ×4, «Slot»). Mayúsculas inconsistentes y «Octubre De». «Volver» en páginas raíz solo en algunos módulos. El login no redirige con sesión activa. «Presiona ESC» en celular. Parpadeo gris al cambiar de tema. Aviso de React.Fragment. |

## Top 10 de problemas visibles para el usuario
1. **En celular no se puede abrir el menú**: el botón queda en 385–425 px, fuera de los 375, y el de tema queda medio cortado. Pasa en todas las pantallas.
2. **El botón de Chat Médico tapa al Asistente IA** en el mismo punto y lo deja inutilizable. También tapa 2/3 de «Guardar» en Configuración.
3. **Encabezado duplicado** en Pacientes, Citas, Turnos, Admisiones, Facturación, Tarifarios, Configuración, Médicos y Chat. Deja 160 px en blanco arriba, márgenes dobles y foco y scroll duplicados.
4. **Facturación muestra cifras distintas en cada carga**: el total facturado pasó de $83,615 a $138,071 entre recargas.
5. **Botones principales cortados en celular**: «Nueva atención», «Nueva factura», «Nuevo producto», «Nuevo Profesional», «Asignar Turnos» y Día/Semana/Mes en Citas.
6. **Configuración en celular inutilizable**: el contenido queda en ~60 px, una palabra por línea.
7. **Doble scroll** en Citas (caja de 600 px dentro de la página), Configuración, Turnos, Facturación y Chat (triple en celular).
8. **Contraste bajo en estados y textos secundarios**: «Vacaciones» 2.15:1, «Pendiente» en oscuro 2.15:1, «Slot disponible» 2.52:1, secciones de Configuración 2.27:1 a 11 px, «Vencida» 3.76:1.
9. **Barra verde vertical en las tarjetas de cita y tarjetas KPI con barras de 8 px** en Turnos e Inventario, contra las convenciones.
10. **Íconos sin nombre y buscadores sin label**: tema, menú, acciones de fila de Pacientes, dock de Citas, pestañas de Facturación en celular y cerrar el lanzador. A eso se suman objetivos táctiles de 30–40 px.
