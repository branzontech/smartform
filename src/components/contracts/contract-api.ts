import { db } from "@/integrations/data/client";
import type { PayerType } from "./contract-model";
import { apiFetch } from "@/integrations/api/client";
import { toForm, toPayload, type ContractForm, type ContractRow, type ExceptionRow, type NewPayer, type PackageRow } from "./contract-form";

export interface Payer {
  id: string;
  nombre: string;
  tipo_pagador: PayerType;
  tipo_identificacion: string | null;
  numero_identificacion: string | null;
  regimenes: string[];
  es_particular: boolean;
}

export interface TariffManual {
  id: string;
  nombre: string;
  unidad: string;
  tipo: string;
}

export interface Otrosi {
  id: string;
  numero: string;
  fecha: string;
  descripcion: string;
  version_resultante: number | null;
  creado_en: string;
}

const fail = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

export async function fetchPayers(): Promise<Payer[]> {
  const { data, error } = await db
    .from("pagadores")
    .select("id, nombre, tipo_pagador, tipo_identificacion, numero_identificacion, regimenes, es_particular")
    .eq("activo", true)
    .order("nombre");
  fail(error);
  return (data ?? []) as unknown as Payer[];
}

export async function fetchTariffManuals(): Promise<TariffManual[]> {
  const { data, error } = await db.from("tarifarios_maestros").select("id, nombre, unidad, tipo").eq("estado", true).order("nombre");
  fail(error);
  return (data ?? []) as unknown as TariffManual[];
}

export async function fetchSites(): Promise<{ id: string; nombre: string }[]> {
  const { data, error } = await db.from("sedes").select("id, nombre").eq("activo", true).order("nombre");
  fail(error);
  return (data ?? []) as { id: string; nombre: string }[];
}

/** Valor de la UVB del año, si el administrador ya lo registró. */
export async function fetchUvb(year: number): Promise<number | null> {
  const { data, error } = await db.from("valores_referencia").select("valor").eq("codigo", "UVB").eq("anio", year).maybeSingle();
  fail(error);
  return (data as { valor: number } | null)?.valor ?? null;
}

export async function saveUvb(year: number, value: number, source: string) {
  const { error } = await db.from("valores_referencia").upsert({ codigo: "UVB", anio: year, valor: value, fuente: source || null }, { onConflict: "codigo,anio" });
  fail(error);
}

export interface LoadedContract {
  row: ContractRow;
  form: ContractForm;
  otrosies: Otrosi[];
}

export async function fetchContract(id: string): Promise<LoadedContract> {
  const [contract, exceptions, packages, otrosies] = await Promise.all([
    db.from("contratos").select("*").eq("id", id).single(),
    db.from("contrato_excepciones").select("*").eq("contrato_id", id).order("codigo"),
    db.from("contrato_paquetes").select("*").eq("contrato_id", id).order("codigo"),
    db.from("contrato_otrosies").select("id, numero, fecha, descripcion, version_resultante, creado_en").eq("contrato_id", id).order("creado_en", { ascending: false }),
  ]);
  fail(contract.error);
  fail(exceptions.error);
  fail(packages.error);
  fail(otrosies.error);
  const row = contract.data as unknown as ContractRow;
  const excepciones: ExceptionRow[] = ((exceptions.data ?? []) as Record<string, unknown>[]).map((e) => ({
    id: e.id as string,
    sistema: e.sistema as ExceptionRow["sistema"],
    codigo: e.codigo as string,
    descripcion: (e.descripcion as string) ?? "",
    tipo_valor: e.tipo_valor as ExceptionRow["tipo_valor"],
    valor: String(Number(e.valor)),
    requiere_autorizacion: !!e.requiere_autorizacion,
  }));
  const paquetes: PackageRow[] = ((packages.data ?? []) as Record<string, unknown>[]).map((p) => ({
    id: p.id as string,
    codigo: p.codigo as string,
    nombre: p.nombre as string,
    valor: String(Number(p.valor)),
    codigos_incluidos: ((p.codigos_incluidos as string[]) ?? []).join(", "),
    incluye: (p.incluye as string) ?? "",
    excluye: (p.excluye as string) ?? "",
  }));
  return { row, form: toForm(row, excepciones, paquetes), otrosies: (otrosies.data ?? []) as unknown as Otrosi[] };
}

export interface SaveInput {
  id: string | null;
  /** Versión que se tenía abierta: si otro usuario guardó antes, el servidor responde 409. */
  expectedVersion: number | null;
  form: ContractForm;
  /** Estado a guardar (borrador o activo; en un contrato en curso el servidor conserva el suyo). */
  estado: string;
  newPayer: NewPayer | null;
  /** Obligatorio al cambiar un contrato que ya no es borrador. */
  otrosi: { numero: string; fecha: string; descripcion: string } | null;
}

/**
 * Guarda pagador nuevo, contrato, excepciones, paquetes y otrosí en una sola transacción
 * del servidor (POST /api/contratos). Si algo falla no queda nada a medias.
 */
export async function saveContract({ id, expectedVersion, form, estado, newPayer, otrosi }: SaveInput): Promise<{ id: string; version: number }> {
  return apiFetch<{ id: string; version: number }>("/api/contratos", {
    method: "POST",
    body: JSON.stringify({ id, expectedVersion, estado, pagadorNuevo: newPayer, otrosi, ...toPayload(form) }),
  });
}

/** Bloquear, reactivar, terminar o liquidar (POST /api/contratos/:id/estado). */
export async function setContractStatus(id: string, estado: string) {
  await apiFetch(`/api/contratos/${id}/estado`, { method: "POST", body: JSON.stringify({ estado }) });
}
