import { AreaField, ContractSection, FieldGrid, NumberField, SelectField, TextField, ToggleRow } from "../fields";
import { MODALITY_LABEL, PGP_PERIODS, PROSPECTIVE } from "../contract-model";
import type { SectionProps } from "../contract-form";

const PERIOD_LABEL: Record<string, string> = { mensual: "Mensual", bimestral: "Bimestral", trimestral: "Trimestral", semestral: "Semestral", anual: "Anual" };

/** Datos propios de la modalidad: solo aparece lo que aplica a la elegida. */
export function ModalitySection({ form, set }: SectionProps) {
  const m = form.tipo_contratacion;
  return (
    <ContractSection id="modalidad" title={`Modalidad: ${MODALITY_LABEL[m]}`} description="Lo que pide la modalidad de pago elegida (art. 2.5.3.4.2.3).">
      {m === "evento" && (
        <p className="text-[13px] text-muted-foreground">
          Por evento se paga cada servicio prestado con las tarifas del contrato. La norma no exige nota técnica, aunque la recomienda.
        </p>
      )}
      {m === "particular" && <p className="text-[13px] text-muted-foreground">Venta directa al paciente con el manual tarifario elegido.</p>}
      {m === "pgp" && (
        <FieldGrid cols={3}>
          <NumberField id="pgp-value" label="Valor por periodo" required prefix="$" value={form.pgp_valor_periodo} onChange={(v) => set("pgp_valor_periodo", v)} />
          <SelectField
            id="pgp-period" label="Periodicidad" required value={form.pgp_periodicidad || null} onChange={(v) => set("pgp_periodicidad", v)}
            options={PGP_PERIODS.map((p) => ({ value: p, label: PERIOD_LABEL[p] }))}
          />
          <NumberField id="pgp-pop" label="Población" required suffix="personas" value={form.pgp_poblacion} onChange={(v) => set("pgp_poblacion", v)} />
        </FieldGrid>
      )}
      {m === "capita" && (
        <FieldGrid cols={3}>
          <NumberField id="cap-users" label="Número de usuarios" required value={form.numero_usuarios} onChange={(v) => set("numero_usuarios", v)} />
          <NumberField id="cap-value" label="Valor por usuario al mes" required prefix="$" value={form.valor_por_usuario} onChange={(v) => set("valor_por_usuario", v)} />
          <NumberField id="cap-copay" label="Copago pactado" prefix="$" value={form.copago_pactado} onChange={(v) => set("copago_pactado", v)} />
        </FieldGrid>
      )}
      {m === "paquete" && <p className="text-[13px] text-muted-foreground">El valor de cada paquete y lo que incluye se registra en Tarifas › Paquetes.</p>}
      {PROSPECTIVE.has(m) && (
        <p className="rounded-tile bg-amber-500/10 px-4 py-3 text-[13px] leading-5">
          <span className="font-semibold">Modalidad prospectiva:</span> la norma exige nota técnica (población, frecuencias de uso, costos y monitoreo) y
          mecanismos de ajuste de riesgo. Su registro estructurado llega en la fase 2; mientras tanto, deben constar en el contrato firmado.
        </p>
      )}
    </ContractSection>
  );
}

export function BillingSection({ form, set }: SectionProps) {
  return (
    <ContractSection id="facturacion" title="Facturación y pagos" description="Factura electrónica, radicación y plazos de pago (Leyes 1122 de 2007, 1438 de 2011 y 2024 de 2020).">
      <FieldGrid cols={3}>
        <NumberField id="rad-days" label="Plazo de radicación" suffix="días" value={form.plazo_radicacion_dias} onChange={(v) => set("plazo_radicacion_dias", v)} />
        <NumberField id="pay-days" label="Plazo de pago" required suffix="días" value={form.plazo_pago_dias} onChange={(v) => set("plazo_pago_dias", v)} />
        <NumberField id="due-days" label="Vencimiento de la factura" suffix="días" value={form.dias_vencimiento_factura} onChange={(v) => set("dias_vencimiento_factura", v)} />
      </FieldGrid>
      <FieldGrid>
        <TextField id="fe-email" type="email" label="Correo para la factura electrónica" value={form.correo_facturacion} onChange={(v) => set("correo_facturacion", v)} />
        <TextField id="fe-subject" label="Asunto del correo" value={form.asunto_correo_fe} onChange={(v) => set("asunto_correo_fe", v)} />
      </FieldGrid>
      <AreaField id="fe-note" label="Nota en la factura electrónica" value={form.nota_fe} onChange={(v) => set("nota_fe", v)} />
      <TextField id="mail-address" label="Dirección de correspondencia" value={form.direccion_correspondencia} onChange={(v) => set("direccion_correspondencia", v)} />
    </ContractSection>
  );
}

