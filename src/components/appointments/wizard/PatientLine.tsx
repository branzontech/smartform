import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { UserAvatar } from "@/components/ui/user-avatar";
import { db } from "@/integrations/data/client";
import { ACTIVE_STATES, fetchPatientCitas, formatShortDay, localDay, localTime } from "@/components/agenda/agenda-api";
import type { ExtendedPatient } from "../PatientPanel";
import { PatientDetailStep } from "./PatientDetailStep";

interface Responsable {
  id: string;
  nombre: string;
  parentesco: string | null;
  telefono: string | null;
  principal: boolean;
}

/** Ventana para contar inasistencias recientes. */
const NO_SHOW_WINDOW_DAYS = 180;
const DAY_MS = 86_400_000;

function ageOf(date: string | undefined): number | null {
  if (!date) return null;
  const birth = new Date(date);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  const beforeBirthday = now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  return now.getFullYear() - birth.getFullYear() - (beforeBirthday ? 1 : 0);
}

function Fact({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`truncate text-[13px] font-semibold ${warning ? "text-[hsl(var(--warning))]" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

const EMPTY_FORM = { nombre: "", parentesco: "", telefono: "" };

/**
 * Línea del paciente al agendar: quién es, su próxima cita, sus inasistencias
 * recientes y su responsable o cuidador. Los datos completos, a un clic.
 */
export function PatientLine({ patient, onPatientUpdated }: { patient: ExtendedPatient; onPatientUpdated: (p: ExtendedPatient) => void }) {
  const queryClient = useQueryClient();
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const name = `${patient.firstName} ${patient.lastName}`.trim();
  const age = ageOf(patient.dateOfBirth);

  const citas = useQuery({ queryKey: ["agenda", "paciente", patient.id], queryFn: () => fetchPatientCitas(patient.id) });
  const responsables = useQuery({
    queryKey: ["agendar", "responsables", patient.id],
    queryFn: async (): Promise<Responsable[]> => {
      const { data, error } = await db
        .from("pacientes_responsables")
        .select("id, nombre, parentesco, telefono, principal")
        .eq("paciente_id", patient.id)
        .order("principal", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Responsable[];
    },
  });

  const now = Date.now();
  const list = citas.data ?? [];
  const next = list
    .filter((c) => ACTIVE_STATES.includes(c.estado) && Date.parse(c.inicio) > now)
    .sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio))[0];
  const noShows = list.filter((c) => c.estado === "no_asistio" && now - Date.parse(c.inicio) < NO_SHOW_WINDOW_DAYS * DAY_MS).length;
  const responsable = responsables.data?.[0];

  const addResponsable = async () => {
    if (form.nombre.trim().length < 2) {
      toast.error("Escribe el nombre del responsable.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await db.from("pacientes_responsables").insert({
        paciente_id: patient.id,
        nombre: form.nombre.trim(),
        parentesco: form.parentesco.trim() || null,
        telefono: form.telefono.trim() || null,
        principal: !responsable,
      });
      if (error) throw new Error(error.message);
      setForm(EMPTY_FORM);
      void queryClient.invalidateQueries({ queryKey: ["agendar", "responsables", patient.id] });
      toast.success("Responsable agregado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar el responsable.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-label="Paciente" className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-card bg-card px-5 py-4 shadow-card dark:border dark:border-border dark:shadow-none">
      <div className="flex min-w-[16rem] flex-1 items-center gap-3">
        <UserAvatar seed={name} alt={name} className="h-11 w-11 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-foreground">{name}</p>
          <p className="truncate text-[13px] text-muted-foreground">
            {[`${patient.documentType || "CC"} ${patient.documentId}`, age !== null ? `${age} años` : null, patient.regime, patient.city].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-x-8">
        <Fact label="Próxima cita" value={next ? `${formatShortDay(localDay(next.inicio))}, ${localTime(next.inicio)}` : "Ninguna"} />
        <Fact label="Inasistencias" value={noShows ? `${noShows} en 6 meses` : "Ninguna"} warning={noShows > 0} />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Responsable</p>
          {responsable ? (
            <p className="truncate text-[13px] font-semibold text-foreground">
              {responsable.nombre}
              {responsable.parentesco ? ` · ${responsable.parentesco}` : ""}
            </p>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="text-[13px] font-semibold text-primary hover:text-primary/80">
                  Agregar
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 space-y-3 rounded-2xl">
                <p className="text-sm font-semibold">Responsable o cuidador</p>
                <div className="grid gap-1.5">
                  <Label htmlFor="resp-nombre" className="text-xs">Nombre</Label>
                  <Input id="resp-nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} maxLength={160} className="h-9" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="resp-parentesco" className="text-xs">Parentesco</Label>
                    <Input id="resp-parentesco" value={form.parentesco} onChange={(e) => setForm({ ...form, parentesco: e.target.value })} maxLength={60} className="h-9" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="resp-telefono" className="text-xs">Teléfono</Label>
                    <Input id="resp-telefono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} maxLength={30} className="h-9" />
                  </div>
                </div>
                <Button size="sm" onClick={() => void addResponsable()} disabled={saving} className="h-8 w-full rounded-full">
                  Guardar
                </Button>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
      <button type="button" onClick={() => setDetailOpen(true)} className="shrink-0 rounded-full px-3 py-1.5 text-[13px] font-semibold text-primary transition-colors hover:bg-primary/10">
        Ver datos
      </button>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-2xl">
          <SheetHeader className="sr-only">
            <SheetTitle>Datos del paciente</SheetTitle>
          </SheetHeader>
          <div className="h-full p-4">
            <PatientDetailStep patient={patient} onContinue={() => setDetailOpen(false)} onBack={() => setDetailOpen(false)} onPatientUpdated={onPatientUpdated} />
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}
