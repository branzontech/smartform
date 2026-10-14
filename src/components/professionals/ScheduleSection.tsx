import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import {
  MODALITY_LABEL, saveSchedule, WEEKDAYS, type Modality, type ProfessionalDetail, type ScheduleBlock,
} from "@/components/agenda/agenda-api";
import { fetchSites } from "@/components/contracts/contract-api";
import { ContractSection } from "@/components/contracts/fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { errorMessage, MODALITIES, professionalKeys } from "./professional-form";
import {
  copyMondayToWorkdays, MAX_BLOCKS, newBlock, sameSchedule, scheduleIssues, toDraft, toScheduleBlocks, type DraftBlock,
} from "./schedule";

const NO_SITE = "none";
const DAYS = [1, 2, 3, 4, 5, 6, 7];

interface ScheduleSectionProps {
  professional: ProfessionalDetail;
  canEdit: boolean;
}

/** Horario semanal: bloques por día con su modalidad y sede. Se guarda completo (reemplaza el anterior). */
export function ScheduleSection({ professional, canEdit }: ScheduleSectionProps) {
  const queryClient = useQueryClient();
  const [blocks, setBlocks] = useState<DraftBlock[]>(() => toDraft(professional.horario));
  const sitesQuery = useQuery({ queryKey: ["sites"], queryFn: fetchSites });
  const sites = sitesQuery.data ?? [];

  const dirty = !sameSchedule(blocks, professional.horario);
  const issues = useMemo(() => scheduleIssues(blocks), [blocks]);
  const defaultModality: Modality = professional.modalidades[0] ?? "sede";

  const mutation = useMutation({
    mutationFn: (payload: ScheduleBlock[]) => saveSchedule(professional.id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: professionalKeys.detail(professional.id) });
      void queryClient.invalidateQueries({ queryKey: professionalKeys.list });
      toast.success("Horario guardado");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const update = (key: string, patch: Partial<DraftBlock>) =>
    setBlocks((list) => list.map((b) => (b.key === key ? { ...b, ...patch } : b)));
  const remove = (key: string) => setBlocks((list) => list.filter((b) => b.key !== key));
  const add = (day: number) => setBlocks((list) => [...list, newBlock(day, list, defaultModality)]);
  const copyMonday = () => {
    if (!blocks.some((b) => b.diaSemana === 1)) {
      toast.error("El lunes no tiene bloques para copiar.");
      return;
    }
    setBlocks(copyMondayToWorkdays);
    toast.success("Se copió el horario del lunes de martes a viernes");
  };
  const save = () => {
    if (issues.length) {
      toast.error("Revisa el horario", { description: issues.join(" · ") });
      return;
    }
    mutation.mutate(toScheduleBlocks(blocks));
  };

  /** Modalidades que se ofrecen: las del profesional y, si un bloque ya tiene otra, también esa. */
  const modalityOptions = (current: Modality) => MODALITIES.filter((m) => m === current || professional.modalidades.includes(m));

  return (
    <ContractSection id="horario" title="Horario semanal" description="Bloques en los que atiende cada día. Al guardar se reemplaza el horario anterior.">
      {canEdit && (
        <div className="-mt-2 flex flex-wrap items-center justify-end gap-2">
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-[13px] text-muted-foreground" onClick={copyMonday}>
            <Copy className="h-4 w-4" aria-hidden />
            Copiar lunes a días hábiles
          </Button>
          <Button size="sm" className="h-8 text-[13px]" disabled={!dirty || mutation.isPending || blocks.length > MAX_BLOCKS} onClick={save}>
            {mutation.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />}
            Guardar horario
          </Button>
        </div>
      )}

      <div className="divide-y divide-border/60">
        {DAYS.map((day) => {
          const dayBlocks = blocks.filter((b) => b.diaSemana === day);
          return (
            <div key={day} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:gap-4">
              <p className="w-24 shrink-0 pt-2 text-[14px] font-medium">{WEEKDAYS[day - 1]}</p>
              <div className="grid min-w-0 flex-1 gap-2">
                {dayBlocks.length === 0 && !canEdit && <p className="pt-2 text-[13px] text-muted-foreground">No atiende</p>}
                {dayBlocks.map((b) => (
                  <BlockRow
                    key={b.key}
                    block={b}
                    canEdit={canEdit}
                    sites={sites}
                    modalities={modalityOptions(b.modalidad)}
                    onChange={(patch) => update(b.key, patch)}
                    onRemove={() => remove(b.key)}
                  />
                ))}
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("h-9 w-fit gap-1.5 text-[13px] text-muted-foreground", dayBlocks.length === 0 && "mt-0.5")}
                    onClick={() => add(day)}
                    aria-label={`Agregar bloque el ${WEEKDAYS[day - 1].toLowerCase()}`}
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                    Agregar bloque
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {canEdit && dirty && issues.length > 0 && <p className="text-[13px] text-destructive">{issues[0]}</p>}
    </ContractSection>
  );
}

interface BlockRowProps {
  block: DraftBlock;
  canEdit: boolean;
  sites: { id: string; nombre: string }[];
  modalities: Modality[];
  onChange: (patch: Partial<DraftBlock>) => void;
  onRemove: () => void;
}

function BlockRow({ block, canEdit, sites, modalities, onChange, onRemove }: BlockRowProps) {
  const day = WEEKDAYS[block.diaSemana - 1].toLowerCase();
  const timeClass = "h-9 w-[7.5rem] tabular-nums";

  if (!canEdit) {
    const site = block.modalidad === "sede" ? sites.find((s) => s.id === block.sedeId)?.nombre : null;
    return (
      <p className="pt-2 text-[14px] tabular-nums">
        {block.horaInicio} a {block.horaFin}
        <span className="text-muted-foreground"> · {MODALITY_LABEL[block.modalidad]}{site ? ` · ${site}` : ""}</span>
      </p>
    );
  }

  return (
    <div className="group flex flex-wrap items-center gap-2 rounded-lg">
      <Input
        type="time"
        aria-label={`Hora de inicio del ${day}`}
        value={block.horaInicio}
        onChange={(e) => onChange({ horaInicio: e.target.value })}
        className={timeClass}
      />
      <span className="text-[13px] text-muted-foreground">a</span>
      <Input
        type="time"
        aria-label={`Hora de fin del ${day}`}
        value={block.horaFin}
        onChange={(e) => onChange({ horaFin: e.target.value })}
        className={timeClass}
      />
      <Select value={block.modalidad} onValueChange={(v) => onChange({ modalidad: v as Modality })}>
        <SelectTrigger aria-label={`Modalidad del bloque del ${day}`} className="h-9 w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          {modalities.map((m) => <SelectItem key={m} value={m}>{MODALITY_LABEL[m]}</SelectItem>)}
        </SelectContent>
      </Select>
      {block.modalidad === "sede" && (
        <Select value={block.sedeId ?? NO_SITE} onValueChange={(v) => onChange({ sedeId: v === NO_SITE ? null : v })}>
          <SelectTrigger aria-label={`Sede del bloque del ${day}`} className="h-9 w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_SITE}>Sin sede fija</SelectItem>
            {sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Quitar bloque del ${day}`}
        title="Quitar bloque"
        onClick={onRemove}
        className="h-8 w-8 rounded-lg text-muted-foreground opacity-0 transition-opacity duration-150 hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
      >
        <X className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );
}
