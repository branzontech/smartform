import {
  buildIncapacidadFullHtml,
  INCAPACIDAD_TYPE_LABELS,
  type IncapacidadDocumentInput,
  type IncapacidadLike,
} from './incapacidad-document';

export async function printIncapacidad(input: IncapacidadDocumentInput) {
  const html = await buildIncapacidadFullHtml(input);
  const w = window.open('', '_blank');
  if (!w) {
    alert('Permite las ventanas emergentes para imprimir.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.onload = () => setTimeout(() => w.print(), 500);
}

function fmtShortDate(d: string | null): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function buildShareText(inc: IncapacidadLike): { subject: string; body: string } {
  const tipoLabel = INCAPACIDAD_TYPE_LABELS[inc.tipo_incapacidad] || 'Incapacidad';
  const subject = `Certificado de Incapacidad - ${inc.numero_incapacidad || ''}`;

  const lines = [
    `📋 *Certificado de Incapacidad Médica*`,
    inc.numero_incapacidad ? `N°: ${inc.numero_incapacidad}` : '',
    `Tipo: ${tipoLabel}`,
    `Inicio: ${fmtShortDate(inc.fecha_inicio)}`,
    inc.fecha_fin ? `Fin: ${fmtShortDate(inc.fecha_fin)}` : '',
    `Duración: ${inc.duracion_dias} día(s)`,
    `Médico: ${inc.medico_nombre}`,
    inc.diagnostico_principal ? `Dx: ${inc.diagnostico_principal}` : '',
  ].filter(Boolean);

  return { subject, body: lines.join('\n') };
}

export function shareIncapacidadWhatsApp(inc: IncapacidadLike) {
  const { body } = buildShareText(inc);
  window.open(`https://wa.me/?text=${encodeURIComponent(body)}`, '_blank');
}

export function shareIncapacidadEmail(inc: IncapacidadLike) {
  const { subject, body } = buildShareText(inc);
  window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
}
