import { FieldGrid, NumberField, SelectField, TextField, ToggleRow } from "@/components/contracts/fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Audience, ContentType } from "./content-api";
import { AUDIENCE_OPTIONS, isDated, LIMITS, TYPE_OPTIONS, type ContentForm } from "./content-form";
import { ContentImageField } from "./ContentImageField";

interface ContentFieldsProps {
  form: ContentForm;
  onChange: (patch: Partial<ContentForm>) => void;
  empresaId: string;
  onUploaded: (path: string) => void;
}

function FieldLabel({ id, label, required }: { id: string; label: string; required?: boolean }) {
  return (
    <Label htmlFor={id} className="text-[13px] font-medium">
      {label}
      {required && <span className="text-primary"> *</span>}
    </Label>
  );
}

/** Texto largo con su conteo de caracteres a la vista. */
function CountedArea({ id, label, value, max, rows, onChange }: {
  id: string; label: string; value: string; max: number; rows: number; onChange: (v: string) => void;
}) {
  const over = value.length > max;
  return (
    <div className="grid gap-1.5">
      <FieldLabel id={id} label={label} />
      <Textarea id={id} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className="resize-y" />
      <p className={cn("text-right text-xs tabular-nums text-muted-foreground", over && "text-destructive")}>{value.length}/{max}</p>
    </div>
  );
}

function DateTimeField({ id, label, required, value, onChange }: {
  id: string; label: string; required?: boolean; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <FieldLabel id={id} label={label} required={required} />
      <Input id={id} type="datetime-local" value={value} onChange={(e) => onChange(e.target.value)} className="h-10" />
    </div>
  );
}

/** Campos de una publicación del Inicio de las apps. */
export function ContentFields({ form, onChange, empresaId, onUploaded }: ContentFieldsProps) {
  const id = (name: string) => `content-${name}`;
  const dated = isDated(form.tipo);

  return (
    <div className="grid gap-4">
      <FieldGrid>
        <SelectField
          id={id("type")}
          label="Tipo"
          required
          value={form.tipo}
          onChange={(tipo) => onChange({ tipo: tipo as ContentType })}
          options={TYPE_OPTIONS}
        />
        <SelectField
          id={id("audience")}
          label="Audiencia"
          required
          value={form.audiencia}
          onChange={(audiencia) => onChange({ audiencia: audiencia as Audience })}
          options={AUDIENCE_OPTIONS}
        />
      </FieldGrid>

      <TextField id={id("title")} label="Título" required value={form.titulo} onChange={(titulo) => onChange({ titulo })} />
      <CountedArea id={id("summary")} label="Resumen" rows={2} max={LIMITS.resumen} value={form.resumen} onChange={(resumen) => onChange({ resumen })} />
      <CountedArea id={id("body")} label="Contenido" rows={5} max={LIMITS.cuerpo} value={form.cuerpo} onChange={(cuerpo) => onChange({ cuerpo })} />

      <ContentImageField
        id={id("image")}
        empresaId={empresaId}
        value={form.imagenRuta}
        onChange={(imagenRuta) => onChange({ imagenRuta })}
        onUploaded={onUploaded}
      />

      {dated && (
        <FieldGrid>
          <DateTimeField id={id("start")} label="Inicio" required value={form.inicio} onChange={(inicio) => onChange({ inicio })} />
          <DateTimeField id={id("end")} label="Fin" value={form.fin} onChange={(fin) => onChange({ fin })} />
        </FieldGrid>
      )}

      <FieldGrid>
        <TextField id={id("place")} label="Lugar" value={form.lugar} onChange={(lugar) => onChange({ lugar })} />
        <TextField id={id("link")} label="Enlace" placeholder="https://" value={form.enlace} onChange={(enlace) => onChange({ enlace })} />
      </FieldGrid>

      <NumberField
        id={id("order")}
        label="Orden"
        help={`De 0 a ${LIMITS.orden}.`}
        value={form.orden}
        onChange={(orden) => onChange({ orden: orden.replace(/[.,]/g, "") })}
        className="sm:max-w-[calc(50%-0.5rem)]"
      />

      <div className="grid gap-1">
        <ToggleRow
          id={id("featured")}
          label="Destacado"
          help="Aparece arriba, en los destacados del Inicio."
          checked={form.destacado}
          onChange={(destacado) => onChange({ destacado })}
        />
        <ToggleRow
          id={id("published")}
          label="Publicado"
          help="Si está apagado queda como borrador y no se ve en las apps."
          checked={form.publicado}
          onChange={(publicado) => onChange({ publicado })}
        />
      </div>
    </div>
  );
}
