# Pack de 25 íconos 3D de Ker Hub (Flow)

**Solo para los módulos principales.** Cada ícono 3D representa un módulo de primer nivel de la app
(las rutas `/app/<módulo>`). Todo lo demás —acciones, subsecciones, botones, tablas, menús internos—
sigue con los íconos actuales (Lucide, planos).

Un solo prompt genera **una hoja con los 25 íconos juntos** (cuadrícula de 5 × 5). Al salir en la misma
imagen comparten luz, material, ángulo y colores. Es el método que funcionó en Rutas de rehabilitación;
los prompts sueltos, uno por ícono, salieron incoherentes.

**El fondo es cian puro `#00FFFF`, no magenta.** La marca es morada y fucsia: con fondo magenta, el
recorte se comería parte de los íconos. Ningún color de Ker Hub se parece al cian.

## Cómo usarlo

1. Pega el prompt completo en el agente de Flow.
2. Elige la mejor versión y descárgala (PNG o JPG, la más grande posible).
3. Pásale la imagen a Claude o, desde la carpeta del proyecto:

```
python scripts/recortar_iconos.py "C:\Users\Deimer Domingo\Downloads\hoja-iconos-kerhub.png"
```

El script quita el fondo, separa los íconos en orden de lectura y los guarda en `public/iconos/` como
PNG de 256 px con fondo transparente, con los nombres de la tabla.

## Paleta (la de la marca)

| Color | Hex | Dónde |
|---|---|---|
| Morado Ker Hub | `#8B35E9` | Color principal de todos los íconos |
| Violeta profundo | `#4C1D95` | Detalles oscuros y contraste |
| Lavanda | `#E9DDFB` | Superficies claras, hojas, pantallas |
| Lima Ker Hub | `#A2F603` | Acento: cruces, checks, flechas (poco y siempre pequeño) |
| Blanco | `#FFFFFF` | Papel, batas, superficies |
| Gris claro | `#E5E7EB` | Líneas y detalles neutros |
| Carbón | `#1F2937` | Contornos internos, mangos, detalles |
| Piel | `#E2A47C` | Solo en los personajes |

## Los 25 módulos principales

| # | Archivo | Módulo (ruta) | Qué es el ícono |
|---|---|---|---|
| 1 | `inicio` | Inicio (`/app/home`) | Casa |
| 2 | `atencion` | Atención / consulta (`/app/consulta-multiple`) | Estetoscopio sobre portapapeles |
| 3 | `pacientes` | Pacientes (`/app/pacientes`) | Dos personajes |
| 4 | `citas` | Citas médicas (`/app/citas`) | Calendario con check |
| 5 | `turnos` | Turnos (`/app/turnos`) | Reloj con flechas circulares |
| 6 | `admisiones` | Admisiones (`/app/admisiones`) | Brazalete hospitalario con check |
| 7 | `formularios` | Formularios (`/app/home/formularios`, `/app/crear`) | Hoja con casillas y lápiz |
| 8 | `informes` | Informes y estadísticas (`/app/informes`) | Gráfica de barras con flecha |
| 9 | `telemedicina` | Telemedicina (`/app/telemedicina`) | Portátil con videollamada |
| 10 | `chat` | Chat médico (`/app/chat`) | Dos burbujas de conversación |
| 11 | `notificaciones` | Notificaciones (`/app/notificaciones/centro`) | Campana |
| 12 | `flujos` | Flujos de trabajo (`/app/workflows`) | Tres nodos conectados |
| 13 | `medicos` | Médicos (`/app/medicos`) | Personaje médico con bata |
| 14 | `especialidades` | Especialidades (`/app/especialidades/...`) | Maletín médico |
| 15 | `inventario` | Inventario (`/app/inventario`) | Caja de suministros con cruz |
| 16 | `catalogo` | Catálogo de productos (`/app/configuracion/catalogo-productos`) | Frasco y cápsula |
| 17 | `sedes` | Sedes y consultorios (`/app/locations/...`) | Edificio de clínica con cruz |
| 18 | `zonas` | Zonas (`/app/zonas`) | Mapa plegado con pin |
| 19 | `facturacion` | Facturación (`/app/facturacion`) | Factura con moneda |
| 20 | `clientes` | Clientes (`/app/clientes`) | Agenda de contactos |
| 21 | `cotizaciones` | Cotizaciones (`/app/cotizaciones`) | Etiqueta de precio con moneda |
| 22 | `planes` | Planes y precios (`/app/precios`) | Gema |
| 23 | `portal-usuario` | Portal del usuario (`/app/portal-usuario`) | Celular con ficha de persona |
| 24 | `perfil` | Mi perfil (`/app/perfil`) | Insignia redonda con silueta |
| 25 | `configuracion` | Configuración (`/app/configuracion`) | Engranaje |

## Prompt (pegar completo en Flow)

