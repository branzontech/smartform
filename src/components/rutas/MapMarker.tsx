/// <reference types="@types/google.maps" />
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useMap } from "@vis.gl/react-google-maps";

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Marcador con contenido HTML libre sobre un mapa con estilo propio (sin mapId),
 * como en el software de rutas de profesionales. El contenido se ancla por su
 * borde inferior central al punto.
 */
export function MapMarker({ position, zIndex = 0, onClick, title, children }: { position: LatLng; zIndex?: number; onClick?: () => void; title?: string; children: ReactNode }) {
  const map = useMap();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const pos = useRef(position);
  const layerZ = useRef(zIndex);

  const overlay = useMemo(() => {
    if (!map) return null;
    const div = document.createElement("div");
    div.style.position = "absolute";
    const o = new google.maps.OverlayView();
    o.onAdd = () => {
      o.getPanes()?.overlayMouseTarget.appendChild(div);
      google.maps.OverlayView.preventMapHitsAndGesturesFrom(div);
      setContainer(div);
    };
    o.onRemove = () => {
      div.remove();
      setContainer(null);
    };
    o.draw = () => {
      const p = o.getProjection()?.fromLatLngToDivPixel(new google.maps.LatLng(pos.current));
      if (!p) return;
      div.style.left = `${p.x}px`;
      div.style.top = `${p.y}px`;
      div.style.zIndex = String(layerZ.current);
    };
    return o;
  }, [map]);

  useEffect(() => {
    overlay?.setMap(map);
    return () => overlay?.setMap(null);
  }, [overlay, map]);

  useEffect(() => {
    pos.current = position;
    layerZ.current = zIndex;
    if (overlay?.getProjection()) overlay.draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlay, position.lat, position.lng, zIndex]);

  if (!container) return null;
  return createPortal(
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={title}
      title={title}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      className={`-translate-x-1/2 -translate-y-full ${onClick ? "cursor-pointer" : ""}`}
    >
      {children}
    </div>,
    container,
  );
}

/** Íconos 3D del software de rutas (public/rutas). */
export type RouteIconName =
  | "salida"
  | "visita"
  | "llegada"
  | "por-confirmar"
  | "mapa"
  | "carro"
  | "moto"
  | "paciente"
  | "profesional"
  | "medico"
  | "reloj"
  | "calendario"
  | "trafico";

// Almacén compartido: cada ícono se descarga una sola vez y avisa a quien lo use.
const iconState = new Map<RouteIconName, "loading" | "ready" | "missing">();
const listeners = new Set<() => void>();
const subscribe = (notify: () => void) => {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
};

const iconUrl = (name: RouteIconName) => `/rutas/${name}.png`;

function requestIcon(name: RouteIconName) {
  if (iconState.has(name)) return;
  iconState.set(name, "loading");
  const img = new Image();
  img.onload = () => {
    iconState.set(name, "ready");
    listeners.forEach((notify) => notify());
  };
  img.onerror = () => iconState.set(name, "missing");
  img.src = iconUrl(name);
}

export function useRouteIcon(name: RouteIconName): string | null {
  useEffect(() => requestIcon(name), [name]);
  const ready = useSyncExternalStore(subscribe, () => iconState.get(name) === "ready");
  return ready ? iconUrl(name) : null;
}

/** El ícono 3D si ya cargó; si no, el dibujo de respaldo. */
export function RouteIcon3D({ name, size, children }: { name: RouteIconName; size: number; children?: ReactNode }) {
  const src = useRouteIcon(name);
  if (!src) return <>{children}</>;
  return <img src={src} alt="" width={size} height={size} className="shrink-0 object-contain" draggable={false} />;
}
