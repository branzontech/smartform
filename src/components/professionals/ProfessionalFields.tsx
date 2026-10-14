import { MODALITY_LABEL, type Modality } from "@/components/agenda/agenda-api";
import { FieldGrid, NumberField, SelectField, TextField, ToggleRow } from "@/components/contracts/fields";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MODALITIES, PRO_TYPE_OPTIONS, type ProfessionalForm } from "./professional-form";

interface ProfessionalFieldsProps {
  /** Prefijo de los id de los campos (dos formularios pueden convivir en la página). */
  idPrefix: string;
  form: ProfessionalForm;
  onChange: (patch: Partial<ProfessionalForm>) => void;
  /** Muestra la opción «Activo» (solo en la ficha; al habilitar siempre queda activo). */
  showActive?: boolean;
}

/** Campos de la ficha del profesional: los usan el diálogo «Habilitar» y la sección «Ficha». */
export function ProfessionalFields({ idPrefix, form, onChange, showActive = false }: ProfessionalFieldsProps) {
  const id = (name: string) => `${idPrefix}-${name}`;
  const toggleModality = (m: Modality, checked: boolean) =>
    onChange({ modalidades: checked ? [...form.modalidades.filter((x) => x !== m), m] : form.modalidades.filter((x) => x !== m) });

  return (
    <div className="grid gap-4">
      <FieldGrid>
        <SelectField
          id={id("type")}
          label="Tipo de profesional"
          required
          value={form.tipo || null}
          onChange={(tipo) => onChange({ tipo })}
          options={PRO_TYPE_OPTIONS}
        />
        <TextField id={id("specialty")} label="Especialidad" value={form.especialidad} onChange={(especialidad) => onChange({ especialidad })} />
        <TextField
          id={id("registry")}
          label="Registro profesional"
          value={form.registroProfesional}
          onChange={(registroProfesional) => onChange({ registroProfesional })}
        />
        <NumberField
          id={id("duration")}
          label="Duración de la cita"
          required
          suffix="minutos"
          help="De 5 a 480 minutos."
          value={form.duracionCitaMin}
          onChange={(duracionCitaMin) => onChange({ duracionCitaMin: duracionCitaMin.replace(/[.,]/g, "") })}
        />
      </FieldGrid>

      <fieldset className="grid gap-1.5">
        <legend className="mb-1.5 text-[13px] font-medium">
          Modalidades de atención<span className="text-primary"> *</span>
        </legend>
        <div className="grid gap-1 sm:grid-cols-3">
          {MODALITIES.map((m) => {
            const checkboxId = id(`modality-${m}`);
            return (
              <Label
                key={m}
                htmlFor={checkboxId}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-normal transition-colors hover:bg-muted/60"
              >
                <Checkbox id={checkboxId} checked={form.modalidades.includes(m)} onCheckedChange={(v) => toggleModality(m, v === true)} />
                {MODALITY_LABEL[m]}
              </Label>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-1.5">
        <Label htmlFor={id("color")} className="text-[13px] font-medium">Color en la agenda</Label>
        <div className="flex items-center gap-3">
          <input
            id={id("color")}
            type="color"
            value={form.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="h-10 w-16 cursor-pointer rounded-lg border border-input bg-background p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <p className="text-xs text-muted-foreground">Distingue sus citas en el calendario.</p>
        </div>
      </div>

      {showActive && (
        <ToggleRow
          id={id("active")}
          label="Activo"
          help="Si está inactivo no se le pueden asignar citas nuevas."
          checked={form.activo}
          onChange={(activo) => onChange({ activo })}
        />
      )}
    </div>
  );
}
