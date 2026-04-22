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
} from './header-builder';

export interface OrderLike {
  id: string;
  tipo: string;
  numero_orden: string;
  estado: string;
  fecha_orden: string | null;
  prioridad: string | null;
  alcance?: string;
  medico_id?: string;
  medico_nombre: string;
  paciente_id?: string;
  diagnostico_codigo?: string | null;
  diagnostico_descripcion: string | null;
  diagnostico_sistema?: string | null;
  indicaciones: string | null;
  items: any;
  fhir_extensions?: any;
  /** When set, replaces "items" rendering with a normalized procedure table */
  items_detalle?: Array<{
    codigo_procedimiento: string;
    descripcion_procedimiento: string;
    cantidad: number;
    dias: number;
    notas?: string | null;
  }>;
  servicio?: { nombre?: string; codigo?: string } | null;
}

export const ORDER_TYPE_LABELS: Record<string, string> = {
  medicamento: 'Orden de Medicamentos',
  laboratorio: 'Orden de Laboratorio',
  imagenologia: 'Orden de Imagenología',
  interconsulta: 'Interconsulta',
  procedimiento: 'Orden de Procedimiento',
};

const PRIORITY_LABELS: Record<string, string> = {
  routine: 'Rutina',
  urgent: 'Urgente',
  stat: 'Inmediato (Stat)',
  asap: 'Lo antes posible',
};

