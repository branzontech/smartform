import { useState, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DynamicFieldRenderer } from "@/components/config/DynamicFieldRenderer";
import type { DynamicFieldConfig } from "@/components/config/DynamicFieldConfigurator";
import { useCountry } from "@/config/country";
import { db } from "@/integrations/data/client";
import { useToast } from "@/hooks/use-toast";

/** Fila completa de public.pacientes (la página la carga con select("*")). */
export interface EditablePatientRow {
  id: string;
  nombres?: string | null;
  apellidos?: string | null;
  tipo_documento?: string | null;
  numero_documento?: string | null;
  numero_historia?: string | null;
  fecha_nacimiento?: string | null;
  genero?: string | null;
  telefono_principal?: string | null;
  telefono_secundario?: string | null;
  email?: string | null;
  regimen?: string | null;
  tipo_afiliacion?: string | null;
  carnet?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  estado?: string | null;
  zona?: string | null;
  ocupacion?: string | null;
  fhir_extensions?: Record<string, unknown> | null;
}

interface PatientEditFormProps {
  patient: EditablePatientRow;
  customFields: DynamicFieldConfig[];
  onCancel: () => void;
  onSaved: (patient: EditablePatientRow) => void;
}

const GENDERS = ["Masculino", "Femenino", "Otro"];
/** Registros creados desde el alta antigua guardan el código en inglés. */
const GENDER_FROM_CODE: Record<string, string> = { male: "Masculino", female: "Femenino", other: "Otro" };
const ZONES = ["Urbana", "Rural"];

const optionalText = z.string().trim().transform((v) => v || null);
const schema = z.object({
  nombres: z.string().trim().min(1, "Escribe los nombres"),
  apellidos: z.string().trim().min(1, "Escribe los apellidos"),
  tipo_documento: optionalText,
  fecha_nacimiento: optionalText,
  genero: optionalText,
  numero_historia: optionalText,
  ocupacion: optionalText,
  telefono_principal: z.string().trim().min(1, "Escribe un teléfono"),
  telefono_secundario: optionalText,
  email: z.union([z.literal(""), z.string().trim().email("Revisa el correo")]).transform((v) => v || null),
  regimen: optionalText,
  tipo_afiliacion: optionalText,
  carnet: optionalText,
  direccion: optionalText,
  ciudad: optionalText,
  estado: optionalText,
  zona: optionalText,
});
type FormValues = z.input<typeof schema>;
type FormKey = keyof FormValues;

const toForm = (p: EditablePatientRow): FormValues => ({
  nombres: p.nombres ?? "",
  apellidos: p.apellidos ?? "",
  tipo_documento: p.tipo_documento ?? "",
  fecha_nacimiento: p.fecha_nacimiento?.slice(0, 10) ?? "",
  genero: p.genero ? GENDER_FROM_CODE[p.genero] ?? p.genero : "",
  numero_historia: p.numero_historia ?? "",
  ocupacion: p.ocupacion ?? "",
  telefono_principal: p.telefono_principal ?? "",
  telefono_secundario: p.telefono_secundario ?? "",
  email: p.email ?? "",
  regimen: p.regimen ?? "",
  tipo_afiliacion: p.tipo_afiliacion ?? "",
  carnet: p.carnet ?? "",
  direccion: p.direccion ?? "",
  ciudad: p.ciudad ?? "",
  estado: p.estado ?? "",
  zona: p.zona ?? "",
});

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground/80">{title}</legend>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </fieldset>
  );
}

/**
 * Edición del paciente dentro del mismo formulario (sin salir de la atención).
 * El número de documento no se edita aquí: cambiarlo es un trámite aparte.
 */
