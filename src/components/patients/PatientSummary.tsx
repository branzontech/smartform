import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, ChevronDown, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/integrations/data/client";
import type { DynamicFieldConfig } from "@/components/config/DynamicFieldConfigurator";
import { PatientEditForm, type EditablePatientRow } from "./PatientEditForm";
import { SurfaceCard } from "@/components/kit/surface";
import { useCountry } from "@/config/country";
import { cn } from "@/lib/utils";

export const PATIENT_CUSTOM_FIELDS_KEY = ["config", "patient-custom-fields"] as const;

/** Configuración de public.configuracion_campos_paciente, en orden. */
async function fetchPatientCustomFields(): Promise<DynamicFieldConfig[]> {
  const { data, error } = await db
    .from("configuracion_campos_paciente")
    .select("*")
    .order("orden", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as DynamicFieldConfig[];
}

/** Columnas de public.admisiones que usa el contexto clínico. */
export interface AdmissionSummaryRow {
  id: string;
  estado?: string | null;
  fecha_inicio?: string | null;
  motivo?: string | null;
  diagnostico_principal?: string | null;
}

interface PatientSummaryProps {
  patient: EditablePatientRow;
  admissions: AdmissionSummaryRow[];
  /** Volver a buscar otro paciente. */
  onChange: () => void;
  /** Los datos se editaron aquí mismo. */
  onUpdated: (patient: EditablePatientRow) => void;
}

const ageOf = (birth?: string | null) => {
  if (!birth) return null;
  const b = new Date(birth);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - b.getFullYear();
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) years--;
  return years;
};

const join = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(", ");

function Field({ label, value, mono }: { label: string; value?: ReactNode; mono?: boolean }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="min-w-0">
      <dt className="text-[12px] text-muted-foreground">{label}</dt>
      <dd className={cn("mt-0.5 truncate text-sm text-foreground", mono && "font-mono text-[13px]")}>{value}</dd>
    </div>
  );
}

interface FieldItem {
  label: string;
  value?: ReactNode;
  mono?: boolean;
}

const hasValue = (f: FieldItem) => f.value !== null && f.value !== undefined && f.value !== "";

/** Grupo de datos con título; si ninguno tiene valor, no se muestra. */
function Section({ title, fields }: { title: string; fields: FieldItem[] }) {
  const filled = fields.filter(hasValue);
  if (!filled.length) return null;
  return (
    <section className="min-w-0 space-y-3">
      <h4 className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground/80">{title}</h4>
      <dl className="space-y-3">
        {filled.map((f) => <Field key={f.label} {...f} />)}
      </dl>
    </section>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
      {initials}
    </span>
  );
}

/**
 * Ficha del paciente ya elegido (perfil con contexto clínico, elegido por el
 * usuario): a la izquierda quién es; a la derecha lo que el profesional debe
 * saber antes de atender. El resto de datos, por secciones, a un clic. Nunca
 * muestra campos vacíos.
 */
