import type { QuestionData } from "./question/types";

/** Lo que nunca se copia: la firma se vuelve a firmar y los archivos se vuelven a adjuntar en la historia correcta. */
const NOT_CARRIED = new Set(["section", "signature", "file", "score_total", "calculation", "medication"]);

/** Tipos con partes guardadas en claves propias (`<id>_heart_rate`…). Las demás no tienen partes: `hc_alergias_estado` es otra pregunta, no una parte de `hc_alergias`. */
const COMPOSITE = new Set(["vitals", "multifield", "clinical"]);

const normalize = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const isFilled = (v: unknown) =>
  v !== null && v !== undefined && !(typeof v === "string" && v.trim() === "") && !(Array.isArray(v) && v.length === 0);

/**
 * Respuestas de una historia que pasan a otra cuando el admisionista se equivocó:
 * un campo pasa si en la nueva hay uno del mismo tipo con el mismo id o, si no,
 * con el mismo título. Se copian el valor y sus partes (`<id>_heart_rate`…),
 * con el id de la pregunta de destino.
 */
export function carryOverAnswers(
  fromQuestions: QuestionData[],
  fromData: Record<string, unknown>,
  toQuestions: QuestionData[],
): { data: Record<string, unknown>; carried: string[] } {
  const data: Record<string, unknown> = {};
  const carried: string[] = [];
  const targets = toQuestions.filter((q) => !NOT_CARRIED.has(q.type));
  const used = new Set<string>();

  for (const source of fromQuestions) {
    if (NOT_CARRIED.has(source.type)) continue;
    const target =
      targets.find((t) => !used.has(t.id) && t.id === source.id && t.type === source.type) ??
      targets.find((t) => !used.has(t.id) && t.type === source.type && normalize(t.title) !== "" && normalize(t.title) === normalize(source.title));
    if (!target) continue;

    const prefix = `${source.id}_`;
    const parts = COMPOSITE.has(source.type) ? Object.entries(fromData).filter(([k, v]) => k.startsWith(prefix) && isFilled(v)) : [];
    if (!isFilled(fromData[source.id]) && parts.length === 0) continue;

    if (isFilled(fromData[source.id])) data[target.id] = fromData[source.id];
    for (const [k, v] of parts) data[`${target.id}_${k.slice(prefix.length)}`] = v;
    used.add(target.id);
    carried.push(target.title || target.id);
  }
  return { data, carried };
}
