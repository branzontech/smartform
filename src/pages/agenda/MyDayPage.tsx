import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarCheck, ChevronLeft, ChevronRight, MapPin, Phone } from "lucide-react";
import { SurfaceCard } from "@/components/kit/surface";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ACTIVE_STATES, MODALITY_LABEL, addDays, fetchMyDay, formatLongDay, localTime, today, type Cita,
} from "@/components/agenda/agenda-api";
import { capitalizeFirst, errorMessage, isDay, mapsUrl } from "@/components/agenda/agenda-ui";
import { CitaActions } from "@/components/agenda/CitaActions";
import { StateText } from "@/components/agenda/StateText";

const CARD_SKELETONS = 3;
const linkClass = "rounded-sm font-medium text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

function CitaCard({ cita }: { cita: Cita }) {
  const details = [MODALITY_LABEL[cita.modalidad], cita.servicio].filter(Boolean).join(" · ");
  return (
    <SurfaceCard className="space-y-4 p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-[20px] font-semibold leading-none tabular-nums text-foreground">
            {localTime(cita.inicio)}
            <span className="ml-1.5 text-[13px] font-normal text-muted-foreground">a {localTime(cita.fin)}</span>
          </p>
          <Link to={`/app/citas/${cita.id}`} className="block truncate rounded-sm text-[16px] font-semibold text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
            {cita.paciente}
          </Link>
          <p className="text-[13.5px] text-muted-foreground">{details}</p>
        </div>
        <StateText state={cita.estado} className="shrink-0 pt-0.5" />
      </div>

      {(cita.modalidad === "domicilio" || cita.telefono) && (
        <div className="space-y-1.5 text-[14px]">
          {cita.modalidad === "domicilio" && (
            cita.direccion ? (
              <a href={mapsUrl(cita.direccion)} target="_blank" rel="noopener noreferrer" className={`flex w-fit items-start gap-1.5 ${linkClass}`}>
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {cita.direccion}
              </a>
            ) : (
              <p className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-4 w-4" aria-hidden />Sin dirección registrada</p>
            )
          )}
          {cita.telefono && (
            <a href={`tel:${cita.telefono}`} className={`flex w-fit items-center gap-1.5 tabular-nums ${linkClass}`}>
              <Phone className="h-4 w-4 shrink-0" aria-hidden />
              {cita.telefono}
            </a>
          )}
        </div>
      )}

      <CitaActions cita={cita} layout="stacked" />
    </SurfaceCard>
  );
}

/**
 * «Mi día» del profesional que inició sesión: sus citas del día en orden de
 * hora, con la siguiente acción a la mano. Pensada para celular (base de la app móvil).
 */
export default function MyDayPage() {
  const [params, setParams] = useSearchParams();
  const day = isDay(params.get("date")) ? (params.get("date") as string) : today();
  const query = useQuery({ queryKey: ["agenda", "mi-dia", day], queryFn: () => fetchMyDay(day) });

  const goTo = (next: string | null) => setParams(next && next !== today() ? { date: next } : {}, { replace: true });
  const citas = [...(query.data?.citas ?? [])].sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio));
  const pending = citas.filter((c) => ACTIVE_STATES.includes(c.estado)).length;
  const attended = citas.filter((c) => c.estado === "atendida").length;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 py-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Mi día</h1>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" aria-label="Día anterior" onClick={() => goTo(addDays(day, -1))} className="h-11 w-11 rounded-xl text-muted-foreground hover:text-foreground">
              <ChevronLeft />
            </Button>
            <Button variant="ghost" onClick={() => goTo(null)} disabled={day === today()} className="h-11 rounded-xl px-3 text-[13px] font-normal">Hoy</Button>
            <Button variant="ghost" size="icon" aria-label="Día siguiente" onClick={() => goTo(addDays(day, 1))} className="h-11 w-11 rounded-xl text-muted-foreground hover:text-foreground">
              <ChevronRight />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-[15px] font-semibold text-foreground">{capitalizeFirst(formatLongDay(day))}</p>
          {citas.length > 0 && (
            <p className="text-[13px] text-muted-foreground">
              {citas.length} {citas.length === 1 ? "cita" : "citas"} · {pending} por atender · {attended} {attended === 1 ? "atendida" : "atendidas"}
            </p>
          )}
        </div>
      </div>

      {query.isLoading ? (
        <div className="space-y-4" aria-hidden>
          {Array.from({ length: CARD_SKELETONS }, (_, i) => <Skeleton key={i} className="h-44 rounded-card" />)}
        </div>
      ) : query.isError ? (
        <p className="text-[13px] text-destructive">
          {errorMessage(query.error)}{" "}
          <button type="button" onClick={() => void query.refetch()} className="font-medium text-foreground hover:text-primary">Reintentar</button>
        </p>
      ) : citas.length === 0 ? (
        <SurfaceCard className="flex flex-col items-center gap-2 py-12 text-center">
          <CalendarCheck className="h-8 w-8 text-muted-foreground/60" aria-hidden />
          <p className="text-[15px] font-semibold text-foreground">No tienes citas para este día</p>
          <p className="max-w-sm text-[13px] text-muted-foreground">
            Aquí aparecen las citas asignadas a tu usuario como profesional.
          </p>
        </SurfaceCard>
      ) : (
        <ul className="space-y-4">
          {citas.map((c) => <li key={c.id}><CitaCard cita={c} /></li>)}
        </ul>
      )}
    </div>
  );
}
