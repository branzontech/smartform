/// <reference types="@types/google.maps" />
import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import type { LatLng } from "./MapMarker";

/** Carro visto desde arriba y apuntando al norte (el del software de rutas); se gira según la vía. */
const CAR_SVG = `<svg width="30" height="50" viewBox="0 0 28 48" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="14" width="3.5" height="5" rx="1.5" fill="#1f1f1f"/>
  <rect x="24.5" y="14" width="3.5" height="5" rx="1.5" fill="#1f1f1f"/>
  <rect x="2.5" y="2" width="23" height="44" rx="9" fill="#1f1f1f"/>
  <rect x="5" y="3" width="5" height="2.6" rx="1.3" fill="#fce929"/>
  <rect x="18" y="3" width="5" height="2.6" rx="1.3" fill="#fce929"/>
  <path d="M6.5 14.5 Q14 10.5 21.5 14.5 L20.5 20 Q14 18 7.5 20 Z" fill="#a9c8e6"/>
  <rect x="7.5" y="21" width="13" height="12" rx="3" fill="#333"/>
  <path d="M7.5 35 Q14 37 20.5 35 L21.5 39.5 Q14 41.5 6.5 39.5 Z" fill="#a9c8e6"/>
  <rect x="5" y="43" width="4" height="2" rx="1" fill="#e5484d"/>
  <rect x="19" y="43" width="4" height="2" rx="1" fill="#e5484d"/>
</svg>`;

export interface TraceRoute {
  id: string;
  points: LatLng[];
  color: string;
}

interface Drawn {
  line: google.maps.Polyline;
  border: google.maps.Polyline;
  points: LatLng[];
  /** Distancia acumulada de cada punto desde el inicio, en metros. */
  acc: number[];
}

function meters(a: LatLng, b: LatLng) {
  const dLat = (a.lat - b.lat) * 111_320;
  const dLng = (a.lng - b.lng) * 111_320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
}

function pointAt(d: Drawn, distance: number): { point: LatLng; index: number } {
  const { points, acc } = d;
  let i = 1;
  while (i < acc.length - 1 && acc[i] < distance) i++;
  const span = acc[i] - acc[i - 1] || 1;
  const f = Math.min(1, Math.max(0, (distance - acc[i - 1]) / span));
  const a = points[i - 1];
  const b = points[i];
  return { point: { lat: a.lat + (b.lat - a.lat) * f, lng: a.lng + (b.lng - a.lng) * f }, index: i };
}

/**
 * Dibuja la ruta de cada profesional (borde blanco y línea de su color) y, al
 * elegir uno, recorre su ruta con el carro, como en el software de rutas.
 */
export function RouteTraces({ routes, activeId, replay }: { routes: TraceRoute[]; activeId: string | null; replay: number }) {
  const map = useMap();
  const drawn = useRef(new Map<string, Drawn>());
  const signature = routes.map((r) => `${r.id}:${r.points.length}:${r.color}`).join("|");

  // 1. Líneas de cada ruta.
  useEffect(() => {
    if (!map) return;
    const next = new Map<string, Drawn>();
    for (const r of routes) {
      if (r.points.length < 2) continue;
      const acc = [0];
      for (let i = 1; i < r.points.length; i++) acc.push(acc[i - 1] + meters(r.points[i - 1], r.points[i]));
      next.set(r.id, {
        points: r.points,
        acc,
        border: new google.maps.Polyline({ map, path: r.points, strokeColor: "#ffffff", strokeWeight: 10, zIndex: 3, clickable: false }),
        line: new google.maps.Polyline({ map, path: r.points, strokeColor: r.color, strokeWeight: 6, zIndex: 4, clickable: false }),
      });
    }
    drawn.current = next;
    return () => {
      next.forEach((d) => {
        d.line.setMap(null);
        d.border.setMap(null);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, signature]);

  // 2. Resalta la ruta del profesional elegido.
  useEffect(() => {
    drawn.current.forEach((d, id) => {
      const on = !activeId || id === activeId;
      d.line.setOptions({ strokeOpacity: on ? 1 : 0.25, zIndex: on ? 5 : 4 });
      d.border.setOptions({ strokeOpacity: on ? 1 : 0.4 });
    });
  }, [activeId, signature]);

  // 3. El carro recorre la ruta elegida.
  useEffect(() => {
    const d = activeId ? drawn.current.get(activeId) : undefined;
    if (!map || !d) return;
    const total = d.acc[d.acc.length - 1];
    const duration = Math.min(16000, Math.max(6000, 6000 + (total / 1000) * 350));

    const div = document.createElement("div");
    div.style.position = "absolute";
    div.style.filter = "drop-shadow(0 4px 6px rgba(0,0,0,.35))";
    div.style.transition = "opacity .5s";
    div.innerHTML = CAR_SVG;
    let pos = d.points[0];
    let ahead: LatLng | null = null;
    let angle = 0;
    const layer = new google.maps.OverlayView();
    layer.onAdd = () => layer.getPanes()?.floatPane.appendChild(div);
    layer.onRemove = () => div.remove();
    layer.draw = () => {
      const pr = layer.getProjection();
      if (!pr) return;
      const p = pr.fromLatLngToDivPixel(new google.maps.LatLng(pos));
      if (!p) return;
      const q = ahead ? pr.fromLatLngToDivPixel(new google.maps.LatLng(ahead)) : null;
      if (q && Math.hypot(q.x - p.x, q.y - p.y) > 1) {
        const target = (Math.atan2(q.x - p.x, -(q.y - p.y)) * 180) / Math.PI;
        let delta = target - angle;
        while (delta > 180) delta -= 360;
        while (delta < -180) delta += 360;
        angle += delta * 0.35;
      }
      div.style.left = `${p.x}px`;
      div.style.top = `${p.y}px`;
      div.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
    };
    layer.setMap(map);

    const paint = (distance: number) => {
      const { point, index } = pointAt(d, distance);
      const partial = distance >= total ? d.points : [...d.points.slice(0, index), point];
      d.line.setPath(partial);
      d.border.setPath(partial);
    };

    let frame = 0;
    let hide: ReturnType<typeof setTimeout> | undefined;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // Arranca y frena suave, como un carro.
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const distance = eased * total;
      paint(distance);
      pos = pointAt(d, distance).point;
      ahead = pointAt(d, Math.min(total, distance + 35)).point;
      layer.draw();
      if (t < 1) {
        frame = requestAnimationFrame(step);
        return;
      }
      hide = setTimeout(() => {
        div.style.opacity = "0";
        hide = setTimeout(() => layer.setMap(null), 500);
      }, 700);
    };
    frame = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(hide);
      layer.setMap(null);
      d.line.setPath(d.points);
      d.border.setPath(d.points);
    };
  }, [map, activeId, replay, signature]);

  return null;
}