export function CareSection({ form, set }: SectionProps) {
  return (
    <ContractSection id="atencion" title="Atención y órdenes" description="Cómo se usa el contrato al admitir, atender y ordenar.">
      <div className="grid gap-1">
        <ToggleRow id="auth" label="Requiere autorización del pagador" help="La admisión pedirá el número de autorización. Algunos servicios se marcan uno a uno en Tarifas." checked={form.requiere_autorizacion} onChange={(v) => set("requiere_autorizacion", v)} />
        <ToggleRow id="ctc" label="Solicita CTC para autorización" checked={form.solicita_ctc} onChange={(v) => set("solicita_ctc", v)} />
        <ToggleRow id="pyp" label="Captación de promoción y prevención" checked={form.captacion_pyp} onChange={(v) => set("captacion_pyp", v)} />
        <ToggleRow id="r4505" label="Reporta Resolución 4505" help="Actividades de protección específica y detección temprana." checked={form.reporta_4505} onChange={(v) => set("reporta_4505", v)} />
        <ToggleRow id="companion" label="Validar datos del acompañante en la admisión" checked={form.valida_acompanante} onChange={(v) => set("valida_acompanante", v)} />
        <ToggleRow id="prepaid" label="Es prepagado" checked={form.es_prepagado} onChange={(v) => set("es_prepagado", v)} />
        <ToggleRow id="non-care" label="Contrato no asistencial" help="Solo para facturar: no se ofrece en las admisiones." checked={form.contrato_no_asistencial} onChange={(v) => set("contrato_no_asistencial", v)} />
      </div>
      <FieldGrid>
        <NumberField id="per-patient" label="Monto máximo por paciente" prefix="$" value={form.monto_por_paciente} onChange={(v) => set("monto_por_paciente", v)} />
        <NumberField id="care-months" label="Plazo de asistencia del paciente" suffix="meses" value={form.plazo_asistencia_meses} onChange={(v) => set("plazo_asistencia_meses", v)} />
      </FieldGrid>
      <FieldGrid>
        <NumberField id="max-proc" label="Ítems máximos por orden de procedimientos" help="0 = sin límite." value={form.max_items_orden_procedimientos} onChange={(v) => set("max_items_orden_procedimientos", v)} />
        <NumberField id="max-med" label="Ítems máximos por orden de medicamentos" help="0 = sin límite." value={form.max_items_orden_medicamentos} onChange={(v) => set("max_items_orden_medicamentos", v)} />
      </FieldGrid>
    </ContractSection>
  );
}

export function AccountingSection({ form, set }: SectionProps) {
  return (
    <ContractSection id="contabilidad" title="Contabilidad" description="Cuentas del plan contable para causar, radicar, objetar y conciliar.">
      <FieldGrid>
        <TextField id="acc-main" label="Cuenta contable" value={form.cuenta_contable} onChange={(v) => set("cuenta_contable", v)} />
        <TextField id="acc-rad" label="Cuenta de radicación" value={form.cuenta_radicacion} onChange={(v) => set("cuenta_radicacion", v)} />
        <TextField id="acc-obj" label="Cuenta de objeción (glosas)" value={form.cuenta_objecion} onChange={(v) => set("cuenta_objecion", v)} />
        <TextField id="acc-con" label="Cuenta de conciliación" value={form.cuenta_conciliacion} onChange={(v) => set("cuenta_conciliacion", v)} />
      </FieldGrid>
    </ContractSection>
  );
}
