import { parseAmount, type Modality, type PayerType, type StoredStatus } from "./contract-model";

/** Fila de `contratos` tal como llega de la base. */
export interface ContractRow {
  id: string;
  pagador_id: string;
  nombre_convenio: string;
  tipo_contratacion: Modality;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: StoredStatus;
  notas: string | null;
  tarifario_id: string | null;
  codigo: string | null;
  numero_contrato: string | null;
  cucon: string | null;
  objeto: string | null;
  sede_id: string | null;
  regimen: string | null;
  fecha_firma: string | null;
  renovacion_automatica: boolean;
  formula_actualizacion: string | null;
  valor_contrato: number | null;
  ajuste_procedimientos_pct: number;
  tarifario_medicamentos_id: string | null;
  ajuste_medicamentos_pct: number;
  pgp_valor_periodo: number | null;
  pgp_periodicidad: string | null;
  pgp_poblacion: number | null;
  numero_usuarios: number | null;
  valor_por_usuario: number | null;
  copago_pactado: number | null;
  correo_facturacion: string | null;
  asunto_correo_fe: string | null;
  nota_fe: string | null;
  direccion_correspondencia: string | null;
  dias_vencimiento_factura: number | null;
  plazo_radicacion_dias: number | null;
  plazo_pago_dias: number | null;
  requiere_autorizacion: boolean;
  solicita_ctc: boolean;
  monto_por_paciente: number | null;
  plazo_asistencia_meses: number | null;
  es_prepagado: boolean;
  contrato_no_asistencial: boolean;
  captacion_pyp: boolean;
  reporta_4505: boolean;
  valida_acompanante: boolean;
  max_items_orden_procedimientos: number;
  max_items_orden_medicamentos: number;
  cuenta_contable: string | null;
  cuenta_radicacion: string | null;
  cuenta_objecion: string | null;
  cuenta_conciliacion: string | null;
  version: number;
  created_at: string;
}

export interface ExceptionRow {
  id?: string;
  sistema: "CUPS" | "CUM" | "INTERNO";
  codigo: string;
  descripcion: string;
  tipo_valor: "valor" | "porcentaje";
  valor: string;
  requiere_autorizacion: boolean;
}

export interface PackageRow {
  id?: string;
  codigo: string;
  nombre: string;
  valor: string;
  codigos_incluidos: string;
  incluye: string;
  excluye: string;
}

export interface NewPayer {
  nombre: string;
  tipo_pagador: PayerType;
  tipo_identificacion: string;
  numero_identificacion: string;
  codigo_entidad: string;
  regimenes: string[];
  correo: string;
  telefono: string;
  direccion: string;
}

export const emptyPayer = (): NewPayer => ({
  nombre: "", tipo_pagador: "eps", tipo_identificacion: "NIT", numero_identificacion: "", codigo_entidad: "",
  regimenes: [], correo: "", telefono: "", direccion: "",
});

/** Campos de texto y número del contrato: en el formulario todo es texto y se convierte al guardar. */
const TEXT_FIELDS = [
  "nombre_convenio", "codigo", "numero_contrato", "cucon", "objeto", "regimen", "fecha_inicio", "fecha_fin", "fecha_firma",
  "formula_actualizacion", "notas", "pgp_periodicidad", "correo_facturacion", "asunto_correo_fe", "nota_fe",
  "direccion_correspondencia", "cuenta_contable", "cuenta_radicacion", "cuenta_objecion", "cuenta_conciliacion",
] as const;
const NUMBER_FIELDS = [
  "valor_contrato", "ajuste_procedimientos_pct", "ajuste_medicamentos_pct", "pgp_valor_periodo", "pgp_poblacion",
  "numero_usuarios", "valor_por_usuario", "copago_pactado", "dias_vencimiento_factura", "plazo_radicacion_dias",
  "plazo_pago_dias", "monto_por_paciente", "plazo_asistencia_meses", "max_items_orden_procedimientos", "max_items_orden_medicamentos",
] as const;
const BOOL_FIELDS = [
  "renovacion_automatica", "requiere_autorizacion", "solicita_ctc", "es_prepagado", "contrato_no_asistencial",
  "captacion_pyp", "reporta_4505", "valida_acompanante",
] as const;
const ID_FIELDS = ["pagador_id", "tarifario_id", "tarifario_medicamentos_id", "sede_id"] as const;

