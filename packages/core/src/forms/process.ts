import { scoreSummary } from "./scoring";
import type { FormAnswers, QuestionData } from "./types";
import { calculatedVitalEntries } from "./vitals";

/**
 * Respuestas como se guardan en respuestas_formularios.datos_respuesta: las
 * claves sueltas (para reabrir el registro) más cada pregunta compuesta
 * agrupada en su propio objeto (para leerla e imprimirla).
 */
export function processFormValues(qs: QuestionData[], fd: FormAnswers, rawValues: FormAnswers = fd): FormAnswers {
  const processedValues: FormAnswers = { ...rawValues };
  qs.forEach((question) => {
    if (question.type === "vitals") {
      const predefined = question.predefinedVitals;
      if (predefined) {
        const vitalsData: FormAnswers = {};
        Object.entries(predefined).forEach(([key, v]) => {
          if (v.enabled) vitalsData[key] = fd[`${question.id}_${key}`] || "";
        });
        (question.customVitals || []).forEach((cv) => {
          vitalsData[`custom_${cv.id}`] = fd[`${question.id}_custom_${cv.id}`] || "";
        });
        processedValues[question.id] = vitalsData;
      } else if (question.vitalType === "TA") {
        processedValues[question.id] = { sys: fd[`${question.id}_sys`], dia: fd[`${question.id}_dia`] };
      } else if (question.vitalType === "IMC") {
        processedValues[question.id] = { weight: fd[`${question.id}_weight`], height: fd[`${question.id}_height`], bmi: fd[`${question.id}_bmi`] };
      }
    } else if (question.type === "clinical") {
      processedValues[question.id] = { title: fd[`${question.id}_title`], detail: fd[`${question.id}_detail`] };
    } else if (question.type === "multifield" && question.multifields) {
      const multifieldValues: Record<string, string> = {};
      question.multifields.forEach((field) => {
        multifieldValues[field.id] = fd[`${question.id}_${field.id}`] || "";
      });
      processedValues[question.id] = multifieldValues;
    } else if (question.type === "scored_checkbox" || question.type === "score_total") {
      processedValues[question.id] = fd[question.id] || { score: 0 };
    }
  });
  return processedValues;
}

/**
 * Recalcula lo que el profesional no escribe: el total de cada escala y los
 * signos vitales calculados. Devuelve el mismo objeto si nada cambió.
 */
export function withDerivedValues(qs: QuestionData[], fd: FormAnswers): FormAnswers {
  let next = fd;
  const set = (key: string, value: unknown) => {
    if (next === fd) next = { ...fd };
    next[key] = value;
  };
  for (const q of qs) {
    if (q.type === "vitals") {
      for (const [key, value] of Object.entries(calculatedVitalEntries(q, next))) {
        if ((next[key] ?? "") !== value) set(key, value);
      }
    } else if (q.type === "score_total") {
      const summary = scoreSummary(q, next);
      const current = next[q.id];
      // Abrir el formato no lo marca como modificado: solo se guarda cuando hay algo respondido.
      if (!current && summary.answered === 0) continue;
      if (!current || current.score !== summary.total || current.interpretation !== summary.interpretation) {
        set(q.id, { score: summary.total, interpretation: summary.interpretation });
      }
    }
  }
  return next;
}