function fmtDateTime(d: string | null): string {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function buildItemsTable(order: OrderLike): string {
  // Procedure-style items table (orden_procedimiento_items)
  if (order.items_detalle && order.items_detalle.length > 0) {
    return `
      <section class="doc-block">
        <div class="doc-section-label">Procedimientos solicitados</div>
        <table class="doc-table">
          <thead>
            <tr>
              <th style="width:40px">#</th>
              <th style="width:90px">Código</th>
              <th>Descripción</th>
              <th style="width:60px" class="center">Cant.</th>
              <th style="width:60px" class="center">Días</th>
              <th>Notas</th>
            </tr>
          </thead>
          <tbody>
            ${order.items_detalle.map((it, i) => `
              <tr>
                <td class="center">${i + 1}</td>
                <td class="mono">${it.codigo_procedimiento}</td>
                <td>${it.descripcion_procedimiento}</td>
                <td class="center">${it.cantidad}</td>
                <td class="center">${it.dias}</td>
                <td class="muted">${it.notas || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
    `;
  }

  // Generic JSONB items (medicamentos / lab / imagen / interconsulta)
  if (Array.isArray(order.items) && order.items.length > 0) {
    if (order.tipo === 'medicamento') {
      return `
        <section class="doc-block">
          <div class="doc-section-label">Medicamentos prescritos</div>
          <table class="doc-table">
            <thead>
              <tr>
                <th style="width:40px">#</th>
                <th>Medicamento</th>
                <th>Dosis</th>
                <th>Vía</th>
                <th>Frecuencia</th>
                <th>Duración</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map((it: any, i: number) => `
                <tr>
                  <td class="center">${i + 1}</td>
                  <td><strong>${it.nombre || '—'}</strong></td>
                  <td>${[it.dosis, it.unidad].filter(Boolean).join(' ') || '—'}</td>
                  <td>${it.via || '—'}</td>
                  <td>${it.frecuencia || '—'}</td>
                  <td>${it.duracion || '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </section>
      `;
    }

    return `
      <section class="doc-block">
        <div class="doc-section-label">Ítems solicitados</div>
        <table class="doc-table">
          <thead><tr><th style="width:40px">#</th><th>Descripción</th></tr></thead>
          <tbody>
            ${order.items.map((it: any, i: number) => `
              <tr>
                <td class="center">${i + 1}</td>
                <td>${it.nombre || it.descripcion || JSON.stringify(it)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
    `;
  }

  return '';
}

function buildMetaGrid(order: OrderLike): string {
  const fields: { label: string; value: string }[] = [
    { label: 'Nº Orden', value: order.numero_orden },
    { label: 'Fecha', value: fmtDateTime(order.fecha_orden) },
    { label: 'Estado', value: order.estado.charAt(0).toUpperCase() + order.estado.slice(1) },
    { label: 'Prioridad', value: PRIORITY_LABELS[order.prioridad || 'routine'] || (order.prioridad ?? '—') },
  ];
  if (order.alcance) {
    fields.push({ label: 'Alcance', value: order.alcance === 'externa' ? 'Externa' : 'Interna' });
  }
  if (order.servicio?.nombre) {
    fields.push({ label: 'Servicio', value: order.servicio.nombre });
  }
  if (order.alcance === 'externa' && order.fhir_extensions?.institucion_destino) {
    fields.push({ label: 'Institución destino', value: order.fhir_extensions.institucion_destino });
  }

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

function buildDiagnosis(order: OrderLike): string {
  if (!order.diagnostico_descripcion) return '';
  const code = order.diagnostico_codigo ? `<span class="dx-code">${order.diagnostico_codigo}</span>` : '';
  return `
    <section class="doc-block">
      <div class="doc-section-label">Diagnóstico</div>
      <div class="doc-dx">${code}<span>${order.diagnostico_descripcion}</span></div>
    </section>
  `;
}

function buildIndications(order: OrderLike): string {
  if (!order.indicaciones) return '';
  return `
    <section class="doc-block">
      <div class="doc-section-label">Indicaciones</div>
      <p class="doc-indications">${order.indicaciones.replace(/\n/g, '<br/>')}</p>
    </section>
  `;
}

const STYLES = `
  *,*::before,*::after { box-sizing: border-box; }
  html,body { margin:0; padding:0; background:#f4f5f7; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    color: #1f2433;
    font-size: 12px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  .doc-page {
    max-width: 780px;
    margin: 24px auto;
    padding: 28px 36px 24px;
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(15,23,42,0.06);
    min-height: calc(100vh - 48px);
    display: flex;
    flex-direction: column;
  }
  /* HEADER */
  .doc-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding-bottom: 14px;
    border-bottom: 2px solid #1f2433;
    margin-bottom: 18px;
  }
  .doc-logo {
    width: 64px; height: 64px; object-fit: contain;
    border-radius: 6px; background:#fff; flex-shrink:0;
  }
  .doc-logo-placeholder { width: 64px; height: 64px; flex-shrink:0; }
  .doc-header-info { flex:1; min-width:0; }
  .doc-inst-name {
    margin: 0 0 4px;
    font-size: 15px; font-weight: 700; letter-spacing: -0.01em;
    color: #0f172a;
  }
  .doc-inst-meta {
    font-size: 10.5px; color:#5a6075;
    display:flex; flex-wrap:wrap; gap: 2px 4px;
  }
  .doc-inst-meta strong { color:#1f2433; font-weight:600; }

  /* TITLE */
  .doc-title {
    text-align: center;
    font-size: 13px; font-weight: 700; letter-spacing: 0.12em;
    text-transform: uppercase;
    margin: 0 0 16px;
    color: #1f2433;
    padding: 6px 0;
    border: 1px solid #d8dce6;
    border-left: 0; border-right: 0;
    background: #fafbfc;
  }

  /* PATIENT BLOCK */
  .doc-patient {
    background: #fafbfc;
    border: 1px solid #e3e6ee;
    border-radius: 6px;
    padding: 10px 12px;
    margin-bottom: 14px;
  }
  .doc-section-label {
    font-size: 9.5px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: #6b7185;
    margin-bottom: 6px;
  }
  .doc-patient-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px 14px;
  }
  .patient-field { display:flex; flex-direction:column; min-width:0; }
  .patient-field.full { grid-column: 1 / -1; }
  .pf-label { font-size: 9px; color:#8a90a3; text-transform: uppercase; letter-spacing:0.05em; }
  .pf-value { font-size: 11.5px; font-weight: 500; color:#1f2433; word-wrap: break-word; }

  /* META */
  .doc-meta {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px 14px;
    padding: 10px 0 14px;
    border-bottom: 1px dashed #d8dce6;
    margin-bottom: 14px;
  }
  .meta-field { display:flex; flex-direction:column; min-width:0; }
  .meta-label { font-size:9px; color:#8a90a3; text-transform: uppercase; letter-spacing: 0.05em; }
  .meta-value { font-size:11.5px; font-weight: 600; color:#1f2433; word-wrap: break-word; }

  /* SECTIONS */
  .doc-block { margin-bottom: 14px; }
  .doc-dx {
    display:flex; align-items:center; gap:8px;
    font-size: 12px;
  }
  .dx-code {
    display:inline-block;
    padding: 2px 6px;
    background: #1f2433; color:#fff;
    border-radius: 4px; font-family: 'SF Mono', Menlo, Consolas, monospace;
    font-size: 10.5px; font-weight: 600;
  }
  .doc-indications {
    margin: 0;
    padding: 8px 10px;
    background: #fafbfc;
    border-left: 3px solid #1f2433;
    border-radius: 0 4px 4px 0;
    font-size: 11.5px;
    color: #2a2f3f;
  }

  /* TABLE */
  .doc-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
    border: 1px solid #d8dce6;
  }
  .doc-table th {
    background: #f4f5f8;
    color: #4a4f63;
    text-align: left;
    font-weight: 600;
    font-size: 9.5px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 6px 8px;
    border-bottom: 1px solid #d8dce6;
  }
  .doc-table td {
    padding: 6px 8px;
    border-bottom: 1px solid #ebedf3;
    color: #1f2433;
    vertical-align: top;
  }
  .doc-table tr:last-child td { border-bottom: none; }
  .doc-table .center { text-align:center; }
  .doc-table .mono { font-family:'SF Mono',Menlo,Consolas,monospace; font-weight:600; color:#0f172a; }
  .doc-table .muted { color:#6b7185; font-size:10.5px; }

  /* FOOTER */
  .doc-footer {
    margin-top: auto;
    padding-top: 36px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    align-items: end;
  }
  .doc-signature {
    text-align:center;
    display:flex; flex-direction:column; align-items:center;
  }
  .doc-signature-image-wrap {
    height: 56px; display:flex; align-items:flex-end; justify-content:center;
    margin-bottom: 2px;
  }
  .doc-signature-img {
    max-height: 56px; max-width: 220px; object-fit: contain;
  }
  .doc-signature-line {
    width: 240px;
    border-top: 1px solid #1f2433;
    margin-bottom: 4px;
  }
  .doc-doctor-name {
    font-size: 11.5px; font-weight: 700; color:#0f172a;
  }
  .doc-doctor-meta {
    font-size: 10px; color:#5a6075; margin-top: 2px;
  }
  .doc-footer-meta {
    text-align: right;
    font-size: 9.5px;
    color: #6b7185;
    line-height: 1.6;
  }
  .doc-footer-id {
    margin-top: 4px;
    font-style: italic;
    color: #8a90a3;
  }

  /* PRINT */
  @media print {
    html,body { background:#fff; }
    .doc-page {
      box-shadow: none;
      margin: 0; padding: 16mm 14mm;
      max-width: 100%;
      border-radius: 0;
      min-height: 100vh;
    }
    .no-print { display: none !important; }
  }
`;

export interface OrderDocumentInput {
  order: OrderLike;
  /** Optional pre-fetched data; if not provided will be fetched via supabase */
  institution?: InstitutionConfig | null;
  patient?: PatientInfo | null;
  doctor?: DoctorInfo | null;
}

/** Fetches missing pieces and returns the complete inner HTML body */
export async function buildOrderInnerHtml(input: OrderDocumentInput): Promise<string> {
  const [institution, patient, doctor] = await Promise.all([
    input.institution !== undefined
      ? Promise.resolve(input.institution)
      : fetchInstitution(),
    input.patient !== undefined
      ? Promise.resolve(input.patient)
      : input.order.paciente_id
        ? fetchPatient(input.order.paciente_id)
        : Promise.resolve(null),
    input.doctor !== undefined
      ? Promise.resolve(input.doctor)
      : input.order.medico_id
        ? fetchDoctor(input.order.medico_id)
        : Promise.resolve(null),
  ]);

  const title = ORDER_TYPE_LABELS[input.order.tipo] || 'Orden Médica';

  return `
    <article class="doc-page">
      ${buildInstitutionHeader(institution)}
      <h2 class="doc-title">${title}</h2>
      ${buildPatientBlock(patient)}
      ${buildMetaGrid(input.order)}
      ${buildDiagnosis(input.order)}
      ${buildItemsTable(input.order)}
      ${buildIndications(input.order)}
      ${buildDoctorFooter(doctor, input.order.medico_nombre)}
    </article>
  `;
}

/** Returns full HTML document for printing */
export async function buildOrderFullHtml(input: OrderDocumentInput): Promise<string> {
  const inner = await buildOrderInnerHtml(input);
  return `<!DOCTYPE html><html lang="es"><head>
    <meta charset="utf-8" />
    <title>${ORDER_TYPE_LABELS[input.order.tipo] || 'Orden'} ${input.order.numero_orden}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>${STYLES}</style>
  </head><body>${inner}</body></html>`;
}

export const ORDER_DOCUMENT_STYLES = STYLES;
