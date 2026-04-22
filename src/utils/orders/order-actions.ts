import {
  buildOrderFullHtml,
  ORDER_TYPE_LABELS,
  type OrderDocumentInput,
  type OrderLike,
} from './order-document';

export async function printOrder(input: OrderDocumentInput) {
  const html = await buildOrderFullHtml(input);
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

function buildShareText(order: OrderLike): { subject: string; body: string } {
  const subject = `${ORDER_TYPE_LABELS[order.tipo] || 'Orden Médica'} - ${order.numero_orden}`;

  const items = order.items_detalle?.length
    ? order.items_detalle.map(i => `• ${i.codigo_procedimiento} ${i.descripcion_procedimiento} (x${i.cantidad})`).join('\n')
    : Array.isArray(order.items)
      ? order.items.map((i: any) => `• ${i.nombre || 'Ítem'}${i.dosis ? ` — ${i.dosis} ${i.unidad || ''}` : ''}`).join('\n')
      : '';

  const lines = [
    `📋 *${ORDER_TYPE_LABELS[order.tipo] || 'Orden Médica'}*`,
    `N°: ${order.numero_orden}`,
    order.fecha_orden ? `Fecha: ${fmtShortDate(order.fecha_orden)}` : '',
    `Médico: ${order.medico_nombre}`,
    order.diagnostico_descripcion ? `Dx: ${order.diagnostico_descripcion}` : '',
    items ? `\n${items}` : '',
    order.indicaciones ? `\nIndicaciones: ${order.indicaciones}` : '',
  ].filter(Boolean);

  return { subject, body: lines.join('\n') };
}

export function shareOrderWhatsApp(order: OrderLike) {
  const { body } = buildShareText(order);
  window.open(`https://wa.me/?text=${encodeURIComponent(body)}`, '_blank');
}

export function shareOrderEmail(order: OrderLike) {
  const { subject, body } = buildShareText(order);
  window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
}