export function PatientEditForm({ patient, customFields, onCancel, onSaved }: PatientEditFormProps) {
  const { profile } = useCountry();
  const { toast } = useToast();
  const [values, setValues] = useState<FormValues>(() => toForm(patient));
  const [custom, setCustom] = useState<Record<string, string>>(() => {
    const saved = (patient.fhir_extensions?.custom_fields ?? {}) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(saved).map(([k, v]) => [k, v == null ? "" : String(v)]));
  });
  const [errors, setErrors] = useState<Partial<Record<FormKey, string>>>({});

  const set = (key: FormKey) => (value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const save = useMutation({
    mutationFn: async (changes: z.output<typeof schema>) => {
      const fhirExtensions = { ...(patient.fhir_extensions ?? {}), custom_fields: custom };
      const { error } = await db
        .from("pacientes")
        .update({ ...changes, fhir_extensions: fhirExtensions })
        .eq("id", patient.id);
      if (error) throw new Error(error.message);
      return { ...patient, ...changes, fhir_extensions: fhirExtensions };
    },
    onSuccess: (updated) => {
      toast({ title: "Datos del paciente actualizados" });
      onSaved(updated);
    },
    onError: (e: Error) => toast({ title: "No se pudieron guardar los cambios", description: e.message, variant: "destructive" }),
  });

  const submit = () => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const next: Partial<Record<FormKey, string>> = {};
      for (const issue of parsed.error.issues) next[issue.path[0] as FormKey] ??= issue.message;
      setErrors(next);
      return;
    }
    const missing = customFields.find((f) => f.es_requerido && !custom[f.id]);
    if (missing) {
      toast({ title: `Completa «${missing.label}»`, variant: "destructive" });
      return;
    }
    save.mutate(parsed.data);
  };

  const text = (key: FormKey, label: string, props: { type?: string; required?: boolean } = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`patient-${key}`}>{label}{props.required && " *"}</Label>
      <Input
        id={`patient-${key}`}
        type={props.type ?? "text"}
        value={values[key] ?? ""}
        onChange={(e) => set(key)(e.target.value)}
        aria-invalid={!!errors[key]}
      />
      {errors[key] && <p className="text-[12px] text-destructive">{errors[key]}</p>}
    </div>
  );

  const choice = (key: FormKey, label: string, options: { value: string; label: string }[]) => {
    const current = values[key] ?? "";
    // Un valor guardado que no está en la lista (dato antiguo) se conserva como opción.
    const all = current && !options.some((o) => o.value === current) ? [...options, { value: current, label: current }] : options;
    return (
      <div className="space-y-1.5">
        <Label htmlFor={`patient-${key}`}>{label}</Label>
        <Select value={current} onValueChange={set(key)}>
          <SelectTrigger id={`patient-${key}`}><SelectValue placeholder="Selecciona" /></SelectTrigger>
          <SelectContent>
            {all.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Group title="Identificación">
        {text("nombres", "Nombres", { required: true })}
        {text("apellidos", "Apellidos", { required: true })}
        {choice("tipo_documento", "Tipo de documento", profile.documentTypes.map((d) => ({ value: d.code, label: `${d.code} · ${d.label}` })))}
        <div className="space-y-1.5">
          <Label htmlFor="patient-numero_documento">Número de documento</Label>
          <Input id="patient-numero_documento" value={patient.numero_documento ?? ""} disabled />
        </div>
        {text("fecha_nacimiento", "Fecha de nacimiento", { type: "date" })}
        {choice("genero", "Sexo", GENDERS.map((g) => ({ value: g, label: g })))}
        {text("numero_historia", "Historia clínica")}
        {text("ocupacion", "Ocupación")}
      </Group>

      <Group title="Contacto">
        {text("telefono_principal", "Teléfono", { type: "tel", required: true })}
        {text("telefono_secundario", "Teléfono secundario", { type: "tel" })}
        {text("email", "Correo", { type: "email" })}
      </Group>

      <Group title="Afiliación y ubicación">
        {/* El régimen se guarda con su etiqueta, como en los registros existentes. */}
        {choice("regimen", "Régimen", profile.insuranceRegimes.map((r) => ({ value: r.label, label: r.label })))}
        {text("tipo_afiliacion", "Tipo de afiliación")}
        {text("carnet", "Carné")}
        {text("direccion", "Dirección")}
        {text("ciudad", profile.subregionLabel)}
        {text("estado", profile.regionLabel)}
        {choice("zona", "Zona", ZONES.map((z) => ({ value: z, label: z })))}
      </Group>

      {customFields.length > 0 && (
        <fieldset className="space-y-3">
          <legend className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground/80">Datos adicionales</legend>
          <DynamicFieldRenderer fields={customFields} values={custom} onChange={(id, v) => setCustom((c) => ({ ...c, [id]: v }))} />
        </fieldset>
      )}

      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={save.isPending} className="rounded-full">
          Cancelar
        </Button>
        <Button onClick={submit} disabled={save.isPending} className="gap-2 rounded-full px-5">
          {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