export function PatientSummary({ patient: p, admissions, onChange, onUpdated }: PatientSummaryProps) {
  const { format } = useCountry();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const { data: customFields = [] } = useQuery({
    queryKey: PATIENT_CUSTOM_FIELDS_KEY,
    queryFn: fetchPatientCustomFields,
    staleTime: 5 * 60_000,
  });
  const customValues = (p.fhir_extensions?.custom_fields ?? {}) as Record<string, unknown>;
  const customValue = (f: DynamicFieldConfig) => {
    const v = customValues[f.id];
    if (v === null || v === undefined || v === "") return null;
    if (f.tipo_dato === "boolean") return v === true || v === "true" ? "Sí" : "No";
    if (f.tipo_dato === "number" || f.tipo_dato === "decimal") return format.number(Number(v), String(v));
    if (f.tipo_dato === "date") return format.date(String(v));
    return String(v);
  };
  const filledCustomFields = customFields.filter((f) => customValue(f) !== null);

  const name = `${p.nombres ?? ""} ${p.apellidos ?? ""}`.trim();
  const initials = `${p.nombres?.charAt(0) ?? ""}${p.apellidos?.charAt(0) ?? ""}`.toUpperCase();
  const age = ageOf(p.fecha_nacimiento);
  const document = p.numero_documento ? `${p.tipo_documento ?? ""} ${p.numero_documento}`.trim() : null;
  const birth = p.fecha_nacimiento ? format.date(p.fecha_nacimiento) : null;
  const vitals = [p.genero, age !== null ? `${age} años` : null].filter(Boolean).join(" · ");
  const actions = (
    <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
      <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5 rounded-full">
        <Pencil className="h-3.5 w-3.5" />
        Editar
      </Button>
      <Button variant="ghost" size="sm" onClick={onChange} className="gap-1.5 rounded-full">
        <ArrowLeftRight className="h-3.5 w-3.5" />
        Cambiar paciente
      </Button>
    </div>
  );
  const identity = (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar initials={initials} />
      <div className="min-w-0">
        <h3 className="truncate text-lg font-semibold leading-tight text-foreground">{name}</h3>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{editing ? "Editando datos del paciente" : vitals}</p>
      </div>
    </div>
  );

  const sections = (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <Section
        title="Identificación"
        fields={[
          { label: "Documento", value: document, mono: true },
          { label: "Historia clínica", value: p.numero_historia, mono: true },
          { label: "Fecha de nacimiento", value: birth },
          { label: "Ocupación", value: p.ocupacion },
        ]}
      />
      <Section
        title="Contacto"
        fields={[
          { label: "Teléfono", value: p.telefono_principal },
          { label: "Teléfono secundario", value: p.telefono_secundario },
          { label: "Correo", value: p.email },
        ]}
      />
      <Section
        title="Afiliación y ubicación"
        fields={[
          { label: "Régimen", value: format.insuranceRegimeLabel(p.regimen) },
          { label: "Tipo de afiliación", value: p.tipo_afiliacion },
          { label: "Carné", value: p.carnet, mono: true },
          { label: "Dirección", value: p.direccion },
          { label: "Ciudad", value: join(p.ciudad, p.estado) },
          { label: "Zona", value: p.zona },
        ]}
      />
      {filledCustomFields.length > 0 && (
        <section className="min-w-0 space-y-3 sm:col-span-2 lg:col-span-3">
          <h4 className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground/80">Datos adicionales</h4>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {filledCustomFields.map((f) => (
              <Field key={f.id} label={f.label} value={customValue(f)} />
            ))}
          </dl>
        </section>
      )}
    </div>
  );

  const toggle = (label: string) => (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      aria-expanded={expanded}
      className="inline-flex items-center gap-1 rounded-full text-[13px] font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      {expanded ? "Ocultar datos" : label}
      <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", expanded && "rotate-180")} />
    </button>
  );

  if (editing) {
    return (
      <SurfaceCard>
        <div className="mb-6">{identity}</div>
        <PatientEditForm
          patient={p}
          customFields={customFields}
          onCancel={() => setEditing(false)}
          onSaved={(updated) => {
            onUpdated(updated);
            setEditing(false);
          }}
        />
      </SurfaceCard>
    );
  }

  const active = admissions.find((a) => a.estado === "en_curso");
  const last = admissions[0];
  return (
    <SurfaceCard>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            {identity}
            {actions}
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Field label="Documento" value={document} mono />
            <Field label="Historia clínica" value={p.numero_historia} mono />
            <Field label="Régimen" value={format.insuranceRegimeLabel(p.regimen)} />
            <Field label="Teléfono" value={p.telefono_principal} />
          </dl>
          {toggle("Ver ficha completa")}
        </div>
        <div className="min-w-0 space-y-2 lg:border-l lg:border-border lg:pl-6">
          <h4 className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground/80">Antes de atender</h4>
          <div className="rounded-tile bg-muted/50 px-4 py-3">
            <p className="text-[12px] text-muted-foreground">Admisión en curso</p>
            <p className="mt-0.5 text-sm text-foreground">
              {active ? join(active.motivo ?? "Sin motivo", active.fecha_inicio ? format.date(active.fecha_inicio) : null) : "Ninguna"}
            </p>
          </div>
          <div className="rounded-tile bg-muted/50 px-4 py-3">
            <p className="text-[12px] text-muted-foreground">Última admisión</p>
            <p className="mt-0.5 text-sm text-foreground">
              {last ? join(last.fecha_inicio ? format.date(last.fecha_inicio) : null, last.diagnostico_principal ?? last.motivo) : "Sin admisiones previas"}
            </p>
          </div>
          <div className="rounded-tile bg-muted/50 px-4 py-3">
            <p className="text-[12px] text-muted-foreground">Admisiones registradas</p>
            <p className="mt-0.5 text-sm tabular-nums text-foreground">{admissions.length}</p>
          </div>
        </div>
      </div>
      {expanded && <div className="mt-5 border-t border-border pt-5">{sections}</div>}
    </SurfaceCard>
  );
}
