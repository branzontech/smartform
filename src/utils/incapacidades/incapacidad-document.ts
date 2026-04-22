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

export interface IncapacidadLike {
  id: string;
  numero_incapacidad: string | null;
  admision_id: string;
  paciente_id: string;
  medico_id: string;
  medico_nombre: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  duracion_dias: number;
  es_prorroga: boolean;
  prorroga_tipo: string | null;
  tipo_incapacidad: string;
  grupo_servicios: string;
  modalidad_prestacion: string;
  presunto_origen: string;
  diagnostico_principal: string;
  diagnostico_rel_1: string | null;
  diagnostico_rel_2: string | null;
  diagnostico_rel_3: string | null;
  es_retroactiva: boolean;
  causa_retroactividad: string | null;
  causa_atencion: string | null;
  observaciones: string | null;
  estado: string;
  created_at: string;
}

const TIPO_LABELS: Record<string, string> = {
  enfermedad_general: 'Enfermedad General',
  accidente_trabajo: 'Accidente de Trabajo',
  enfermedad_laboral: 'Enfermedad Laboral',
  licencia_maternidad: 'Licencia de Maternidad',
  licencia_paternidad: 'Licencia de Paternidad',
};

const GRUPO_LABELS: Record<string, string> = {
  consulta_externa: 'Consulta Externa',
  urgencias: 'Urgencias',
  hospitalizacion: 'Hospitalización',
  cirugia: 'Cirugía',
};

const MODALIDAD_LABELS: Record<string, string> = {
  presencial: 'Presencial',
  extramural_domiciliaria: 'Extramural Domiciliaria',
  telemedicina_interactiva: 'Telemedicina Interactiva',
  telemedicina_no_interactiva: 'Telemedicina No Interactiva',
  telemedicina_telexperticia: 'Telexperticia',
  telemedicina_telemonitoreo: 'Telemonitoreo',
};

const ORIGEN_LABELS: Record<string, string> = {
  comun: 'Común',
  laboral: 'Laboral',
};

const PRORROGA_LABELS: Record<string, string> = {
  no_prorrogable: 'No Prorrogable',
  prorrogable: 'Prorrogable',
};

const RETRO_LABELS: Record<string, string> = {
  no_aplica: 'No Aplica',
  urgencia_internacion: 'Urgencia por internación del paciente',
  trastorno_psiquico_funcional: 'Trastorno de memoria, confusión mental o desorientación',
  evento_catastrofico_terrorista: 'Evento catastrófico o terrorista',
};

function fmtDate(d: string | null): string {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
}

function buildMetaGrid(inc: IncapacidadLike): string {
  const fields: { label: string; value: string }[] = [
    { label: 'Nº Incapacidad', value: inc.numero_incapacidad || '—' },
    { label: 'Fecha emisión', value: fmtDate(inc.created_at) },
    { label: 'Estado', value: inc.estado.charAt(0).toUpperCase() + inc.estado.slice(1) },
    { label: 'Prórroga', value: inc.prorroga_tipo ? PRORROGA_LABELS[inc.prorroga_tipo] || inc.prorroga_tipo : '—' },
  ];
  return `
    <section class="doc-meta">
      ${fields.map(f => `
        <div class="meta-field">
          <span class="meta-label">${f.label}</span>
          <span class="meta-value">${f.value}</span>
        </div>
      `).join('')}
    </section>
  `;
}

function buildPeriodBlock(inc: IncapacidadLike): string {
  return `
    <section class="doc-block">
      <div class="doc-section-label">Período de incapacidad</div>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Fecha de inicio</th>
            <th>Fecha de fin</th>
            <th class="center" style="width:120px">Duración</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>${fmtDate(inc.fecha_inicio)}</strong></td>
            <td><strong>${fmtDate(inc.fecha_fin)}</strong></td>
            <td class="center"><strong>${inc.duracion_dias} día(s)</strong></td>
          </tr>
        </tbody>
      </table>
    </section>
  `;
}

