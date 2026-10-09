import { useState } from "react";
import { Link } from "react-router-dom";
import { MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContractSection, FieldGrid, NumberField, SelectField, TextField } from "../fields";
import { contractPrice } from "../contract-model";
import type { ExceptionRow, PackageRow, SectionProps } from "../contract-form";
import type { TariffManual } from "../contract-api";

const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const UNIT_LABEL: Record<string, string> = { UVB: "en UVB", COP: "en pesos" };
const TYPE_LABEL: Record<string, string> = { referencia: "Manual de referencia", propio: "Propio", mercado: "Del mercado", particular: "Particular" };

interface TariffSectionProps extends SectionProps {
  manuals: TariffManual[];
  year: number;
  uvb: number | null;
  canEditUvb: boolean;
  onSaveUvb: (value: number, source: string) => Promise<void>;
}

const manualOptions = (manuals: TariffManual[]) =>
  manuals.map((m) => ({ value: m.id, label: `${m.nombre} · ${TYPE_LABEL[m.tipo] ?? m.tipo} ${UNIT_LABEL[m.unidad] ?? m.unidad}` }));

/** Ejemplo de la tarifa que queda con el ajuste pactado, para que el porcentaje no se lea a ciegas. */
function PriceExample({ manual, pct, uvb, year }: { manual?: TariffManual; pct: string; uvb: number | null; year: number }) {
  if (!manual) return null;
  const n = Number(pct.replace(",", ".")) || 0;
  if (manual.unidad === "UVB") {
    if (!uvb) return <p className="text-xs text-amber-700 dark:text-amber-400">Falta registrar la UVB de {year} para convertir el manual a pesos.</p>;
    const price = contractPrice({ base: 10, unit: "UVB", uvb, pct: n });
    return <p className="text-xs text-muted-foreground">Ejemplo: un servicio de 10 UVB queda en {money.format(price ?? 0)} (UVB {year}: {money.format(uvb)}, redondeado a la centena).</p>;
  }
  return <p className="text-xs text-muted-foreground">Ejemplo: un servicio de {money.format(100_000)} en el manual queda en {money.format(contractPrice({ base: 100_000, unit: "COP", pct: n }) ?? 0)}.</p>;
}

function UvbForm({ year, onSave }: { year: number; onSave: (value: number, source: string) => Promise<void> }) {
  const [value, setValue] = useState("");
  const [source, setSource] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <div className="grid gap-3 rounded-tile bg-amber-500/10 p-4">
      <p className="text-[13px]">
        <span className="font-semibold">Registra la UVB de {year}.</span> Tómala de la publicación oficial del Ministerio de Hacienda; Ker Hub no la calcula.
      </p>
      <FieldGrid>
        <NumberField id="uvb-value" label={`Valor de la UVB ${year}`} prefix="$" value={value} onChange={setValue} />
        <TextField id="uvb-source" label="Fuente" value={source} onChange={setSource} placeholder="Ej.: Resolución del MinHacienda" />
      </FieldGrid>
      <Button
        size="sm" className="justify-self-start" disabled={!(Number(value.replace(",", ".")) > 0) || saving}
        onClick={async () => { setSaving(true); try { await onSave(Number(value.replace(",", ".")), source); } finally { setSaving(false); } }}
      >
        Guardar UVB {year}
      </Button>
    </div>
  );
}

