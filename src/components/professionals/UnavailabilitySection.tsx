import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import {
  addUnavailability, BLOCK_REASON_LABEL, formatShortDay, localDay, localTime, removeUnavailability, today, toIso,
  type ProfessionalDetail, type Unavailability,
} from "@/components/agenda/agenda-api";
import { AreaField, ContractSection, FieldGrid, SelectField } from "@/components/contracts/fields";
import { RowActions } from "@/components/kit/RowActions";
import { SimpleTable, type SimpleColumn } from "@/components/kit/table";
import { useConfirm } from "@/components/kit/useConfirm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorMessage, professionalKeys } from "./professional-form";

const REASON_OPTIONS = Object.entries(BLOCK_REASON_LABEL).map(([value, label]) => ({ value, label }));
const reasonLabel = (motivo: string) => BLOCK_REASON_LABEL[motivo] ?? motivo;
const formatInstant = (iso: string) => `${formatShortDay(localDay(iso))}, ${localTime(iso)}`;

interface UnavailabilitySectionProps {
  professional: ProfessionalDetail;
  canEdit: boolean;
}

/** Bloqueos vigentes y próximos (vacaciones, incapacidad…): en esos periodos no se asignan citas. */
export function UnavailabilitySection({ professional, canEdit }: UnavailabilitySectionProps) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [confirm, confirmDialog] = useConfirm();

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeUnavailability(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: professionalKeys.detail(professional.id) });
      toast.success("Bloqueo quitado");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const remove = async (b: Unavailability) => {
    const ok = await confirm({
      title: "¿Quitar este bloqueo?",
      description: `${reasonLabel(b.motivo)} del ${formatInstant(b.inicio)} al ${formatInstant(b.fin)}. El profesional vuelve a quedar disponible en ese periodo.`,
      confirmLabel: "Quitar",
      destructive: true,
    });
    if (ok) removeMutation.mutate(b.id);
  };

  const columns: SimpleColumn<Unavailability>[] = [
    { id: "reason", title: "Motivo", cell: (b) => reasonLabel(b.motivo), primary: true },
    { id: "from", title: "Desde", cell: (b) => formatInstant(b.inicio), className: "whitespace-nowrap tabular-nums" },
    { id: "to", title: "Hasta", cell: (b) => formatInstant(b.fin), className: "whitespace-nowrap tabular-nums" },
    { id: "note", title: "Nota", cell: (b) => <span className="block max-w-[280px] truncate">{b.nota ?? "—"}</span> },
    ...(canEdit
      ? [{
          id: "actions",
          title: <span className="sr-only">Acciones</span>,
          className: "w-12 text-right",
          cell: (b: Unavailability) => (
            <RowActions name={reasonLabel(b.motivo)} menu={[{ title: "Quitar", icon: X, onClick: () => void remove(b) }]} />
          ),
        }]
      : []),
  ];

  return (
    <ContractSection id="bloqueos" title="Bloqueos" description="Vacaciones, incapacidades y otras ausencias. En esos periodos no se pueden asignar citas.">
      {canEdit && (
        <div className="-mt-2 flex justify-end">
          <Button size="sm" className="h-8 gap-1.5 text-[13px]" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Agregar bloqueo
          </Button>
        </div>
      )}
      <SimpleTable columns={columns} rows={professional.bloqueos} rowKey={(b) => b.id} empty="No hay bloqueos vigentes ni próximos." />
      <AddUnavailabilityDialog professionalId={professional.id} open={adding} onClose={() => setAdding(false)} />
      {confirmDialog}
    </ContractSection>
  );
}

function AddUnavailabilityDialog({ professionalId, open, onClose }: { professionalId: string; open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
        {open && <AddUnavailabilityForm professionalId={professionalId} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function AddUnavailabilityForm({ professionalId, onClose }: { professionalId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [motivo, setMotivo] = useState("");
  const [startDay, setStartDay] = useState(today);
  const [startTime, setStartTime] = useState("00:00");
  const [endDay, setEndDay] = useState(today);
  const [endTime, setEndTime] = useState("23:59");
  const [nota, setNota] = useState("");

  const mutation = useMutation({
    mutationFn: (input: { inicio: string; fin: string; motivo: string; nota: string | null }) => addUnavailability(professionalId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: professionalKeys.detail(professionalId) });
      toast.success("Bloqueo agregado");
      onClose();
    },
    // 409: hay citas activas en el periodo; el servidor explica qué hacer.
    onError: (e) => toast.error(errorMessage(e)),
  });

  const submit = () => {
    if (!motivo) return toast.error("Elige el motivo del bloqueo.");
    if (!startDay || !startTime || !endDay || !endTime) return toast.error("Completa la fecha y la hora de inicio y de fin.");
    const inicio = toIso(startDay, startTime);
    const fin = toIso(endDay, endTime);
    if (Date.parse(fin) <= Date.parse(inicio)) return toast.error("El fin del bloqueo debe ser posterior al inicio.");
    mutation.mutate({ inicio, fin, motivo, nota: nota.trim() || null });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Agregar bloqueo</DialogTitle>
        <DialogDescription>Durante este periodo el profesional no tendrá cupos en la agenda.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        <SelectField id="block-reason" label="Motivo" required value={motivo || null} onChange={setMotivo} options={REASON_OPTIONS} />
        <FieldGrid>
          <DateTimeField id="block-start" label="Desde" day={startDay} time={startTime} onDay={setStartDay} onTime={setStartTime} />
          <DateTimeField id="block-end" label="Hasta" day={endDay} time={endTime} onDay={setEndDay} onTime={setEndTime} />
        </FieldGrid>
        <AreaField id="block-note" label="Nota" value={nota} onChange={setNota} placeholder="Opcional" />
      </div>
      <DialogFooter className="gap-2">
        <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
        <Button onClick={submit} disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />}
          Agregar bloqueo
        </Button>
      </DialogFooter>
    </>
  );
}

interface DateTimeFieldProps {
  id: string;
  label: string;
  day: string;
  time: string;
  onDay: (v: string) => void;
  onTime: (v: string) => void;
}

function DateTimeField({ id, label, day, time, onDay, onTime }: DateTimeFieldProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={`${id}-day`} className="text-[13px] font-medium">
        {label}<span className="text-primary"> *</span>
      </Label>
      <div className="flex gap-2">
        <Input id={`${id}-day`} type="date" value={day} onChange={(e) => onDay(e.target.value)} className="h-10 min-w-0 flex-1 tabular-nums" />
        <Input
          type="time"
          aria-label={`Hora (${label.toLowerCase()})`}
          value={time}
          onChange={(e) => onTime(e.target.value)}
          className="h-10 w-[7.5rem] tabular-nums"
        />
      </div>
    </div>
  );
}
