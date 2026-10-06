"""Separa y recorta los íconos 3D generados en Flow y los deja listos en public/iconos.

Uso, una hoja con los 25 íconos sobre fondo liso (cian #00FFFF):
    python scripts/recortar_iconos.py hoja.png              # pack 1, módulos actuales
    python scripts/recortar_iconos.py hoja-2.png --pack 2   # pack 2, módulos futuros

Los íconos se leen en orden de lectura (fila por fila, de izquierda a derecha) y se nombran según
docs/iconos-3d/prompt-flow.md.

Opciones:
    --nombres a,b,c     otro orden de nombres (por ejemplo, si la hoja salió partida en dos)
    --destino carpeta   dónde guardar (por defecto public/iconos)
    --tamano 256        lado del PNG final

Cada ícono queda en PNG cuadrado con fondo transparente. Adaptado del recortador de Rutas de
rehabilitación; el fondo se detecta solo (mediana del borde), así que sirve con cian o magenta.
"""
import argparse
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

NOMBRES = [
    "inicio", "atencion", "pacientes", "citas", "turnos",
    "admisiones", "formularios", "informes", "telemedicina", "chat",
    "notificaciones", "flujos", "medicos", "especialidades", "inventario",
    "catalogo", "sedes", "zonas", "facturacion", "clientes",
    "cotizaciones", "planes", "portal-usuario", "perfil", "configuracion",
]
NOMBRES_PACK2 = [
    "laboratorio", "imagenologia", "farmacia", "hospitalizacion", "urgencias",
    "cirugia", "enfermeria", "vacunacion", "odontologia", "salud-mental",
    "nutricion", "rehabilitacion", "atencion-domiciliaria", "traslados", "historia-clinica",
    "facturacion-electronica", "cartera", "talento-humano", "compras", "documentos",
    "calidad", "seguridad", "encuestas", "asistente-ia", "integraciones",
]
PACKS = {1: NOMBRES, 2: NOMBRES_PACK2}
DESTINO = Path(__file__).resolve().parent.parent / "public" / "iconos"
MARGEN = 0.06


def quitar_fondo(img: Image.Image) -> Image.Image:
    """Clave de color contra el fondo liso, con borde suave y sin halo del color del fondo."""
    rgb = np.asarray(img.convert("RGB")).astype(np.float32)
    borde = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    fondo = np.median(borde, axis=0)
    distancia = np.sqrt(((rgb - fondo) ** 2).sum(axis=2))
    alfa = np.clip((distancia - 45) / (120 - 45), 0, 1)

    # Quita el tinte del fondo que queda en los bordes (por ejemplo, celeste del cian).
    dominante = fondo - fondo.min()
    if dominante.max() > 60:
        canales = dominante > dominante.max() * 0.5
        otros = ~canales
        base = rgb[:, :, otros].max(axis=2) if otros.any() else rgb.min(axis=2)
        exceso = np.clip(rgb[:, :, canales].min(axis=2) - base, 0, None)
        # Solo en el borde semitransparente: dentro del ícono los colores se respetan.
        exceso *= 1 - alfa
        for c in np.where(canales)[0]:
            rgb[:, :, c] -= exceso

    salida = np.dstack([np.clip(rgb, 0, 255), alfa * 255]).astype(np.uint8)
    imagen = Image.fromarray(salida, "RGBA")
    a = imagen.getchannel("A").filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    imagen.putalpha(a)
    return imagen


def componentes(imagen: Image.Image) -> list[tuple[int, int, int, int]]:
    """Cajas de cada ícono. Se unen las piezas cercanas (burbuja de notificación, flechas sueltas)."""
    ancho, alto = imagen.size
    escala = max(1, max(ancho, alto) // 500)
    pequena = imagen.getchannel("A").resize((ancho // escala, alto // escala))
    union = max(3, (pequena.width // 70) | 1)
    mascara = np.asarray(pequena.point(lambda v: 255 if v > 100 else 0).filter(ImageFilter.MaxFilter(union))) > 0
    h, w = mascara.shape
    visto = np.zeros_like(mascara)
    cajas = []
    for y0 in range(h):
        for x0 in range(w):
            if not mascara[y0, x0] or visto[y0, x0]:
                continue
            cola = deque([(y0, x0)])
            visto[y0, x0] = True
            xs, ys = [x0, x0], [y0, y0]
            while cola:
                y, x = cola.popleft()
                xs[0], xs[1] = min(xs[0], x), max(xs[1], x)
                ys[0], ys[1] = min(ys[0], y), max(ys[1], y)
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and mascara[ny, nx] and not visto[ny, nx]:
                        visto[ny, nx] = True
                        cola.append((ny, nx))
            if (xs[1] - xs[0]) * (ys[1] - ys[0]) > w * h * 0.002:
                cajas.append((xs[0] * escala, ys[0] * escala, (xs[1] + 1) * escala, (ys[1] + 1) * escala))
    # Orden de lectura: filas por altura, luego de izquierda a derecha.
    cajas.sort(key=lambda c: (c[1] + c[3]) / 2)
    filas: list[list[tuple[int, int, int, int]]] = []
    for c in cajas:
        centro = (c[1] + c[3]) / 2
        if filas and abs(centro - np.mean([(f[1] + f[3]) / 2 for f in filas[-1]])) < (c[3] - c[1]) * 0.5:
            filas[-1].append(c)
        else:
            filas.append([c])
    return [c for fila in filas for c in sorted(fila, key=lambda c: c[0])]


def encuadrar(img: Image.Image, tamano: int) -> Image.Image:
    caja = img.getchannel("A").point(lambda a: 255 if a > 12 else 0).getbbox()
    if caja:
        img = img.crop(caja)
    lado = int(max(img.size) * (1 + 2 * MARGEN))
    lienzo = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
    lienzo.paste(img, ((lado - img.width) // 2, (lado - img.height) // 2), img)
    return lienzo.resize((tamano, tamano), Image.LANCZOS)


def procesar_hoja(archivo: Path, nombres: list[str], destino: Path, tamano: int):
    limpia = quitar_fondo(Image.open(archivo))
    cajas = componentes(limpia)
    print(f"{archivo.name}: {len(cajas)} íconos encontrados")
    if len(cajas) != len(nombres):
        print(f"  Se esperaban {len(nombres)}. Se guardan como hoja-1.png, hoja-2.png… para revisarlos.")
        nombres = [f"hoja-{i + 1}" for i in range(len(cajas))]
    for nombre, (x0, y0, x1, y1) in zip(nombres, cajas):
        m = int(max(x1 - x0, y1 - y0) * 0.04)
        recorte = limpia.crop((max(0, x0 - m), max(0, y0 - m), min(limpia.width, x1 + m), min(limpia.height, y1 + m)))
        encuadrar(recorte, tamano).save(destino / f"{nombre}.png", optimize=True)
        print(f"  Listo {nombre}.png")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("entrada", type=Path)
    parser.add_argument("--nombres", default=None, help="nombres separados por coma, en orden de lectura")
    parser.add_argument("--destino", type=Path, default=DESTINO)
    parser.add_argument("--tamano", type=int, default=256)
    parser.add_argument("--pack", type=int, choices=sorted(PACKS), default=1, help="1: módulos actuales, 2: módulos futuros")
    args = parser.parse_args()
    args.destino.mkdir(parents=True, exist_ok=True)
    nombres = args.nombres.split(",") if args.nombres else PACKS[args.pack]
    procesar_hoja(args.entrada, nombres, args.destino, args.tamano)


if __name__ == "__main__":
    main()
