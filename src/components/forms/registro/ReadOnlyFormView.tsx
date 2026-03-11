import React from 'react';
import { FormHeaderPreview } from '@/components/forms/FormHeaderPreview';

interface ReadOnlyFormViewProps {
  questions: any[];
  data: Record<string, any>;
  headerConfig?: any;
  formTitle: string;
}

/**
 * Renders a form's questions + saved answers in read-only mode,
 * preserving the visual structure of the original form (sections, labels, layout).
 */
export const ReadOnlyFormView: React.FC<ReadOnlyFormViewProps> = ({
  questions,
  data,
  headerConfig,
  formTitle,
}) => {
  if (!questions || questions.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin datos del formulario.</p>;
  }

  return (
    <div className="bg-card rounded-lg border border-border/50 overflow-hidden">
      {headerConfig && (
        <FormHeaderPreview config={headerConfig} formTitle={formTitle} />
      )}
      <div className="p-5 space-y-5">
        {questions.map((q: any) => (
          <ReadOnlyQuestion key={q.id} question={q} data={data} />
        ))}
      </div>
    </div>
  );
};

// ── Individual question renderer (read-only) ─────────────
const ReadOnlyQuestion: React.FC<{ question: any; data: Record<string, any> }> = ({ question, data }) => {
  // Section divider
  if (question.type === 'section') {
    return (
      <div className="relative py-1">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
            {question.title || 'Sección'}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
      </div>
    );
  }

  const value = data[question.id];

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{question.title}</label>
      <div className="text-sm text-foreground min-h-[24px]">
        <ValueRenderer question={question} value={value} data={data} />
      </div>
    </div>
  );
};

// ── Value renderer by question type ──────────────────────
const ValueRenderer: React.FC<{ question: any; value: any; data: Record<string, any> }> = ({ question, value, data }) => {
  const empty = <span className="text-muted-foreground italic">Sin respuesta</span>;

  switch (question.type) {
    case 'short':
    case 'paragraph':
    case 'calculation':
      if (!value && value !== 0) return empty;
      return <p className="whitespace-pre-wrap">{String(value)}</p>;

    case 'multiple':
    case 'dropdown':
      if (!value) return empty;
      return (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-primary flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          </div>
          <span>{String(value)}</span>
        </div>
      );

    case 'checkbox':
      if (!value || (Array.isArray(value) && value.length === 0)) return empty;
      const items = Array.isArray(value) ? value : [value];
      return (
        <div className="space-y-1">
          {items.map((item: string, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-sm border border-primary bg-primary/10 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>{item}</span>
            </div>
          ))}
        </div>
      );

    case 'vitals':
      if (question.vitalType === 'TA') {
        const val = typeof value === 'object' && value ? value : { sys: data[`${question.id}_sys`], dia: data[`${question.id}_dia`] };
        if (!val?.sys && !val?.dia) return empty;
        return <p>{val.sys || '—'}/{val.dia || '—'} mmHg</p>;
      }
      if (question.vitalType === 'IMC') {
        const val = typeof value === 'object' && value ? value : {
          weight: data[`${question.id}_weight`],
          height: data[`${question.id}_height`],
          bmi: data[`${question.id}_bmi`],
        };
        if (!val?.weight && !val?.height) return empty;
        return (
          <div className="flex gap-4 text-sm">
            <span>Peso: <strong>{val.weight || '—'}</strong> kg</span>
            <span>Altura: <strong>{val.height || '—'}</strong> cm</span>
            <span>IMC: <strong>{val.bmi || '—'}</strong></span>
          </div>
        );
      }
      if (!value && value !== 0) return empty;
      return <p>{String(value)} {question.units || ''}</p>;

    case 'clinical':
      const clinVal = typeof value === 'object' && value ? value : {
        title: data[`${question.id}_title`],
        detail: data[`${question.id}_detail`],
      };
      if (!clinVal?.title && !clinVal?.detail) return empty;
      return (
        <div>
          {clinVal.title && <p className="font-medium">{clinVal.title}</p>}
          {clinVal.detail && <p className="text-muted-foreground">{clinVal.detail}</p>}
        </div>
      );

    case 'multifield':
      if (typeof value === 'object' && value && !Array.isArray(value)) {
        const fields = question.multifields || [];
        return (
          <div className={question.orientation === 'horizontal' ? 'grid grid-cols-2 gap-3' : 'space-y-2'}>
            {fields.map((f: any) => (
              <div key={f.id}>
                <span className="text-xs text-muted-foreground">{f.label}:</span>{' '}
                <span className="font-medium">{value[f.id] || '—'}</span>
              </div>
            ))}
          </div>
        );
      }
      return empty;

    case 'diagnosis':
      if (!value) {
        const diagnoses = question.diagnoses;
        if (diagnoses && diagnoses.length > 0) {
          return (
            <div className="space-y-1">
              {diagnoses.map((d: any) => (
                <div key={d.id} className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-primary">{d.code}</span>
                  <span>— {d.name}</span>
                </div>
              ))}
            </div>
          );
        }
        return empty;
      }
      return <p>{String(value)}</p>;

    case 'signature':
      if (value && typeof value === 'string' && value.startsWith('data:image')) {
        return (
          <div className="max-w-xs">
            <img src={value} alt="Firma" className="border border-border rounded h-16" />
          </div>
        );
      }
      return empty;

    case 'file':
      if (typeof value === 'object' && value?.name) {
        return (
          <p className="text-sm">
            📎 {value.name} <span className="text-xs text-muted-foreground">({((value.size || 0) / (1024 * 1024)).toFixed(2)} MB)</span>
          </p>
        );
      }
      return empty;

    case 'medication':
      return <p className="text-muted-foreground italic text-xs">Medicamentos gestionados en el módulo de prescripción</p>;

    default:
      if (!value && value !== 0) return empty;
      if (Array.isArray(value)) return <p>{value.join(', ')}</p>;
      if (typeof value === 'object') {
        return (
          <p>{Object.entries(value).filter(([, v]) => v != null && v !== '').map(([k, v]) => `${k}: ${v}`).join(', ') || '—'}</p>
        );
      }
      return <p>{String(value)}</p>;
  }
};
