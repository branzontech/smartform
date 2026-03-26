import { supabase } from '@/integrations/supabase/client';
import type { Order } from '@/components/orders/OrdersListPanel';

const typeLabels: Record<string, string> = {
  medicamento: 'Orden de Medicamentos',
  laboratorio: 'Orden de Laboratorio',
  imagenologia: 'Orden de Imagenología',
  interconsulta: 'Interconsulta',
  procedimiento: 'Orden de Procedimiento',
};

const prioridadLabel: Record<string, string> = {
  routine: 'Rutina',
  urgent: 'Urgente',
  stat: 'Stat',
  asap: 'Lo antes posible',
};

async function fetchHeaderConfig() {
  const { data } = await supabase
    .from('configuracion_encabezado')
    .select('*')
    .limit(1)
    .maybeSingle();
  return data;
}

function buildHeaderHtml(config: any): string {
  if (!config) return '';
  const name = config.nombre_principal || '';
  if (!name) return '';

  let headerParts = '';
  const fiscal = config.identificacion_fiscal as Record<string, string> | null;
  if (fiscal) {
    Object.entries(fiscal).filter(([, v]) => v?.trim()).forEach(([k, v]) => {
      const label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      headerParts += `<span>${label}: ${v}</span>`;
    });
  }
  if (config.direccion) headerParts += `<span>${config.direccion}</span>`;
  if (config.telefono) headerParts += `<span>Tel: ${config.telefono}</span>`;
  if (config.email_institucion) headerParts += `<span>${config.email_institucion}</span>`;

  const reg = config.datos_regulatorios as Record<string, string> | null;
  if (reg) {
    Object.entries(reg).filter(([, v]) => v?.trim()).forEach(([k, v]) => {
      const label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      headerParts += `<span>${label}: ${v}</span>`;
    });
  }

  return `
    <div class="inst-header">
      <div style="display:flex;align-items:center;gap:12px;">
        ${config.logo_url ? `<img src="${config.logo_url}" style="width:60px;height:60px;object-fit:contain;border-radius:6px;" />` : ''}
        <div>
          <div style="font-weight:700;font-size:14px;">${name}</div>
          <div style="font-size:11px;color:#555;display:flex;flex-wrap:wrap;gap:4px 12px;">${headerParts}</div>
        </div>
      </div>
    </div>
  `;
}

