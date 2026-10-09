import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { COUNTRY_PROFILES } from "@/config/country/profiles";
import { AreaField, ContractSection, FieldGrid, NumberField, SelectField, TextField, ToggleRow } from "../fields";
import { MODALITY_LABEL, PAYER_TYPE_LABEL, type Modality, type PayerType } from "../contract-model";
import { emptyPayer, type NewPayer, type SectionProps } from "../contract-form";
import type { Payer } from "../contract-api";

const REGIMES = COUNTRY_PROFILES.CO.insuranceRegimes;
const ID_TYPES = [
  { value: "NIT", label: "NIT" },
  { value: "CC", label: "Cédula de ciudadanía" },
  { value: "CE", label: "Cédula de extranjería" },
  { value: "OTRO", label: "Otro" },
];

interface PayerSectionProps extends SectionProps {
  payers: Payer[];
  newPayer: NewPayer | null;
  setNewPayer: (p: NewPayer | null) => void;
  /** Un contrato ya activo no cambia de pagador. */
  locked: boolean;
}

export function PayerSection({ form, set, payers, newPayer, setNewPayer, locked }: PayerSectionProps) {
  const options = payers.map((p) => ({
    value: p.id,
    label: p.nombre,
    description: [PAYER_TYPE_LABEL[p.tipo_pagador], p.numero_identificacion && `${p.tipo_identificacion ?? ""} ${p.numero_identificacion}`.trim()].filter(Boolean).join(" · "),
  }));
  const patch = (p: Partial<NewPayer>) => newPayer && setNewPayer({ ...newPayer, ...p });

  return (
    <ContractSection id="pagador" title="Pagador" description="La entidad responsable de pago: EPS, aseguradora, ente territorial, empresa o particular.">
      {!newPayer ? (
        <div className="grid gap-2">
          <Label htmlFor="payer" className="text-[13px] font-medium">Pagador <span className="text-primary">*</span></Label>
          <SearchableSelect
            value={form.pagador_id ?? ""}
            onValueChange={(v) => set("pagador_id", v || null)}
            options={options}
            placeholder="Busca por nombre o NIT"
            searchPlaceholder="Nombre o NIT del pagador"
            emptyMessage="No hay un pagador con ese nombre."
            disabled={locked}
            triggerClassName="h-10"
          />
          {locked ? (
            <p className="text-xs text-muted-foreground">Un contrato activo no cambia de pagador.</p>
          ) : (
            <Button variant="link" className="h-auto justify-self-start p-0 text-[13px]" onClick={() => { set("pagador_id", null); setNewPayer(emptyPayer()); }}>
              ¿No está en la lista? Crear el pagador
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          <FieldGrid>
            <TextField id="payer-name" label="Nombre del pagador" required value={newPayer.nombre} onChange={(v) => patch({ nombre: v })} placeholder="Ej.: EPS Sura" />
            <SelectField
              id="payer-type" label="Tipo de pagador" required value={newPayer.tipo_pagador}
              onChange={(v) => patch({ tipo_pagador: v as PayerType })}
              options={Object.entries(PAYER_TYPE_LABEL).map(([value, label]) => ({ value, label }))}
            />
          </FieldGrid>
          <FieldGrid cols={3}>
            <SelectField id="payer-idtype" label="Tipo de identificación" value={newPayer.tipo_identificacion} onChange={(v) => patch({ tipo_identificacion: v })} options={ID_TYPES} />
            <TextField id="payer-id" label="Número" value={newPayer.numero_identificacion} onChange={(v) => patch({ numero_identificacion: v })} placeholder="Ej.: 800088702-2" />
            <TextField id="payer-code" label="Código de la entidad" help="El código de la EPS o administradora en RIPS." value={newPayer.codigo_entidad} onChange={(v) => patch({ codigo_entidad: v })} />
          </FieldGrid>
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-[13px] font-medium">Regímenes que cubre</legend>
            <div className="grid gap-1 sm:grid-cols-3">
              {REGIMES.map((r) => {
                const checked = newPayer.regimenes.includes(r.code);
                return (
                  <label key={r.code} htmlFor={`regime-${r.code}`} className="flex cursor-pointer items-center gap-2.5 rounded-tile px-2 py-1.5 text-[14px] hover:bg-muted/60">
                    <Checkbox
                      id={`regime-${r.code}`}
                      checked={checked}
                      onCheckedChange={(v) => patch({ regimenes: v ? [...newPayer.regimenes, r.code] : newPayer.regimenes.filter((x) => x !== r.code) })}
                    />
                    {r.label}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <FieldGrid cols={3}>
            <TextField id="payer-email" type="email" label="Correo" value={newPayer.correo} onChange={(v) => patch({ correo: v })} />
            <TextField id="payer-phone" label="Teléfono" value={newPayer.telefono} onChange={(v) => patch({ telefono: v })} />
            <TextField id="payer-address" label="Dirección" value={newPayer.direccion} onChange={(v) => patch({ direccion: v })} />
          </FieldGrid>
          <Button variant="link" className="h-auto justify-self-start p-0 text-[13px]" onClick={() => setNewPayer(null)}>
            Elegir un pagador existente
          </Button>
        </div>
      )}
    </ContractSection>
  );
}

export function GeneralSection({ form, set, sites }: SectionProps & { sites: { id: string; nombre: string }[] }) {
  return (
    <ContractSection id="general" title="Datos generales" description="Identificación, objeto, vigencia y valor del contrato (Decreto 441 de 2022, art. 2.5.3.4.2.2).">
      <TextField id="name" label="Nombre del convenio" required value={form.nombre_convenio} onChange={(v) => set("nombre_convenio", v)} placeholder="Ej.: Sura · Atención domiciliaria 2026" />
      <FieldGrid cols={3}>
        <TextField id="code" label="Código interno" value={form.codigo} onChange={(v) => set("codigo", v)} />
        <TextField id="number" label="Número de contrato" required value={form.numero_contrato} onChange={(v) => set("numero_contrato", v)} />
        <TextField id="cucon" label="Código único de contrato (CUCON)" value={form.cucon} onChange={(v) => set("cucon", v)} />
      </FieldGrid>
      <AreaField id="object" label="Objeto del contrato" required value={form.objeto} onChange={(v) => set("objeto", v)} placeholder="Qué servicios presta la IPS a la población del pagador" />
      <FieldGrid cols={3}>
        <SelectField
          id="modality" label="Modalidad de pago" required value={form.tipo_contratacion}
          onChange={(v) => set("tipo_contratacion", v as Modality)}
          options={Object.entries(MODALITY_LABEL).map(([value, label]) => ({ value, label }))}
        />
        <SelectField
          id="regime" label="Régimen" value={form.regimen || null} onChange={(v) => set("regimen", v)}
          options={REGIMES.map((r) => ({ value: r.code, label: r.label }))}
        />
        {sites.length > 0 ? (
          <SelectField id="site" label="Sede donde se presta" value={form.sede_id} onChange={(v) => set("sede_id", v)} options={sites.map((s) => ({ value: s.id, label: s.nombre }))} />
        ) : (
          <div className="grid gap-1.5">
            <span className="text-[13px] font-medium">Sede donde se presta</span>
            <p className="text-xs text-muted-foreground">Aún no hay sedes registradas. Créalas en Configuración › Sedes y bodegas.</p>
          </div>
        )}
      </FieldGrid>
      <FieldGrid cols={3}>
        <TextField id="signed" type="date" label="Fecha de firma" value={form.fecha_firma} onChange={(v) => set("fecha_firma", v)} />
        <TextField id="start" type="date" label="Inicio de la vigencia" required value={form.fecha_inicio} onChange={(v) => set("fecha_inicio", v)} />
        <TextField id="end" type="date" label="Fin de la vigencia" required value={form.fecha_fin} onChange={(v) => set("fecha_fin", v)} />
      </FieldGrid>
      <FieldGrid>
        <NumberField id="value" label="Valor del contrato" help="Techo o valor total pactado, si aplica." prefix="$" value={form.valor_contrato} onChange={(v) => set("valor_contrato", v)} />
      </FieldGrid>
      <ToggleRow
        id="renewal" label="Renovación automática"
        help="La norma la permite, pero los valores se actualizan en cada vigencia y, en prospectivas, la nota técnica antes de la prórroga."
        checked={form.renovacion_automatica} onChange={(v) => set("renovacion_automatica", v)}
      />
      {form.renovacion_automatica && (
        <TextField id="formula" label="Fórmula de actualización de valores" value={form.formula_actualizacion} onChange={(v) => set("formula_actualizacion", v)} placeholder="Ej.: incremento según la variación de la UVB" />
      )}
      <AreaField id="notes" label="Detalle u observaciones" value={form.notas} onChange={(v) => set("notas", v)} />
    </ContractSection>
  );
}