function buildClinicalBlock(inc: IncapacidadLike): string {
  const fields: { label: string; value: string }[] = [
    { label: 'Tipo de incapacidad', value: TIPO_LABELS[inc.tipo_incapacidad] || inc.tipo_incapacidad },
    { label: 'Grupo de servicios', value: GRUPO_LABELS[inc.grupo_servicios] || inc.grupo_servicios },
    { label: 'Modalidad de prestación', value: MODALIDAD_LABELS[inc.modalidad_prestacion] || inc.modalidad_prestacion },
    { label: 'Presunto origen', value: ORIGEN_LABELS[inc.presunto_origen] || inc.presunto_origen },
  ];

  return `
    <section class="doc-block">
      <div class="doc-section-label">Datos clínicos</div>
      <div class="doc-meta" style="border-bottom:none; padding:6px 0 0; margin-bottom:0;">
        ${fields.map(f => `
          <div class="meta-field">
            <span class="meta-label">${f.label}</span>
            <span class="meta-value">${f.value}</span>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function renderDx(value: string | null): string {
  if (!value) return '';
  const [code, ...rest] = value.split(' — ');
  const description = rest.join(' — ') || code;
  return `<div class="doc-dx" style="margin-bottom:6px;">
    <span class="dx-code">${code}</span><span>${description}</span>
  </div>`;
}

function buildDiagnoses(inc: IncapacidadLike): string {
  const principal = renderDx(inc.diagnostico_principal);
  const related = [inc.diagnostico_rel_1, inc.diagnostico_rel_2, inc.diagnostico_rel_3]
    .filter(Boolean)
    .map(renderDx)
    .join('');

  if (!principal && !related) return '';

  return `
    <section class="doc-block">
      <div class="doc-section-label">Diagnósticos</div>
      ${principal ? `<div style="margin-bottom:8px;">
        <div style="font-size:9.5px; color:#6b7185; margin-bottom:2px;">Principal</div>
        ${principal}
      </div>` : ''}
      ${related ? `<div>
        <div style="font-size:9.5px; color:#6b7185; margin-bottom:2px;">Relacionados</div>
        ${related}
      </div>` : ''}
    </section>
  `;
}

function buildAdditionalInfo(inc: IncapacidadLike): string {
  const items: string[] = [];

  if (inc.es_prorroga) {
    items.push(`<div><strong>Prórroga:</strong> Sí</div>`);
  }
  if (inc.es_retroactiva) {
    const causa = inc.causa_retroactividad ? RETRO_LABELS[inc.causa_retroactividad] || inc.causa_retroactividad : '—';
    items.push(`<div><strong>Retroactiva:</strong> Sí — <span class="muted-text">${causa}</span></div>`);
  }
  if (inc.causa_atencion) {
    items.push(`<div><strong>Causa de la atención:</strong><br/>${inc.causa_atencion.replace(/\n/g, '<br/>')}</div>`);
  }
  if (inc.observaciones) {
    items.push(`<div><strong>Observaciones:</strong><br/>${inc.observaciones.replace(/\n/g, '<br/>')}</div>`);
  }

  if (items.length === 0) return '';

  return `
    <section class="doc-block">
      <div class="doc-section-label">Información adicional</div>
      <div class="doc-indications" style="display:flex; flex-direction:column; gap:6px;">
        ${items.join('')}
      </div>
    </section>
  `;
}

export interface IncapacidadDocumentInput {
  incapacidad: IncapacidadLike;
  institution?: InstitutionConfig | null;
  patient?: PatientInfo | null;
  doctor?: DoctorInfo | null;
}

export async function buildIncapacidadInnerHtml(input: IncapacidadDocumentInput): Promise<string> {
  const [institution, patient, doctor] = await Promise.all([
    input.institution !== undefined ? Promise.resolve(input.institution) : fetchInstitution(),
    input.patient !== undefined
      ? Promise.resolve(input.patient)
      : input.incapacidad.paciente_id
        ? fetchPatient(input.incapacidad.paciente_id)
        : Promise.resolve(null),
    input.doctor !== undefined
      ? Promise.resolve(input.doctor)
      : input.incapacidad.medico_id
        ? fetchDoctor(input.incapacidad.medico_id)
        : Promise.resolve(null),
  ]);

  const title = 'Certificado de Incapacidad Médica';

  return `
    <article class="doc-page">
      ${buildInstitutionHeader(institution)}
      <h2 class="doc-title">${title}</h2>
      ${buildPatientBlock(patient)}
      ${buildMetaGrid(input.incapacidad)}
      ${buildPeriodBlock(input.incapacidad)}
      ${buildClinicalBlock(input.incapacidad)}
      ${buildDiagnoses(input.incapacidad)}
      ${buildAdditionalInfo(input.incapacidad)}
      ${buildDoctorFooter(doctor, input.incapacidad.medico_nombre)}
    </article>
  `;
}

export async function buildIncapacidadFullHtml(input: IncapacidadDocumentInput): Promise<string> {
  const inner = await buildIncapacidadInnerHtml(input);
  return `<!DOCTYPE html><html lang="es"><head>
    <meta charset="utf-8" />
    <title>Incapacidad ${input.incapacidad.numero_incapacidad || ''}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>${ORDER_DOCUMENT_STYLES}</style>
  </head><body>${inner}</body></html>`;
}

export const INCAPACIDAD_TYPE_LABELS = TIPO_LABELS;
