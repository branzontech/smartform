import { describe, expect, it } from "vitest";
import { arrivalAt, decodePolyline, formatDistance, formatDuration, lateMinutes, navigationLinks, nextStop, trafficDelay, trafficSegments, type Parada } from "./rutas";

describe("decodePolyline", () => {
  it("decodifica el ejemplo de la documentación de Google", () => {
    expect(decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@")).toEqual([
      { latitude: 38.5, longitude: -120.2 },
      { latitude: 40.7, longitude: -120.95 },
      { latitude: 43.252, longitude: -126.453 },
    ]);
  });
});

describe("formatos", () => {
  it("minutos y horas", () => {
    expect(formatDuration(470)).toBe("8 min");
    expect(formatDuration(3_900)).toBe("1 h 05 min");
    expect(formatDuration(10)).toBe("1 min");
  });

  it("metros y kilómetros con coma decimal", () => {
    expect(formatDistance(846)).toBe("850 m");
    expect(formatDistance(2_140)).toBe("2,1 km");
  });

  it("hora de llegada en Colombia", () => {
    // 19:00 UTC son las 14:00 en Colombia; 8 minutos después.
    expect(arrivalAt(480, Date.parse("2026-10-19T19:00:00Z"))).toBe("14:08");
  });
});

describe("nextStop", () => {
  const p = (id: string, estado: Parada["estado"]) => ({ id, estado }) as Parada;
  it("es la primera pendiente en el orden del día", () => {
    expect(nextStop([p("a", "atendida"), p("b", "no_asistio"), p("c", "en_camino"), p("d", "programada")])?.id).toBe("c");
    expect(nextStop([p("a", "atendida")])).toBeNull();
  });
});

describe("tráfico", () => {
  const pts = [0, 1, 2, 3, 4, 5].map((i) => ({ latitude: i, longitude: i }));
  it("corta el trazado en tramos normales y con tráfico, sin huecos", () => {
    const segs = trafficSegments(pts, [{ inicio: 2, fin: 4, velocidad: "TRAFFIC_JAM" }]);
    expect(segs.map((s) => [s.velocidad, s.coords.map((c) => c.latitude).join("")])).toEqual([
      ["NORMAL", "012"],
      ["TRAFFIC_JAM", "234"],
      ["NORMAL", "45"],
    ]);
  });

  it("sin datos de tráfico todo es normal", () => {
    expect(trafficSegments(pts, [])).toEqual([{ coords: pts, velocidad: "NORMAL" }]);
  });

  it("la demora solo se dice si pasa de 2 minutos", () => {
    expect(trafficDelay({ segundos: 1962, segundosSinTrafico: 1499 })).toBe("8 min de demora por tráfico");
    expect(trafficDelay({ segundos: 600, segundosSinTrafico: 560 })).toBeNull();
  });
});

describe("lateMinutes", () => {
  it("avisa solo si llega más de 10 minutos después de la hora de la cita", () => {
    // Cita a las 14:00 en Colombia (19:00 UTC).
    expect(lateMinutes("14:25", "2026-10-19T19:00:00Z")).toBe(25);
    expect(lateMinutes("14:08", "2026-10-19T19:00:00Z")).toBe(0);
    expect(lateMinutes("10:11", "2026-10-19T19:00:00Z")).toBe(0);
  });
});

describe("navigationLinks", () => {
  it("arma los enlaces de Google Maps, Waze y Apple", () => {
    const l = navigationLinks({ latitud: 10.4184, longitud: -75.5414 });
    expect(l.google).toContain("destination=10.4184,-75.5414");
    expect(l.waze).toContain("ll=10.4184,-75.5414");
    expect(l.apple).toContain("daddr=10.4184,-75.5414");
  });
});
