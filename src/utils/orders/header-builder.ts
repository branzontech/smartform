import { supabase } from '@/integrations/supabase/client';

export interface InstitutionConfig {
  nombre_principal?: string;
  logo_url?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  email_institucion?: string | null;
  identificacion_fiscal?: Record<string, string> | null;
  datos_regulatorios?: Record<string, string> | null;
  campos_personalizados?: { id: string; label: string; value: string }[] | null;
  pais?: string;
}

export interface PatientInfo {
  nombres: string;
  apellidos: string;
  tipo_documento?: string | null;
  numero_documento: string;
  fecha_nacimiento?: string | null;
  genero?: string | null;
  numero_historia?: string | null;
  telefono_principal?: string | null;
  email?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
}

export interface DoctorInfo {
  full_name?: string | null;
  specialty?: string | null;
  license_number?: string | null;
  signature_url?: string | null;
  phone?: string | null;
}

export async function fetchInstitution(): Promise<InstitutionConfig | null> {
  const { data } = await supabase
    .from('configuracion_encabezado')
    .select('*')
    .limit(1)
    .maybeSingle();
  return (data as any) || null;
}

export async function fetchPatient(patientId: string): Promise<PatientInfo | null> {
  const { data } = await supabase
    .from('pacientes')
    .select('nombres, apellidos, tipo_documento, numero_documento, fecha_nacimiento, genero, numero_historia, telefono_principal, email, direccion, ciudad')
    .eq('id', patientId)
    .maybeSingle();
  return (data as any) || null;
}

export async function fetchDoctor(medicoId: string): Promise<DoctorInfo | null> {
  const { data } = await supabase
    .from('profiles')
    .select('full_name, specialty, license_number, signature_url, phone')
    .eq('user_id', medicoId)
    .maybeSingle();
  return (data as any) || null;
}

function calcAge(dob?: string | null): string {
  if (!dob) return '—';
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return '—';
  const diff = Date.now() - birth.getTime();
  const age = new Date(diff).getUTCFullYear() - 1970;
  return `${age} años`;
}

function fmtDate(d?: string | null): string {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Renders the institution header bar (logo + name + fiscal/regulatory info) */
export function buildInstitutionHeader(c: InstitutionConfig | null): string {
  if (!c?.nombre_principal) return '';

  const parts: string[] = [];
  if (c.identificacion_fiscal) {
    Object.entries(c.identificacion_fiscal).forEach(([k, v]) => {
      if (v?.trim()) {
        const label = k.replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());
        parts.push(`<span><strong>${label}:</strong> ${v}</span>`);
      }
    });
  }
  if (c.direccion) parts.push(`<span>${c.direccion}</span>`);
  if (c.telefono) parts.push(`<span><strong>Tel:</strong> ${c.telefono}</span>`);
  if (c.email_institucion) parts.push(`<span>${c.email_institucion}</span>`);
  if (c.datos_regulatorios) {
    Object.entries(c.datos_regulatorios).forEach(([k, v]) => {
      if (v?.trim()) {
        const label = k.replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());
        parts.push(`<span><strong>${label}:</strong> ${v}</span>`);
      }
    });
  }

  return `
    <header class="doc-header">
      ${c.logo_url ? `<img src="${c.logo_url}" alt="${c.nombre_principal}" class="doc-logo" />` : '<div class="doc-logo-placeholder"></div>'}
      <div class="doc-header-info">
        <h1 class="doc-inst-name">${c.nombre_principal}</h1>
        <div class="doc-inst-meta">${parts.join(' &middot; ')}</div>
      </div>
    </header>
  `;
}

/** Renders the patient identification card */
export function buildPatientBlock(p: PatientInfo | null): string {
  if (!p) return '';
  const fullName = `${p.nombres} ${p.apellidos}`.trim();
  const docLabel = p.tipo_documento || 'Doc';
  return `
    <section class="doc-patient">
      <div class="doc-section-label">Datos del paciente</div>
      <div class="doc-patient-grid">
        <div class="patient-field"><span class="pf-label">Nombre</span><span class="pf-value">${fullName}</span></div>
        <div class="patient-field"><span class="pf-label">${docLabel}</span><span class="pf-value">${p.numero_documento}</span></div>
        <div class="patient-field"><span class="pf-label">Edad</span><span class="pf-value">${calcAge(p.fecha_nacimiento)}</span></div>
        <div class="patient-field"><span class="pf-label">Sexo</span><span class="pf-value">${p.genero || '—'}</span></div>
        ${p.numero_historia ? `<div class="patient-field"><span class="pf-label">HC</span><span class="pf-value">${p.numero_historia}</span></div>` : ''}
        ${p.telefono_principal ? `<div class="patient-field"><span class="pf-label">Teléfono</span><span class="pf-value">${p.telefono_principal}</span></div>` : ''}
        ${p.fecha_nacimiento ? `<div class="patient-field"><span class="pf-label">F. Nacimiento</span><span class="pf-value">${fmtDate(p.fecha_nacimiento)}</span></div>` : ''}
        ${p.direccion ? `<div class="patient-field full"><span class="pf-label">Dirección</span><span class="pf-value">${p.direccion}${p.ciudad ? `, ${p.ciudad}` : ''}</span></div>` : ''}
      </div>
    </section>
  `;
}

/** Renders the footer with doctor signature & data */
export function buildDoctorFooter(doc: DoctorInfo | null, fallbackName: string): string {
  const name = doc?.full_name || fallbackName || 'Médico tratante';
  const specialty = doc?.specialty || '';
  const license = doc?.license_number ? `Reg. Profesional: ${doc.license_number}` : '';
  const phone = doc?.phone ? `Tel: ${doc.phone}` : '';
  const meta = [specialty, license, phone].filter(Boolean).join(' &middot; ');

  return `
    <footer class="doc-footer">
      <div class="doc-signature">
        <div class="doc-signature-image-wrap">
          ${doc?.signature_url
            ? `<img src="${doc.signature_url}" alt="Firma" class="doc-signature-img" crossorigin="anonymous" />`
            : ''}
        </div>
        <div class="doc-signature-line"></div>
        <div class="doc-doctor-name">${name}</div>
        ${meta ? `<div class="doc-doctor-meta">${meta}</div>` : ''}
      </div>
      <div class="doc-footer-meta">
        <div>Documento generado el ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
        <div class="doc-footer-id">Documento clínico — Validez con firma del profesional</div>
      </div>
    </footer>
  `;
}