function RowMenu({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Más acciones: ${label}`} className="h-9 w-9 text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl">
        <DropdownMenuItem onClick={onRemove} className="text-[13px] text-destructive focus:text-destructive">Quitar del contrato</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const newException = (): ExceptionRow => ({ sistema: "CUPS", codigo: "", descripcion: "", tipo_valor: "valor", valor: "", requiere_autorizacion: false });
const newPackage = (): PackageRow => ({ codigo: "", nombre: "", valor: "", codigos_incluidos: "", incluye: "", excluye: "" });

export function TariffSection({ form, set, manuals, year, uvb, canEditUvb, onSaveUvb }: TariffSectionProps) {
  const procManual = manuals.find((m) => m.id === form.tarifario_id);
  const medManual = manuals.find((m) => m.id === form.tarifario_medicamentos_id);
  const needsUvb = (procManual?.unidad === "UVB" || medManual?.unidad === "UVB") && !uvb;
  const setException = (i: number, p: Partial<ExceptionRow>) => set("excepciones", form.excepciones.map((e, j) => (j === i ? { ...e, ...p } : e)));
  const setPackage = (i: number, p: Partial<PackageRow>) => set("paquetes", form.paquetes.map((x, j) => (j === i ? { ...x, ...p } : x)));

  return (
    <ContractSection id="tarifas" title="Tarifas" description="Manual base más o menos un porcentaje, con excepciones por código. Para particulares o tarifas del mercado, elige el manual correspondiente.">
      {manuals.length === 0 && (
        <p className="rounded-tile bg-muted/60 px-4 py-3 text-[13px]">
          Aún no hay tarifarios. Crea el manual base (SOAT en UVB, ISS, propio, del mercado o particular) en{" "}
          <Link to="/app/facturacion/tarifarios" className="font-medium text-primary underline-offset-2 hover:underline">Facturación › Tarifarios</Link>.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
        <SelectField id="proc-manual" label="Manual de procedimientos" value={form.tarifario_id} onChange={(v) => set("tarifario_id", v)} options={manualOptions(manuals)} placeholder="Elige el manual base" />
        <NumberField id="proc-pct" label="Ajuste" suffix="%" allowNegative value={form.ajuste_procedimientos_pct} onChange={(v) => set("ajuste_procedimientos_pct", v)} help="−10 = 10 % menos" />
      </div>
      <PriceExample manual={procManual} pct={form.ajuste_procedimientos_pct} uvb={uvb} year={year} />
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
        <SelectField id="med-manual" label="Manual de medicamentos e insumos" value={form.tarifario_medicamentos_id} onChange={(v) => set("tarifario_medicamentos_id", v)} options={manualOptions(manuals)} placeholder="Opcional" />
        <NumberField id="med-pct" label="Ajuste" suffix="%" allowNegative value={form.ajuste_medicamentos_pct} onChange={(v) => set("ajuste_medicamentos_pct", v)} />
      </div>
      <PriceExample manual={medManual} pct={form.ajuste_medicamentos_pct} uvb={uvb} year={year} />
      {needsUvb && canEditUvb && <UvbForm year={year} onSave={onSaveUvb} />}

      <div className="grid gap-3 border-t border-border pt-5">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-semibold">Excepciones por código</h3>
            <p className="text-xs text-muted-foreground">Servicios con un precio distinto al del manual, o que requieren autorización del pagador.</p>
          </div>
          <Button variant="outline" size="sm" className="h-8 shrink-0 gap-1.5 text-[13px]" onClick={() => set("excepciones", [...form.excepciones, newException()])}>
            <Plus className="h-4 w-4" />Agregar
          </Button>
        </div>
        {form.excepciones.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">Sin excepciones: todo se cobra con el manual y el ajuste de arriba.</p>
        ) : (
          <div className="grid gap-2">
            {form.excepciones.map((e, i) => (
              <div key={e.id ?? `new-${i}`} className="grid items-center gap-2 rounded-tile bg-[hsl(var(--field))] p-2 sm:grid-cols-[96px_120px_minmax(0,1fr)_132px_120px_auto_auto]">
                <Select value={e.sistema} onValueChange={(v) => setException(i, { sistema: v as ExceptionRow["sistema"] })}>
                  <SelectTrigger aria-label="Sistema de codificación" className="h-9 bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>{["CUPS", "CUM", "INTERNO"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
                <Input aria-label="Código" placeholder="Código" value={e.codigo} onChange={(ev) => setException(i, { codigo: ev.target.value })} className="h-9 bg-card font-mono text-[13px]" />
                <Input aria-label="Descripción" placeholder="Descripción" value={e.descripcion} onChange={(ev) => setException(i, { descripcion: ev.target.value })} className="h-9 bg-card" />
                <Select value={e.tipo_valor} onValueChange={(v) => setException(i, { tipo_valor: v as ExceptionRow["tipo_valor"] })}>
                  <SelectTrigger aria-label="Tipo de valor" className="h-9 bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="valor">Valor fijo</SelectItem>
                    <SelectItem value="porcentaje">% sobre el manual</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  aria-label={e.tipo_valor === "valor" ? "Valor en pesos" : "Porcentaje"} inputMode="decimal"
                  placeholder={e.tipo_valor === "valor" ? "$" : "%"} value={e.valor}
                  onChange={(ev) => setException(i, { valor: ev.target.value.replace(e.tipo_valor === "valor" ? /[^\d.,]/g : /[^\d.,-]/g, "") })}
                  className="h-9 bg-card tabular-nums"
                />
                <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap px-1 text-[13px]">
                  <Checkbox checked={e.requiere_autorizacion} onCheckedChange={(v) => setException(i, { requiere_autorizacion: !!v })} />
                  Autorización
                </label>
                <RowMenu label={e.codigo || "excepción"} onRemove={() => set("excepciones", form.excepciones.filter((_, j) => j !== i))} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-3 border-t border-border pt-5">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-semibold">Paquetes</h3>
            <p className="text-xs text-muted-foreground">Valor fijo por un conjunto integral de atenciones, con lo que incluye y lo que no.</p>
          </div>
          <Button variant="outline" size="sm" className="h-8 shrink-0 gap-1.5 text-[13px]" onClick={() => set("paquetes", [...form.paquetes, newPackage()])}>
            <Plus className="h-4 w-4" />Agregar
          </Button>
        </div>
        {form.paquetes.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">{form.tipo_contratacion === "paquete" ? "Un contrato por paquete necesita al menos un paquete con su valor." : "Sin paquetes."}</p>
        ) : (
          <div className="grid gap-3">
            {form.paquetes.map((p, i) => (
              <div key={p.id ?? `new-${i}`} className="grid gap-3 rounded-tile bg-[hsl(var(--field))] p-3">
                <div className="grid items-end gap-3 sm:grid-cols-[120px_minmax(0,1fr)_160px_auto]">
                  <TextField id={`pkg-code-${i}`} label="Código" value={p.codigo} onChange={(v) => setPackage(i, { codigo: v })} />
                  <TextField id={`pkg-name-${i}`} label="Nombre" value={p.nombre} onChange={(v) => setPackage(i, { nombre: v })} placeholder="Ej.: Atención domiciliaria postquirúrgica" />
                  <NumberField id={`pkg-value-${i}`} label="Valor" prefix="$" value={p.valor} onChange={(v) => setPackage(i, { valor: v })} />
                  <RowMenu label={p.nombre || "paquete"} onRemove={() => set("paquetes", form.paquetes.filter((_, j) => j !== i))} />
                </div>
                <TextField id={`pkg-codes-${i}`} label="Códigos incluidos" help="CUPS o CUM separados por coma." value={p.codigos_incluidos} onChange={(v) => setPackage(i, { codigos_incluidos: v })} />
                <FieldGrid>
                  <TextField id={`pkg-in-${i}`} label="Incluye" value={p.incluye} onChange={(v) => setPackage(i, { incluye: v })} />
                  <TextField id={`pkg-out-${i}`} label="Excluye" value={p.excluye} onChange={(v) => setPackage(i, { excluye: v })} />
                </FieldGrid>
              </div>
            ))}
          </div>
        )}
      </div>
    </ContractSection>
  );
}
