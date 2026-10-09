import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Tarjeta de una sección del contrato, con ancla para la navegación lateral. */
export function ContractSection({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-4 rounded-card bg-card p-5 shadow-card dark:border dark:border-border dark:shadow-none md:p-6">
      <header className="mb-5">
        <h2 id={`${id}-title`} className="text-lg font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
      </header>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

export function FieldGrid({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 }) {
  return <div className={cn("grid gap-4", cols === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3")}>{children}</div>;
}

interface FieldProps {
  id: string;
  label: string;
  help?: string;
  required?: boolean;
  className?: string;
}

function FieldLabel({ id, label, required }: { id: string; label: string; required?: boolean }) {
  return (
    <Label htmlFor={id} className="text-[13px] font-medium">
      {label}
      {required && <span className="text-primary"> *</span>}
    </Label>
  );
}

export function TextField({ id, label, help, required, className, value, onChange, placeholder, type = "text" }: FieldProps & {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: "text" | "email" | "date";
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <FieldLabel id={id} label={label} required={required} />
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-10" />
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}

export function AreaField({ id, label, help, required, className, value, onChange, placeholder }: FieldProps & {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <FieldLabel id={id} label={label} required={required} />
      <Textarea id={id} rows={2} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="resize-y" />
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}

/** Número con su unidad a la vista ($, %, días, meses…). Se escribe como texto y se valida al guardar. */
export function NumberField({ id, label, help, required, className, value, onChange, prefix, suffix, allowNegative = false }: FieldProps & {
  value: string; onChange: (v: string) => void; prefix?: string; suffix?: string; allowNegative?: boolean;
}) {
  const clean = (v: string) => v.replace(allowNegative ? /[^\d.,-]/g : /[^\d.,]/g, "");
  return (
    <div className={cn("grid gap-1.5", className)}>
      <FieldLabel id={id} label={label} required={required} />
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{prefix}</span>}
        <Input
          id={id}
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(clean(e.target.value))}
          className={cn("h-10 tabular-nums", prefix && "pl-7", suffix && "pr-16")}
        />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{suffix}</span>}
      </div>
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}

export function SelectField({ id, label, help, required, className, value, onChange, options, placeholder = "Selecciona" }: FieldProps & {
  value: string | null; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <FieldLabel id={id} label={label} required={required} />
      <Select value={value ?? undefined} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-10"><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}

/** Opción de sí/no con su explicación: fila completa clicable. */
export function ToggleRow({ id, label, help, checked, onChange }: { id: string; label: string; help?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-tile px-1 py-1.5">
      <div className="min-w-0">
        <Label htmlFor={id} className="cursor-pointer text-[14px] font-medium">{label}</Label>
        {help && <p className="text-xs text-muted-foreground">{help}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} className="mt-0.5 shrink-0" />
    </div>
  );
}
