import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  CATEGORY_LABEL, CITA_PRIORITY_LABEL, MODALITY_LABEL, REQUEST_CHANNEL_LABEL, fetchAppointmentTypes, today,
  type CitaPriority, type Modality, type RequestChannel, type TipoCita, type TipoCitaCategory,
} from "@/components/agenda/agenda-api";
import type { NeedData } from "./wizard-model";

const ALL_MODES: Modality[] = ["sede", "domicilio", "telemedicina"];
const NO_TYPE = "ninguno";
const DURATIONS = [15, 20, 30, 40, 45, 60, 90, 120];
const surface = "rounded-card bg-card p-5 shadow-card dark:border dark:border-border dark:shadow-none";

function groupByCategory(types: TipoCita[]): [TipoCitaCategory, TipoCita[]][] {
  const order = Object.keys(CATEGORY_LABEL) as TipoCitaCategory[];
  return order.map((cat) => [cat, types.filter((t) => t.categoria === cat)] as [TipoCitaCategory, TipoCita[]]).filter(([, list]) => list.length);
}

/** Paso «Qué necesita»: tipo de cita, modalidad, motivo y datos de la solicitud. */
export function NeedStep({ value, onChange }: { value: NeedData; onChange: (next: NeedData) => void }) {
  const types = useQuery({ queryKey: ["agenda", "tipos-cita", "activos"], queryFn: () => fetchAppointmentTypes(true), staleTime: 5 * 60_000 });
  const tipo = types.data?.find((t) => t.id === value.tipoCitaId) ?? null;
  const modes = tipo?.modalidades.length ? tipo.modalidades : ALL_MODES;
  const set = (patch: Partial<NeedData>) => onChange({ ...value, ...patch });

  // Si el tipo elegido no se atiende en la modalidad actual, toma la primera que sí.
  useEffect(() => {
    if (!modes.includes(value.modalidad)) set({ modalidad: modes[0] });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambiar el tipo
  }, [value.tipoCitaId, types.data]);

  const pickType = (id: string) => {
    const t = types.data?.find((x) => x.id === id);
    if (!t) set({ tipoCitaId: null, tipoCita: null, especialidad: null });
    else set({ tipoCitaId: t.id, tipoCita: t.nombre, duracionMin: t.duracionMin, especialidad: t.especialidad });
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <section className={cn(surface, "grid content-start gap-4")}>
        <h2 className="text-[15px] font-semibold">Qué necesita</h2>

        <div className="grid gap-1.5">
          <Label htmlFor="need-type">Tipo de cita</Label>
          <Select value={value.tipoCitaId ?? NO_TYPE} onValueChange={pickType}>
            <SelectTrigger id="need-type" className="h-10">
              <SelectValue placeholder={types.isLoading ? "Cargando…" : "Elige el tipo de cita"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_TYPE}>Sin tipo definido</SelectItem>
              {groupByCategory(types.data ?? []).map(([cat, list]) => (
                <SelectGroup key={cat}>
                  <SelectLabel className="text-xs font-medium text-muted-foreground">{CATEGORY_LABEL[cat]}</SelectLabel>
                  {list.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nombre}
                      {t.primeraVez === null ? "" : t.primeraVez ? " · primera vez" : " · control"}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          {tipo ? (
            <p className="text-xs text-muted-foreground">
              {[`${tipo.duracionMin} min`, tipo.especialidad, tipo.servicio, tipo.requiereAutorizacion && "requiere autorización"].filter(Boolean).join(" · ")}
            </p>
          ) : (
            !types.isLoading &&
            (types.data?.length ?? 0) === 0 && (
              <p className="text-xs text-muted-foreground">Aún no hay tipos de cita. Un administrador los crea en Configuración de la agenda.</p>
            )
          )}
        </div>

        <div className="grid gap-1.5">
          <Label>Modalidad</Label>
          <div role="radiogroup" aria-label="Modalidad" className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
            {ALL_MODES.map((m) => {
              const enabled = modes.includes(m);
              const selected = value.modalidad === m;
              return (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={!enabled}
                  onClick={() => set({ modalidad: m })}
                  className={cn(
                    "h-8 rounded-lg text-[13px] font-medium transition-all duration-200",
                    selected ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                    !enabled && "cursor-not-allowed opacity-40 hover:text-muted-foreground",
                  )}
                >
                  {MODALITY_LABEL[m]}
                </button>
              );
            })}
          </div>
        </div>

        {value.modalidad === "domicilio" && (
          <div className="grid gap-1.5">
            <Label htmlFor="need-address">Dirección del domicilio</Label>
            <Input id="need-address" value={value.direccion} onChange={(e) => set({ direccion: e.target.value })} maxLength={300} className="h-10" />
          </div>
        )}
        {value.modalidad === "telemedicina" && (
          <div className="grid gap-1.5">
            <Label htmlFor="need-link">Enlace de la videollamada (opcional)</Label>
            <Input
              id="need-link"
              type="url"
              placeholder="https://"
              value={value.enlaceTelemedicina}
              onChange={(e) => set({ enlaceTelemedicina: e.target.value })}
              maxLength={500}
              className="h-10"
            />
          </div>
        )}

        <div className="grid gap-1.5">
          <Label htmlFor="need-motive">Motivo</Label>
          <Textarea
            id="need-motive"
            rows={3}
            value={value.motivo}
            onChange={(e) => set({ motivo: e.target.value })}
            maxLength={1000}
            placeholder="Por qué necesita la cita"
            className="resize-y"
          />
        </div>
      </section>

      <section className={cn(surface, "grid content-start gap-4")}>
        <h2 className="text-[15px] font-semibold">La solicitud</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="need-priority">Prioridad</Label>
            <Select value={value.prioridad} onValueChange={(v) => set({ prioridad: v as CitaPriority })}>
              <SelectTrigger id="need-priority" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CITA_PRIORITY_LABEL) as CitaPriority[]).map((p) => (
                  <SelectItem key={p} value={p}>{CITA_PRIORITY_LABEL[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="need-channel">Cómo la pidió</Label>
            <Select value={value.formaSolicitud ?? undefined} onValueChange={(v) => set({ formaSolicitud: v as RequestChannel })}>
              <SelectTrigger id="need-channel" className="h-10">
                <SelectValue placeholder="Elige el canal" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(REQUEST_CHANNEL_LABEL) as RequestChannel[]).map((ch) => (
                  <SelectItem key={ch} value={ch}>{REQUEST_CHANNEL_LABEL[ch]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="need-wanted">Fecha que desea</Label>
            <Input
              id="need-wanted"
              type="date"
              min={today()}
              value={value.fechaDeseada ?? ""}
              onChange={(e) => set({ fechaDeseada: e.target.value || null })}
              className="h-10"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="need-duration">Duración</Label>
            <Select value={String(value.duracionMin)} onValueChange={(v) => set({ duracionMin: Number(v) })}>
              <SelectTrigger id="need-duration" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[...new Set([...DURATIONS, value.duracionMin])]
                  .sort((a, b) => a - b)
                  .map((d) => (
                    <SelectItem key={d} value={String(d)}>{d} minutos</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">La fecha que desea es opcional; con ella se mide la oportunidad de la atención.</p>
      </section>
    </div>
  );
}
