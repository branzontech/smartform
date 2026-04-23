import {
  buildDoctorFooter,
  buildInstitutionHeader,
  buildPatientBlock,
  fetchDoctor,
  fetchInstitution,
  fetchPatient,
  type DoctorInfo,
  type InstitutionConfig,
  type PatientInfo,
} from '../orders/header-builder';
import { ORDER_DOCUMENT_STYLES } from '../orders/order-document';
import type { QuestionData } from '@/components/forms/question/types';

export interface FormDocumentEntry {
  id: string;
  title: string;
  description?: string;
  questions: QuestionData[];
  formData: Record<string, any>;
}

export interface FormDocumentInput {
  forms: FormDocumentEntry[];
  patientId?: string | null;
  doctorId?: string | null;
  doctorFallbackName?: string;
  institution?: InstitutionConfig | null;
  patient?: PatientInfo | null;
  doctor?: DoctorInfo | null;
}

function escapeHtml(s: any): string {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderAnswer(question: QuestionData, answer: any): string {
  if (answer === undefined || answer === null || answer === '' ||
    (Array.isArray(answer) && answer.length === 0)) {
    return `<span class="answer-empty">— Sin respuesta —</span>`;
  }

  switch (question.type) {
    case 'checkbox':
      return Array.isArray(answer)
        ? answer.map(a => escapeHtml(a)).join(', ')
        : escapeHtml(answer);

    case 'scored_checkbox':
      if (Array.isArray(answer)) {
        return answer.map(a => escapeHtml(typeof a === 'object' ? a?.text || a?.label : a)).join(', ');
      }
      return escapeHtml(answer);

    case 'vitals':
      if (typeof answer === 'object' && !Array.isArray(answer)) {
        const v: any = answer;
        if ((question as any).vitalType === 'TA' && v.sys && v.dia) {
          return `${escapeHtml(v.sys)}/${escapeHtml(v.dia)} mmHg`;
        }
        if ((question as any).vitalType === 'IMC') {
          const parts: string[] = [];
          if (v.weight) parts.push(`Peso: ${escapeHtml(v.weight)} kg`);
          if (v.height) parts.push(`Altura: ${escapeHtml(v.height)} cm`);
          if (v.bmi) parts.push(`IMC: ${escapeHtml(v.bmi)}`);
          return parts.join(' · ') || '—';
        }
        // Generic vitals object: render key/value pairs
        const entries = Object.entries(v).filter(([_, val]) => val !== '' && val !== null && val !== undefined);
        return entries
          .map(([k, val]) => `<div><span class="kv-label">${escapeHtml(k)}:</span> ${escapeHtml(val)}</div>`)
          .join('');
      }
      return escapeHtml(answer);

    case 'clinical':
      if (typeof answer === 'object' && !Array.isArray(answer)) {
        const v: any = answer;
        const title = v.title || v.code || '';
        const detail = v.detail || v.description || '';
        return `
          ${title ? `<div style="font-weight:600">${escapeHtml(title)}</div>` : ''}
          ${detail ? `<div class="muted">${escapeHtml(detail)}</div>` : ''}
        `;
      }
      return escapeHtml(answer);

    case 'diagnosis':
      if (Array.isArray(answer)) {
        return answer
          .map((d: any) => `<div>• <strong>${escapeHtml(d.code || '')}</strong> — ${escapeHtml(d.name || d.description || '')}</div>`)
          .join('');
      }
      return escapeHtml(answer);

    case 'medication':
      if (Array.isArray(answer)) {
        return answer
          .map((m: any) => {
            const name = m.nombre || m.name || 'Medicamento';
            const dose = m.dosis || m.dose || '';
            const unit = m.unidad || m.unit || '';
            return `<div>• ${escapeHtml(name)}${dose ? ` — ${escapeHtml(dose)} ${escapeHtml(unit)}` : ''}</div>`;
          })
          .join('');
      }
      return escapeHtml(answer);

    case 'multifield':
      if (typeof answer === 'object' && !Array.isArray(answer)) {
        const fields = (question as any).multifields || [];
        return Object.entries(answer)
          .filter(([_, val]) => val !== '' && val !== null && val !== undefined)
          .map(([k, val]) => {
            const label = fields.find((f: any) => f.id === k)?.label || k;
            return `<div><span class="kv-label">${escapeHtml(label)}:</span> ${escapeHtml(val)}</div>`;
          })
          .join('');
      }
      return escapeHtml(answer);

    case 'file':
      if (typeof answer === 'object' && !Array.isArray(answer) && (answer as any).name) {
        const sizeMb = ((answer as any).size || 0) / (1024 * 1024);
        return `Archivo: ${escapeHtml((answer as any).name)} (${sizeMb.toFixed(2)} MB)`;
      }
      return `<span class="answer-empty">Archivo no disponible</span>`;

    case 'signature':
      if (typeof answer === 'string' && answer.startsWith('data:image')) {
        return `<img src="${answer}" alt="Firma" class="form-signature-img" />`;
      }
      return `<span class="answer-empty">Sin firma</span>`;

    case 'paragraph':
      return `<div class="answer-paragraph">${escapeHtml(answer).replace(/\n/g, '<br/>')}</div>`;

    case 'score_total':
      if (typeof answer === 'object' && !Array.isArray(answer)) {
        const v: any = answer;
        const total = v.total ?? v.score ?? '';
        const label = v.label || '';
        return `<strong>Total: ${escapeHtml(total)}</strong>${label ? ` — ${escapeHtml(label)}` : ''}`;
      }
      return escapeHtml(answer);

    default:
      return Array.isArray(answer) ? answer.map(a => escapeHtml(a)).join(', ') : escapeHtml(answer);
  }
}

function buildFormPage(
  entry: FormDocumentEntry,
  institution: InstitutionConfig | null,
  patient: PatientInfo | null,
  doctor: DoctorInfo | null,
  fallbackDoctorName: string,
  isFirst: boolean,
): string {
  const questionsHtml = entry.questions
    .filter(q => q.type !== 'section' || (q as any).title)
    .map(q => {
      if (q.type === 'section') {
        return `<h3 class="form-section-title">${escapeHtml(q.title)}</h3>`;
      }
      const answer = entry.formData?.[q.id];
      return `
        <div class="form-q">
          <div class="form-q-label">${escapeHtml(q.title)}</div>
          <div class="form-q-answer">${renderAnswer(q, answer)}</div>
        </div>
      `;
    })
    .join('');

  return `
    <article class="doc-page" style="${isFirst ? '' : 'page-break-before: always;'}">
      ${buildInstitutionHeader(institution)}
      <h2 class="doc-title">${escapeHtml(entry.title)}</h2>
      ${entry.description ? `<p class="form-description">${escapeHtml(entry.description)}</p>` : ''}
      ${buildPatientBlock(patient)}
      <section class="doc-block">
        <div class="doc-section-label">Respuestas</div>
        <div class="form-questions">${questionsHtml}</div>
      </section>
      ${buildDoctorFooter(doctor, fallbackDoctorName)}
    </article>
  `;
}

const FORM_EXTRA_STYLES = `
  .form-description {
    font-size: 11pt;
    color: #555;
    margin: 0 0 12px 0;
  }
  .form-section-title {
    font-size: 11.5pt;
    font-weight: 600;
    color: #1a1a1a;
    margin: 14px 0 8px 0;
    padding-bottom: 4px;
    border-bottom: 1px solid #e5e7eb;
  }
  .form-questions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .form-q {
    padding: 6px 0;
    border-bottom: 1px dashed #e5e7eb;
    page-break-inside: avoid;
  }
  .form-q:last-child { border-bottom: none; }
  .form-q-label {
    font-size: 9pt;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-bottom: 3px;
  }
  .form-q-answer {
    font-size: 10.5pt;
    color: #111827;
    line-height: 1.5;
  }
  .answer-empty {
    color: #9ca3af;
    font-style: italic;
    font-size: 10pt;
  }
  .answer-paragraph {
    white-space: pre-wrap;
  }
  .kv-label {
    font-weight: 500;
    color: #4b5563;
    margin-right: 4px;
  }
  .form-signature-img {
    max-width: 240px;
    max-height: 100px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    padding: 4px;
    background: #fff;
  }
  .muted { color: #6b7280; font-size: 10pt; }
`;

export const FORM_DOCUMENT_STYLES = ORDER_DOCUMENT_STYLES + FORM_EXTRA_STYLES;

export async function buildFormsInnerHtml(input: FormDocumentInput): Promise<string> {
  const [institution, patient, doctor] = await Promise.all([
    input.institution !== undefined ? Promise.resolve(input.institution) : fetchInstitution(),
    input.patient !== undefined
      ? Promise.resolve(input.patient)
      : input.patientId
        ? fetchPatient(input.patientId)
        : Promise.resolve(null),
    input.doctor !== undefined
      ? Promise.resolve(input.doctor)
      : input.doctorId
        ? fetchDoctor(input.doctorId)
        : Promise.resolve(null),
  ]);

  const fallbackDoctor = input.doctorFallbackName || '';

  return input.forms
    .map((entry, idx) => buildFormPage(entry, institution, patient, doctor, fallbackDoctor, idx === 0))
    .join('');
}

export async function buildFormsFullHtml(input: FormDocumentInput, docTitle = 'Formularios clínicos'): Promise<string> {
  const inner = await buildFormsInnerHtml(input);
  return `<!DOCTYPE html><html lang="es"><head>
    <meta charset="utf-8" />
    <title>${escapeHtml(docTitle)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>${FORM_DOCUMENT_STYLES}</style>
  </head><body>${inner}</body></html>`;
}

export async function printForms(input: FormDocumentInput, docTitle?: string) {
  const html = await buildFormsFullHtml(input, docTitle);
  const w = window.open('', '_blank');
  if (!w) {
    alert('Permite las ventanas emergentes para imprimir.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.onload = () => setTimeout(() => w.print(), 600);
}