type TextField = (typeof TEXT_FIELDS)[number];
type NumberField = (typeof NUMBER_FIELDS)[number];
type BoolField = (typeof BOOL_FIELDS)[number];
type IdField = (typeof ID_FIELDS)[number];

export type ContractForm = Record<TextField | NumberField, string> & Record<BoolField, boolean> & Record<IdField, string | null> & {
  tipo_contratacion: Modality;
  excepciones: ExceptionRow[];
  paquetes: PackageRow[];
};

const today = () => new Date().toISOString().slice(0, 10);

export function emptyContractForm(): ContractForm {
  const form = {
    tipo_contratacion: "evento" as Modality,
    excepciones: [],
    paquetes: [],
  } as unknown as ContractForm;
  for (const f of TEXT_FIELDS) form[f] = "";
  for (const f of NUMBER_FIELDS) form[f] = "";
  for (const f of BOOL_FIELDS) form[f] = false;
  for (const f of ID_FIELDS) form[f] = null;
  form.fecha_inicio = today();
  form.ajuste_procedimientos_pct = "0";
  form.ajuste_medicamentos_pct = "0";
  form.max_items_orden_procedimientos = "0";
  form.max_items_orden_medicamentos = "0";
  return form;
}

export function toForm(row: ContractRow, excepciones: ExceptionRow[], paquetes: PackageRow[]): ContractForm {
  const form = emptyContractForm();
  for (const f of TEXT_FIELDS) form[f] = (row[f] as string | null) ?? "";
  // La base devuelve numeric como texto con decimales («85000.00»): se muestra limpio («85000»).
  for (const f of NUMBER_FIELDS) form[f] = row[f] === null || row[f] === undefined ? "" : String(Number(row[f]));
  for (const f of BOOL_FIELDS) form[f] = !!row[f];
  for (const f of ID_FIELDS) form[f] = row[f] ?? null;
  form.tipo_contratacion = row.tipo_contratacion;
  form.excepciones = excepciones;
  form.paquetes = paquetes;
  return form;
}

const toNumber = (v: string) => parseAmount(v);

/** Columnas de `contratos` a partir del formulario (sin excepciones ni paquetes). */
export function toRow(form: ContractForm): Record<string, unknown> {
  const row: Record<string, unknown> = { tipo_contratacion: form.tipo_contratacion };
  for (const f of TEXT_FIELDS) row[f] = form[f].trim() === "" ? null : form[f].trim();
  for (const f of NUMBER_FIELDS) row[f] = toNumber(form[f]);
  for (const f of BOOL_FIELDS) row[f] = form[f];
  for (const f of ID_FIELDS) row[f] = form[f] || null;
  // Columnas con valor por defecto en la base: nunca nulas.
  row.ajuste_procedimientos_pct = row.ajuste_procedimientos_pct ?? 0;
  row.ajuste_medicamentos_pct = row.ajuste_medicamentos_pct ?? 0;
  row.max_items_orden_procedimientos = row.max_items_orden_procedimientos ?? 0;
  row.max_items_orden_medicamentos = row.max_items_orden_medicamentos ?? 0;
  row.nombre_convenio = form.nombre_convenio.trim();
  return row;
}

/** ¿Hay un número no válido (no numérico o negativo donde no se admite)? Devuelve el campo o null. */
export function invalidNumber(form: ContractForm): NumberField | null {
  for (const f of NUMBER_FIELDS) {
    const n = toNumber(form[f]);
    if (n === null) continue;
    if (Number.isNaN(n)) return f;
    const signed = f === "ajuste_procedimientos_pct" || f === "ajuste_medicamentos_pct";
    if (!signed && n < 0) return f;
  }
  return null;
}