```
Create 2 different versions of ONE single image: an icon sheet with exactly 25 app icons arranged in a clean grid of 5 columns and 5 rows, evenly spaced. Do not create separate images per icon: all 25 icons must be in the same image so they share exactly the same style.

STYLE, identical for all 25 icons: premium 3D icons for a professional healthcare software product, soft matte clay material with a very subtle satin sheen, smooth rounded shapes with soft bevels, clean and minimal with few details, elegant and professional (not childish, not cartoonish), the same three-quarter front view seen slightly from above, the same soft studio key light from the top left, gentle soft shading. All icons have the same visual size and fill their grid cell evenly, are fully visible and have wide empty space around them: they never touch, never overlap and are never cut by the image edge.

CHARACTERS (icons 3 and 13 only): friendly stylized 3D characters shown from the chest up, rounded heads, calm professional faces with small dark eyes and a small smile, simple hair, no realistic features, same proportions in both icons.

BACKGROUND: the entire canvas is one perfectly flat, uniform, solid cyan color #00FFFF. No gradient, no vignette, no texture, no floor, no ground, no surface, no scene, no environment, no shadows and no reflections on the background. It is a chroma key background that will be removed later.

NOT ALLOWED: photographs, realistic scenes, rooms, desks, text, letters, words, labels, logos, watermarks, numbers, currency symbols, the "Rx" symbol.

STRICT PALETTE, use only these colors in every icon: purple #8B35E9 (main color of the whole set), deep violet #4C1D95, lavender #E9DDFB, lime green #A2F603 (small accents only: crosses, check marks, arrows, small details), white #FFFFFF, light gray #E5E7EB, charcoal #1F2937, and for the characters only, warm skin #E2A47C. Never use cyan, turquoise, teal, blue, red, pink, magenta, orange or yellow inside the icons. Medical crosses are lime green or white, never red.

THE 25 ICONS, in reading order (row 1 left to right, then row 2, and so on):
Row 1
1. Home: small rounded purple house with a white door and a small lime green dot on the roof.
2. Medical care: white clipboard with a lavender sheet and a charcoal stethoscope with purple tubing lying across it.
3. Patients: two friendly characters side by side, chest up: an older person with light gray hair in a lavender shirt and a younger person with dark hair in a purple shirt.
4. Appointments: purple desk calendar with two charcoal rings, a white page with light gray squares and a lime green check mark badge.
5. Shifts: round white clock with a purple rim and charcoal hands, wrapped by two curved lime green arrows forming a cycle.
Row 2
6. Admissions: purple hospital wristband bracelet with a white tag and a small lime green check mark on the tag.
7. Forms: white document sheet with three lavender checkbox rows, one checked in lime green, and a purple pencil leaning on it.
8. Reports: three rounded bars in lavender, purple and deep violet rising left to right, with a lime green arrow pointing up.
9. Telemedicine: small charcoal laptop whose screen shows a lavender video call with a purple person silhouette and a tiny lime green dot.
10. Chat: two overlapping speech bubbles, one purple and one white, the white one with a small lime green medical cross.
Row 3
11. Notifications: purple bell with a white clapper and a small round lime green badge.
12. Workflows: three rounded nodes (purple, lavender and white) connected by smooth charcoal lines, one small lime green arrow on a line.
13. Doctor: friendly character with short dark hair wearing a white doctor coat over a purple shirt and a charcoal stethoscope, chest up.
14. Specialties: purple medical bag with a white handle and a white circle holding a lime green medical cross.
15. Inventory: purple cardboard-style supply box, slightly open, with a white label holding a lime green medical cross.
Row 4
16. Product catalog: purple medicine bottle with a white cap and a white label, with a lime green and white capsule beside it.
17. Sites: small rounded white clinic building with a purple roof and a lime green medical cross on the front.
18. Zones: folded lavender paper map with a purple location pin standing on it and a lime green dotted route line.
19. Billing: white receipt with a zigzag bottom edge and light gray lines, with a purple coin in front of it.
20. Clients: purple address book with a white page showing a deep violet person silhouette and light gray lines.
Row 5
21. Quotes: purple price tag with a white hole ring, and a lavender coin beside it.
22. Plans: faceted purple gem with a small lime green sparkle.
23. User portal: white smartphone whose screen shows a lavender card with a purple person silhouette and a lime green check mark.
24. Profile: round white badge with a purple person silhouette inside and a small lime green dot on its edge.
25. Settings: purple gear with a white center ring.

Aspect ratio 1:1. Generate 2 versions of this same icon sheet.
```

## Si algo sale mal

- **Salen escenas o fotos:** pide `flat icon sheet, studio product render, no photography, no scene`.
- **El fondo no es cian liso:** responde `the background must be pure flat #00FFFF only, nothing else`.
- **Faltan o sobran íconos, o salen pegados:** pide `keep exactly 25 icons in a 5 by 5 grid, evenly spaced, none touching`.
- **Se ve infantil:** pide `make them more premium and professional, like a modern healthcare SaaS icon set`.
- **Aparecen azules, rojos o naranjas:** pide `use only the purple palette with lime green accents, no blue, no red, no orange`.
- **25 en una sola imagen sale mal:** divide en dos hojas con el mismo prompt (filas 1 a 3 y luego 4 a 5,
  agregando `match exactly the style of the previous icon sheet`) y recorta cada una con `--nombres`:
  `python scripts/recortar_iconos.py hoja-b.png --nombres catalogo,sedes,zonas,facturacion,clientes,cotizaciones,planes,portal-usuario,perfil,configuracion`
