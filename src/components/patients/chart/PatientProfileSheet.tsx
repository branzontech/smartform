import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCountry } from "@/config/country";
import type { DynamicFieldConfig } from "@/components/config/DynamicFieldConfigurator";
import { PatientEditForm, type EditablePatientRow } from "@/components/patients/PatientEditForm";
import { PATIENT_CUSTOM_FIELDS_KEY, fetchPatientCustomFields } from "@/components/patients/PatientSummary";

interface Field {
  label: string;
  value: ReactNode;
}

const filled = (f: Field) => f.value !== null && f.value !== undefined && f.value !== "";

function Section({ title, fields }: { title: string; fields: Field[] }) {
  const shown = fields.filter(filled);
  if (shown.length === 0) return null;
  return (
    <section className="grid gap-2.5">
      <h3 className="text-[13px] font-semibold text-primary">{title}</h3>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        {shown.map((f) => (
          <div key={f.label} className="min-w-0">
            <dt className="text-[12px] text-muted-foreground">{f.label}</dt>
            <dd className="mt-px break-words text-sm text-foreground">{f.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * Todos los datos del paciente en una hoja lateral (lo que no cabe en el panel
 * izquierdo) y su edición en el mismo lugar. Nunca muestra campos vacíos.
 */
export function PatientProfileSheet({
  patient: p,
  open,
  onOpenChange,
  onUpdated,
}: {
  patient: EditablePatientRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (patient: EditablePatientRow) => void;
}) {
  const { format } = useCountry();
  const [editing, setEditing] = useState(false);
  const { data: customFields = [] } = useQuery({ queryKey: PATIENT_CUSTOM_FIELDS_KEY, queryFn: fetchPatientCustomFields, staleTime: 5 * 60_000, enabled: open });
  const custom = (p.fhir_extensions?.custom_fields ?? {}) as Record<string, unknown>;
  const customValue = (f: DynamicFieldConfig): ReactNode => {
    const v = custom[f.id];
    if (v === null || v === undefined || v === "") return null;
    if (f.tipo_dato === "boolean") return v === true || v === "true" ? "Sí" : "No";
    if (f.tipo_dato === "date") return format.date(String(v));
    return String(v);
  };

  const close = (next: boolean) => {
    if (!next) setEditing(false);
    onOpenChange(next);
  };

  return (
    <Sheet open={open} onOpenChange={close}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[480px]">
        <SheetHeader className="flex-row items-center justify-between gap-3 space-y-0 pr-8">
          <SheetTitle className="text-[17px]">{editing ? "Editar datos del paciente" : "Ficha completa"}</SheetTitle>
          {!editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="h-8 gap-1.5 rounded-lg text-[13px]">
              <Pencil className="h-3.5 w-3.5" />Editar
            </Button>
          )}
        </SheetHeader>
        <SheetDescription className="sr-only">Datos de identificación, contacto y afiliación del paciente.</SheetDescription>
        {editing ? (
          <div className="pt-5">
            <PatientEditForm
              patient={p}
              customFields={customFields}
              onCancel={() => setEditing(false)}
              onSaved={(updated) => {
                onUpdated(updated);
                setEditing(false);
              }}
            />
          </div>
        ) : (
          <div className="grid gap-6 pt-5">
            <Section
              title="Identificación"
              fields={[
                { label: "Documento", value: `${p.tipo_documento ?? ""} ${p.numero_documento ?? ""}`.trim() },
                { label: "Historia clínica", value: p.numero_historia },
                { label: "Fecha de nacimiento", value: p.fecha_nacimiento ? format.date(p.fecha_nacimiento) : null },
                { label: "Sexo", value: p.genero },
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
                { label: "Carné", value: p.carnet },
                { label: "Dirección", value: p.direccion },
                { label: "Ciudad", value: [p.ciudad, p.estado].filter(Boolean).join(", ") },
                { label: "Zona", value: p.zona },
              ]}
            />
            <Section title="Datos adicionales" fields={customFields.map((f) => ({ label: f.label, value: customValue(f) }))} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
