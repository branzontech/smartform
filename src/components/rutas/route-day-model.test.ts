import { describe, expect, it } from "vitest";
import { googleMapsLinks, lateStops, proStatus, signalAgo } from "./route-day-model";
import type { ParadaDia, ProfesionalDia, RutaDia } from "./rutas-api";

const NOW = new Date("2026-10-19T15:00:00Z"); // 10:00 en Colombia

const stop = (id: string, inicio: string, estado: ParadaDia["estado"] = "programada"): ParadaDia => ({
  id, estado, inicio, fin: inicio, direccion: "Calle 1", latitud: 10.4, longitud: -75.5, geoEstado: "ubicada", admisionId: null,
  pacienteId: `pa-${id}`, paciente: `Ana María ${id}`, telefono: null, servicio: null, profesionalId: "p1", profesional: "Zoe", color: null,
});

const route = (over: Partial<RutaDia> = {}): RutaDia => ({
  id: "r1", estado: "en_curso", iniciadaAt: "2026-10-19T13:00:00Z", terminadaAt: null, distanciaM: 1000, duracionS: 600, polilinea: null,
  orden: [], tramos: [], recalculadaAt: "2026-10-19T13:00:00Z", posicionLatitud: null, posicionLongitud: null, posicionAt: null, ...over,
});

const pro = (paradas: ParadaDia[], ruta: RutaDia | null = null): ProfesionalDia => ({
  profesionalId: "p1", profesional: "Zoe", color: null, ruta, paradas,
  resueltas: paradas.filter((p) => p.estado === "atendida" || p.estado === "no_asistio").length,
  pendientes: paradas.filter((p) => !["atendida", "no_asistio"].includes(p.estado)).length,
});

describe("lateStops", () => {
  it("solo las que no han empezado y pasaron su hora con 10 min de gracia", () => {
    const stops = [
      stop("a", "2026-10-19T14:45:00Z"), // 15 min tarde
      stop("b", "2026-10-19T14:55:00Z"), // 5 min: dentro de la gracia
      stop("c", "2026-10-19T14:00:00Z", "en_atencion"),
      stop("d", "2026-10-19T14:00:00Z", "atendida"),
    ];
    expect(lateStops(pro(stops), NOW).map((s) => s.id)).toEqual(["a"]);
  });
});

describe("proStatus", () => {
  it("en ruta, con a quién va o a quién atiende", () => {
    expect(proStatus(pro([stop("a", "2026-10-19T16:00:00Z", "en_camino")], route()), NOW)).toEqual({ text: "Va donde Ana María", tone: "info" });
    expect(proStatus(pro([stop("a", "2026-10-19T16:00:00Z", "en_atencion")], route()), NOW)).toEqual({ text: "Atendiendo a Ana María", tone: "success" });
    expect(proStatus(pro([stop("a", "2026-10-19T16:00:00Z")], route()), NOW)).toEqual({ text: "En ruta", tone: "success" });
  });

  it("sin salir, y avisa si va tarde", () => {
    expect(proStatus(pro([stop("a", "2026-10-19T16:00:00Z")]), NOW)).toEqual({ text: "Sin salir", tone: "neutral" });
    expect(proStatus(pro([stop("a", "2026-10-19T14:00:00Z")]), NOW)).toEqual({ text: "Sin salir · 1 visita atrasada", tone: "warning" });
  });

  it("terminó o ya resolvió todo", () => {
    expect(proStatus(pro([stop("a", "2026-10-19T14:00:00Z", "atendida")], route({ estado: "terminada" })), NOW).text).toBe("Terminó la ruta");
    expect(proStatus(pro([stop("a", "2026-10-19T14:00:00Z", "atendida")]), NOW).text).toBe("Visitas resueltas");
  });
});

describe("signalAgo", () => {
  it("dice hace cuánto llegó la última posición", () => {
    expect(signalAgo("2026-10-19T14:59:40Z", NOW)).toBe("ahora");
    expect(signalAgo("2026-10-19T14:57:00Z", NOW)).toBe("hace 3 min");
    expect(signalAgo("2026-10-19T13:30:00Z", NOW)).toBe("hace 1 h 30 min");
    expect(signalAgo(null, NOW)).toBeNull();
  });
});

describe("googleMapsLinks", () => {
  const pts = Array.from({ length: 12 }, (_, i) => ({ lat: 10 + i / 100, lng: -75 }));

  it("parte en enlaces de máximo 10 paradas, cada uno sale de donde terminó el anterior", () => {
    const links = googleMapsLinks({ lat: 9.9, lng: -75 }, pts);
    expect(links).toHaveLength(2);
    const first = new URL(links[0]).searchParams;
    expect(first.get("origin")).toBe("9.900000,-75.000000");
    expect(first.get("destination")).toBe("10.090000,-75.000000");
    expect(first.get("waypoints")?.split("|")).toHaveLength(9);
    expect(new URL(links[1]).searchParams.get("origin")).toBe("10.090000,-75.000000");
  });

  it("sin posición, Google sale desde donde esté el teléfono", () => {
    const [link] = googleMapsLinks(null, pts.slice(0, 2));
    expect(new URL(link).searchParams.has("origin")).toBe(false);
  });

  it("sin paradas, ningún enlace", () => {
    expect(googleMapsLinks(null, [])).toEqual([]);
  });
});