function buildOrderHtml(order: Order, headerHtml: string): string {
  const fecha = order.fecha_orden
    ? new Date(order.fecha_orden).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'N/A';

  let itemsHtml = '';
  if (order.items && Array.isArray(order.items) && order.items.length > 0) {
    itemsHtml = `
      <div class="section">
        <div class="section-title">Medicamentos / Ítems</div>
        <table class="items-table">
          <thead><tr><th>#</th><th>Nombre</th><th>Dosis</th><th>Vía</th><th>Frecuencia</th><th>Duración</th></tr></thead>
          <tbody>
            ${order.items.map((item: any, i: number) => `
              <tr>
                <td>${i + 1}</td>
                <td>${item.nombre || '-'}</td>
                <td>${item.dosis || '-'} ${item.unidad || ''}</td>
                <td>${item.via || '-'}</td>
                <td>${item.frecuencia || '-'}</td>
                <td>${item.duracion || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  return `<!DOCTYPE html><html><head>
    <title>${order.numero_orden}</title>
    <meta charset="utf-8">
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: system-ui,-apple-system,sans-serif; color:#222; padding:24px; font-size:13px; line-height:1.5; }
      .page { max-width:750px; margin:0 auto; }
      .inst-header { border-bottom:2px solid #333; padding-bottom:10px; margin-bottom:14px; }
      .order-title { font-size:16px; font-weight:700; text-align:center; margin-bottom:14px; text-transform:uppercase; letter-spacing:0.5px; }
      .meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px 20px; margin-bottom:16px; font-size:12px; }
      .meta-grid .label { color:#666; }
      .meta-grid .value { font-weight:600; }
      .section { margin-bottom:14px; }
      .section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#666; margin-bottom:6px; border-bottom:1px solid #ddd; padding-bottom:3px; }
      .section-content { font-size:13px; }
      .items-table { width:100%; border-collapse:collapse; font-size:12px; }
      .items-table th, .items-table td { border:1px solid #ddd; padding:5px 8px; text-align:left; }
      .items-table th { background:#f5f5f5; font-weight:600; font-size:11px; text-transform:uppercase; }
      .signature-block { margin-top:50px; display:flex; justify-content:space-between; }
      .signature-line { width:200px; border-top:1px solid #333; padding-top:4px; text-align:center; font-size:11px; color:#666; }
      .footer { margin-top:30px; text-align:center; font-size:10px; color:#999; }
      .no-print { text-align:center; margin-top:20px; }
      .no-print button { padding:8px 20px; background:#0066cc; color:#fff; border:none; border-radius:4px; cursor:pointer; font-size:13px; margin:0 6px; }
      .no-print button.secondary { background:#666; }
      @media print { .no-print { display:none; } body { padding:10px; } }
    </style>
  </head><body>
    <div class="page">
      ${headerHtml}
      <div class="order-title">${typeLabels[order.tipo] || 'Orden Médica'}</div>

      <div class="meta-grid">
        <div><span class="label">No. Orden: </span><span class="value">${order.numero_orden}</span></div>
        <div><span class="label">Fecha: </span><span class="value">${fecha}</span></div>
        <div><span class="label">Estado: </span><span class="value">${order.estado}</span></div>
        <div><span class="label">Prioridad: </span><span class="value">${prioridadLabel[order.prioridad || 'routine'] || order.prioridad}</span></div>
        <div><span class="label">Médico: </span><span class="value">${order.medico_nombre}</span></div>
      </div>

      ${order.diagnostico_descripcion ? `
        <div class="section">
          <div class="section-title">Diagnóstico</div>
          <div class="section-content">${order.diagnostico_descripcion}</div>
        </div>
      ` : ''}

      ${itemsHtml}

      ${order.indicaciones ? `
        <div class="section">
          <div class="section-title">Indicaciones</div>
          <div class="section-content">${order.indicaciones}</div>
        </div>
      ` : ''}

      <div class="signature-block">
        <div class="signature-line">Firma del Médico</div>
        <div class="signature-line">Firma del Paciente</div>
      </div>

      <div class="footer">Documento generado el ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</div>

      <div class="no-print">
        <button onclick="window.print()">Imprimir</button>
      </div>
    </div>
  </body></html>`;
}

export async function printOrder(order: Order) {
  const config = await fetchHeaderConfig();
  const headerHtml = buildHeaderHtml(config);
  const html = buildOrderHtml(order, headerHtml);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permite las ventanas emergentes para imprimir.');
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => setTimeout(() => printWindow.print(), 400);
}

export function shareOrderWhatsApp(order: Order) {
  const fecha = order.fecha_orden
    ? new Date(order.fecha_orden).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  const items = Array.isArray(order.items)
    ? order.items.map((i: any) => `• ${i.nombre || 'Item'} ${i.dosis ? `- ${i.dosis} ${i.unidad || ''}` : ''}`).join('\n')
    : '';

  const text = [
    `📋 *${typeLabels[order.tipo] || 'Orden Médica'}*`,
    `No: ${order.numero_orden}`,
    fecha ? `Fecha: ${fecha}` : '',
    `Médico: ${order.medico_nombre}`,
    order.diagnostico_descripcion ? `Dx: ${order.diagnostico_descripcion}` : '',
    items ? `\n*Medicamentos:*\n${items}` : '',
    order.indicaciones ? `\nIndicaciones: ${order.indicaciones}` : '',
  ].filter(Boolean).join('\n');

  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

export function shareOrderEmail(order: Order) {
  const fecha = order.fecha_orden
    ? new Date(order.fecha_orden).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  const items = Array.isArray(order.items)
    ? order.items.map((i: any) => `- ${i.nombre || 'Item'} ${i.dosis ? `(${i.dosis} ${i.unidad || ''})` : ''}`).join('\n')
    : '';

  const subject = `${typeLabels[order.tipo] || 'Orden Médica'} - ${order.numero_orden}`;
  const body = [
    `${typeLabels[order.tipo] || 'Orden Médica'}`,
    `No: ${order.numero_orden}`,
    fecha ? `Fecha: ${fecha}` : '',
    `Médico: ${order.medico_nombre}`,
    order.diagnostico_descripcion ? `Diagnóstico: ${order.diagnostico_descripcion}` : '',
    items ? `\nMedicamentos:\n${items}` : '',
    order.indicaciones ? `\nIndicaciones: ${order.indicaciones}` : '',
  ].filter(Boolean).join('\n');

  window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
}
