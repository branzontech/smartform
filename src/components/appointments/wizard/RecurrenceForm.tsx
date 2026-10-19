import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PRO_TYPE_LABEL, today, type ProfessionalRow } from "@/components/agenda/agenda-api";
import { WEEKDAY_NAMES, type Frequency } from "@/components/agenda/plans-api";
import { MAX_PLAN_SESSIONS, type PlanDraft, type PlanTurn } from "./wizard-model";

const FREQUENCY_LABEL: Record<Frequency, string> = {
  semanal: "Ciertos días de la semana",
  cada_n_dias: "Cada cierto número de días",
  mensual: "Una vez al mes",
};
const EVERY_DAYS = Array.from({ length: 30 }, (_, i) => i + 1);
const EVERY_WEEKS = [1, 2, 3, 4];
const FIVE_MINUTES = 300;

interface RecurrenceFormProps {
  value: PlanDraft;
  onChange: (next: PlanDraft) => void;
  professionals: ProfessionalRow[];
}

function ProSelect({ id, value, onChange, professionals }: { id: string; value: string; onChange: (v: string) => void; professionals: ProfessionalRow[] }) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger id={id} className="h-9">
        <SelectValue placeholder="Profesional" />
      </SelectTrigger>
      <SelectContent>
        {professionals.map((p) => (
          <SelectItem key={p.id} value={p.id ?? ""}>
            {p.nombre} · {p.especialidad || PRO_TYPE_LABEL[p.tipo ?? "otro"]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TurnFields({ idPrefix, turn, onChange, professionals }: { idPrefix: string; turn: PlanTurn; onChange: (t: PlanTurn) => void; professionals: ProfessionalRow[] }) {
  return (
    <div className="grid flex-1 grid-cols-[110px_minmax(0,1fr)] gap-2">
      <Input
        id={`${idPrefix}-hora`}
        aria-label="Hora"
        type="time"
        step={FIVE_MINUTES}
        value={turn.hora}
        onChange={(e) => onChange({ ...turn, hora: e.target.value })}
        className="h-9"
      />
      <ProSelect id={`${idPrefix}-pro`} value={turn.profesionalId} onChange={(profesionalId) => onChange({ ...turn, profesionalId })} professionals={professionals} />
    </div>
  );
}

/** Cómo se repiten las citas del plan: frecuencia, hora y profesional, inicio y fin. */
export function RecurrenceForm({ value, onChange, professionals }: RecurrenceFormProps) {
  const set = (patch: Partial<PlanDraft>) => onChange({ ...value, ...patch });
  const onlyPro = professionals.length === 1 ? (professionals[0].id ?? "") : "";

  const toggleDay = (dia: number, on: boolean) => {
    if (!on) {
      const { [dia]: _removed, ...rest } = value.dias;
      set({ dias: rest });
      return;
    }
    // Un día nuevo copia la hora y el profesional del último día elegido.
    const last = Object.values(value.dias).filter(Boolean).at(-1) as PlanTurn | undefined;
    set({ dias: { ...value.dias, [dia]: last ? { ...last } : { hora: value.unico.hora, profesionalId: value.unico.profesionalId || onlyPro } } });
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
        <div className="grid gap-1.5">
          <Label htmlFor="plan-freq">Se repite</Label>
          <Select value={value.frecuencia} onValueChange={(v) => set({ frecuencia: v as Frequency })}>
            <SelectTrigger id="plan-freq" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(FREQUENCY_LABEL) as Frequency[]).map((f) => (
                <SelectItem key={f} value={f}>{FREQUENCY_LABEL[f]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {value.frecuencia === "semanal" && (
          <div className="grid gap-1.5">
            <Label htmlFor="plan-weeks">Cada</Label>
            <Select value={String(value.cadaSemanas)} onValueChange={(v) => set({ cadaSemanas: Number(v) })}>
              <SelectTrigger id="plan-weeks" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVERY_WEEKS.map((n) => (
                  <SelectItem key={n} value={String(n)}>{n === 1 ? "Semana" : `${n} semanas`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {value.frecuencia === "cada_n_dias" && (
          <div className="grid gap-1.5">
            <Label htmlFor="plan-days">Cada</Label>
            <Select value={String(value.cadaDias)} onValueChange={(v) => set({ cadaDias: Number(v) })}>
              <SelectTrigger id="plan-days" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVERY_DAYS.map((n) => (
                  <SelectItem key={n} value={String(n)}>{n === 1 ? "Día" : `${n} días`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {value.frecuencia === "semanal" ? (
        <div className="grid gap-1">
          <p className="text-[13px] font-medium">Días, hora y profesional</p>
          {WEEKDAY_NAMES.map((name, i) => {
            const dia = i + 1;
            const turn = value.dias[dia];
            return (
              <div key={dia} className={cn("flex min-h-11 items-center gap-3 rounded-xl px-2 py-1 transition-colors duration-200", turn ? "bg-muted/60" : "hover:bg-muted/40")}>
                <label className="flex w-28 shrink-0 cursor-pointer items-center gap-2.5 text-[13px] capitalize">
                  <Checkbox checked={!!turn} onCheckedChange={(v) => toggleDay(dia, v === true)} />
                  {name}
                </label>
                {turn ? (
                  <TurnFields idPrefix={`plan-d${dia}`} turn={turn} onChange={(t) => set({ dias: { ...value.dias, [dia]: t } })} professionals={professionals} />
                ) : (
                  <span className="text-xs text-muted-foreground">Sin cita</span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-1.5">
          <p className="text-[13px] font-medium">Hora y profesional</p>
          <TurnFields idPrefix="plan-u" turn={value.unico} onChange={(unico) => set({ unico })} professionals={professionals} />
          {value.frecuencia === "mensual" && <p className="text-xs text-muted-foreground">Cada mes el mismo día que el inicio; en los meses más cortos, su último día.</p>}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="plan-from">Desde</Label>
          <Input id="plan-from" type="date" min={today()} value={value.desde} onChange={(e) => set({ desde: e.target.value })} className="h-9" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="plan-end">Termina</Label>
          <Select value={value.termina} onValueChange={(v) => set({ termina: v as PlanDraft["termina"] })}>
            <SelectTrigger id="plan-end" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sesiones">Tras un número de sesiones</SelectItem>
              <SelectItem value="fecha">En una fecha</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {value.termina === "sesiones" ? (
          <div className="grid gap-1.5">
            <Label htmlFor="plan-count">Sesiones</Label>
            <Input
              id="plan-count"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_PLAN_SESSIONS}
              value={value.sesiones || ""}
              onChange={(e) => set({ sesiones: Number(e.target.value) })}
              className="h-9"
            />
          </div>
        ) : (
          <div className="grid gap-1.5">
            <Label htmlFor="plan-until">Hasta</Label>
            <Input id="plan-until" type="date" min={value.desde} value={value.hasta} onChange={(e) => set({ hasta: e.target.value })} className="h-9" />
          </div>
        )}
      </div>
    </div>
  );
}
