import { describe, expect, it } from "vitest";
import { chosenFrom, frequencyText, sessionLabel, type SessionCheck } from "./planes";

const PRO = "11111111-1111-4111-8111-111111111111";

describe("frequencyText", () => {
  it("describe cada frecuencia en palabras", () => {
    expect(frequencyText({ frecuencia: "cada_n_dias", cadaDias: 2, turnos: [] })).toBe("Cada 2 días");
    expect(frequencyText({ frecuencia: "cada_n_dias", cadaDias: 1, turnos: [] })).toBe("Todos los días");
    expect(frequencyText({ frecuencia: "mensual", turnos: [] })).toBe("Cada mes");
    const turns = [{ dia: 5, hora: "08:00", profesionalId: PRO }, { dia: 1, hora: "08:00", profesionalId: PRO }, { dia: 3, hora: "08:00", profesionalId: PRO }];
    expect(frequencyText({ frecuencia: "semanal", cadaSemanas: 1, turnos: turns })).toBe("Lunes, miércoles y viernes");
    expect(frequencyText({ frecuencia: "semanal", cadaSemanas: 2, turnos: turns.slice(0, 1) })).toBe("Cada 2 semanas: viernes");
  });
});

describe("sessionLabel", () => {
  it("numera la sesión solo si es de un plan", () => {
    expect(sessionLabel({ planId: "p", planSesion: 3, planTotal: 12 })).toBe("Sesión 3 de 12");
    expect(sessionLabel({ planId: null, planSesion: null, planTotal: 0 })).toBeNull();
  });
});

describe("chosenFrom", () => {
  const check = (sesion: number, over: Partial<SessionCheck> = {}): SessionCheck => ({
    sesion, fecha: "2026-10-26", hora: "08:00", inicio: `i${sesion}`, profesionalId: PRO, profesional: "Dra.", sedeId: null, problema: null, alternativa: null, ...over,
  });

  it("usa la alternativa cuando hay problema y omite lo que no tiene salida o se quitó", () => {
    const checks = [
      check(1),
      check(2, { problema: "Festivo", alternativa: { fecha: "2026-10-27", hora: "08:00", inicio: "alt2", sedeId: null } }),
      check(3, { problema: "Ocupado" }),
      check(4),
    ];
    expect(chosenFrom(checks, new Set([4])).map((s) => s.inicio)).toEqual(["i1", "alt2"]);
  });
});
