import { describe, expect, it } from "vitest";
import type { QuestionData } from "../question/types";
import { storedAnswer } from "./stored-answer";

const q = (id: string, type: string): QuestionData => ({ id, type, title: id, required: false });

describe("storedAnswer", () => {
  it("returns grouped composite answers as saved", () => {
    expect(storedAnswer(q("sv", "vitals"), { sv: { heart_rate: "78" } })).toEqual({ heart_rate: "78" });
  });

  it("rebuilds composite answers from old flat keys", () => {
    const data = { sv_heart_rate: "80", sv_temperature: "37", svx: "otro campo" };
    expect(storedAnswer(q("sv", "vitals"), data)).toEqual({ heart_rate: "80", temperature: "37" });
  });

  it("leaves simple answers untouched", () => {
    expect(storedAnswer(q("motivo", "paragraph"), { motivo: "Dolor", motivo_extra: "x" })).toBe("Dolor");
    expect(storedAnswer(q("sv", "vitals"), {})).toBeUndefined();
  });
});