/** Problemas en excepciones y paquetes antes de enviar (filas a medias, valores no numéricos, repetidos). */
export function childIssues(form: ContractForm): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  form.excepciones.forEach((e, i) => {
    const label = e.codigo.trim() || `fila ${i + 1}`;
    if (!e.codigo.trim()) issues.push(`Excepción ${i + 1}: falta el código`);
    const n = parseAmount(e.valor);
    if (n === null) issues.push(`Excepción ${label}: falta el valor`);
    else if (Number.isNaN(n)) issues.push(`Excepción ${label}: el valor no es un número`);
    else if (e.tipo_valor === "valor" && n < 0) issues.push(`Excepción ${label}: un valor fijo no puede ser negativo`);
    const key = `${e.sistema}:${e.codigo.trim()}`;
    if (e.codigo.trim() && seen.has(key)) issues.push(`Excepción ${label}: el código está repetido`);
    seen.add(key);
  });
  const codes = new Set<string>();
  form.paquetes.forEach((p, i) => {
    const label = p.codigo.trim() || `fila ${i + 1}`;
    if (!p.codigo.trim() || !p.nombre.trim()) issues.push(`Paquete ${label}: falta el código o el nombre`);
    const n = parseAmount(p.valor);
    if (n === null || Number.isNaN(n) || n < 0) issues.push(`Paquete ${label}: el valor no es válido`);
    if (p.codigo.trim() && codes.has(p.codigo.trim())) issues.push(`Paquete ${label}: el código está repetido`);
    codes.add(p.codigo.trim());
  });
  return issues;
}

/** Cuerpo de POST /api/contratos: columnas del contrato con números ya convertidos, más tarifas por código y paquetes. */
export function toPayload(form: ContractForm) {
  return {
    contrato: toRow(form),
    excepciones: form.excepciones.map((e) => ({
      id: e.id ?? null, sistema: e.sistema, codigo: e.codigo.trim(), descripcion: e.descripcion.trim() || null,
      tipo_valor: e.tipo_valor, valor: parseAmount(e.valor), requiere_autorizacion: e.requiere_autorizacion,
    })),
    paquetes: form.paquetes.map((p) => ({
      id: p.id ?? null, codigo: p.codigo.trim(), nombre: p.nombre.trim(), valor: parseAmount(p.valor),
      codigos_incluidos: p.codigos_incluidos.split(",").map((c) => c.trim()).filter(Boolean),
      incluye: p.incluye.trim() || null, excluye: p.excluye.trim() || null,
    })),
  };
}

export const NUMBER_FIELD_LABEL: Record<NumberField, string> = {
  valor_contrato: "Valor del contrato",
  ajuste_procedimientos_pct: "Ajuste de procedimientos",
  ajuste_medicamentos_pct: "Ajuste de medicamentos e insumos",
  pgp_valor_periodo: "Valor del PGP por periodo",
  pgp_poblacion: "Población del PGP",
  numero_usuarios: "Número de usuarios",
  valor_por_usuario: "Valor por usuario",
  copago_pactado: "Copago pactado",
  dias_vencimiento_factura: "Días de vencimiento de la factura",
  plazo_radicacion_dias: "Plazo de radicación",
  plazo_pago_dias: "Plazo de pago",
  monto_por_paciente: "Monto por paciente",
  plazo_asistencia_meses: "Plazo de asistencia del paciente",
  max_items_orden_procedimientos: "Ítems máximos en órdenes de procedimientos",
  max_items_orden_medicamentos: "Ítems máximos en órdenes de medicamentos",
};

/** Lo que recibe cada sección del editor: el formulario y cómo cambiar un campo. */
export interface SectionProps {
  form: ContractForm;
  set: <K extends keyof ContractForm>(key: K, value: ContractForm[K]) => void;
}
