import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, ChevronDown, ExternalLink } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { StateText } from "@/components/agenda/StateText";
import { localTime } from "@/components/agenda/agenda-api";
import { professionalColor } from "@/components/agenda/agenda-ui";
import { cn } from "@/lib/utils";
import { formatDistance, formatDuration, type ProfesionalDia } from "./rutas-api";
import { RouteIcon3D } from "./MapMarker";
import { firstName, googleMapsLinks, isDone, isLocatedStop, pointOf, proStatus, signalAgo, type StatusTone } from "./route-day-model";

const TONE_TEXT: Record<StatusTone, string> = {
  success: "text-[hsl(var(--success))]",
  info: "text-[hsl(var(--info))]",
  warning: "text-[hsl(var(--warning))]",
  neutral: "text-muted-foreground",
};

function NumberBadge({ n, color, done }: { n: number; color: string; done?: boolean }) {
  return done ? (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--success))] text-white">
      <Check className="h-3.5 w-3.5" strokeWidth={3} />
    </span>
  ) : (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: color }}>
      {n}
    </span>
  );
}

/** Lista de profesionales del día: estado, avance y próxima visita. */
export function ProList({ pros, now, onSelect }: { pros: ProfesionalDia[]; now: Date; onSelect: (id: string) => void }) {
  return (
    <ul className="space-y-2 p-3">
      {pros.map((p, i) => {
        const status = proStatus(p, now);
        const color = professionalColor(p.color);
        const nextIndex = p.paradas.findIndex((s) => !isDone(s));
        const next = nextIndex >= 0 ? p.paradas[nextIndex] : null;
        const signal = p.ruta?.estado === "en_curso" ? signalAgo(p.ruta.posicionAt, now) : null;
        return (
          <li key={p.profesionalId} className="animate-in fade-in slide-in-from-bottom-1" style={{ animationDelay: `${Math.min(i, 8) * 30}ms`, animationFillMode: "backwards" }}>
            <button
              type="button"
              onClick={() => onSelect(p.profesionalId)}
              className="group w-full rounded-2xl bg-background p-3 text-left transition hover:bg-muted/60 active:scale-[.99]"
            >
              <span className="flex items-center gap-3">
                <UserAvatar seed={p.profesional} alt={p.profesional} className="h-10 w-10 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-foreground">{p.profesional}</span>
                  <span className={cn("block truncate text-[13px] font-medium", TONE_TEXT[status.tone])}>{status.text}</span>
                </span>
                <span className="shrink-0 text-right text-[12.5px] tabular-nums text-muted-foreground">
                  {p.resueltas} de {p.paradas.length}
                  <span className="block">{signal ? `señal ${signal}` : "visitas"}</span>
                </span>
              </span>
              {next && (
                <span className="mt-2.5 flex items-center gap-2.5 border-t border-border/70 pt-2.5 text-[13px]">
                  <NumberBadge n={nextIndex + 1} color={color} />
                  <span className="min-w-0 flex-1 truncate text-foreground">{next.paciente}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{localTime(next.inicio)}</span>
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

interface ItineraryProps {
  pro: ProfesionalDia;
  now: Date;
  activeStopId: string | null;
  onActivateStop: (id: string | null) => void;
  onBack: () => void;
}

/** Ruta de un profesional: la tarjeta oscura del resumen y el itinerario, como en el software de rutas. */
export function Itinerary({ pro, now, activeStopId, onActivateStop, onBack }: ItineraryProps) {
  const color = professionalColor(pro.color);
  const status = proStatus(pro, now);
  const next = pro.paradas.find((s) => !isDone(s)) ?? null;
  const legs = new Map((pro.ruta?.tramos ?? []).map((t) => [t.citaId, t]));
  const position = pro.ruta?.posicionLatitud != null && pro.ruta.posicionLongitud != null ? { lat: Number(pro.ruta.posicionLatitud), lng: Number(pro.ruta.posicionLongitud) } : null;
  const signal = signalAgo(pro.ruta?.posicionAt ?? null, now);
  const pendingStops = pro.paradas.filter((s) => !isDone(s) && isLocatedStop(s));
  const links = googleMapsLinks(position, pendingStops.map(pointOf));
  const totals = [
    `${pro.paradas.length} ${pro.paradas.length === 1 ? "visita" : "visitas"}`,
    `${pro.resueltas} ${pro.resueltas === 1 ? "resuelta" : "resueltas"}`,
    ...(pro.ruta?.distanciaM ? [formatDistance(pro.ruta.distanciaM), `${formatDuration(pro.ruta.duracionS)} de trayecto`] : []),
  ].join(" · ");

  return (
    <div className="flex h-full min-h-0 flex-col animate-in fade-in slide-in-from-left-2">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-3">
        <button type="button" onClick={onBack} className="-ml-2 flex min-h-10 items-center gap-2 rounded-xl px-2 text-[13px] font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Todos los profesionales
        </button>
        <div className="mt-1 flex items-center gap-3">
          <UserAvatar seed={pro.profesional} alt={pro.profesional} className="h-11 w-11 shrink-0" />
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold text-foreground">{pro.profesional}</h2>
            <p className={cn("truncate text-[13px] font-medium", TONE_TEXT[status.tone])}>{status.text}</p>
          </div>
        </div>

        <div className="relative mt-4 rounded-3xl bg-[#141414] p-5 text-white">
          <span className="absolute right-4 top-4">
            <RouteIcon3D name="carro" size={60} />
          </span>
          <p className="text-[13px] text-white/60">
            {next?.estado === "en_atencion" ? "En atención · cita de las" : next?.estado === "en_camino" ? "Va en camino · cita de las" : next ? "Próxima visita" : pro.ruta?.terminadaAt ? "Terminó a las" : "Visitas del día"}
          </p>
          <p className="text-4xl font-bold tabular-nums text-lime">
            {next ? localTime(next.inicio) : pro.ruta?.terminadaAt ? localTime(pro.ruta.terminadaAt) : "Listas"}
          </p>
          {next && <p className="mt-1 truncate pr-16 text-[15px] font-semibold">{firstName(next.paciente)}</p>}
          <p className="mt-3 text-[14px]">{totals}</p>
          <p className="mt-1 text-[13px] text-white/70">
            {pro.ruta?.estado === "en_curso" ? (signal ? `Última señal ${signal}` : "Sin señal de ubicación todavía") : pro.ruta ? "Ruta cerrada" : "Aún no ha iniciado la ruta en la app"}
          </p>
        </div>

        <h3 className="mt-6 text-[15px] font-bold text-foreground">Itinerario</h3>
        <ol className="mt-2">
          {pro.ruta && (
            <li className="flex gap-3 py-2">
              <span className="w-[54px] shrink-0 pt-0.5 text-right text-[13px] font-bold tabular-nums">{localTime(pro.ruta.iniciadaAt)}</span>
              <span className="flex w-6 shrink-0 justify-center">
                <span className="mt-1 h-4 w-4 rounded-full border-[3px] border-[#12b886] bg-white" />
              </span>
              <span className="text-[14px] font-semibold text-foreground">Inició la ruta</span>
            </li>
          )}
          {pro.paradas.map((s, i) => {
            const leg = legs.get(s.id);
            const active = s.id === activeStopId;
            const done = isDone(s);
            return (
              <li key={s.id}>
                {(pro.ruta || i > 0) && (
                  <div className="flex gap-3">
                    <span className="w-[54px] shrink-0" />
                    <span className="flex w-6 shrink-0 justify-center">
                      <span className="w-px rounded-full" style={{ background: done ? "hsl(var(--border))" : color }} />
                    </span>
                    <span className="py-2 text-[12.5px] text-muted-foreground">{leg ? `${formatDuration(leg.segundos)} · ${formatDistance(leg.metros)}` : " "}</span>
                  </div>
                )}
                <div className={cn("group flex w-full items-start gap-3 rounded-2xl py-2 pr-2 transition", active ? "bg-lime/25" : "hover:bg-muted/60")}>
                  <button type="button" onClick={() => onActivateStop(active ? null : s.id)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                    <span className="w-[54px] shrink-0 pt-0.5 text-right text-[13px] font-bold tabular-nums">{localTime(s.inicio)}</span>
                    <NumberBadge n={i + 1} color={color} done={done} />
                    <span className={cn("min-w-0 flex-1", done && "opacity-60")}>
                      <span className="block truncate text-[14.5px] font-semibold leading-snug text-foreground">{s.paciente}</span>
                      <span className="block truncate text-[12.5px] text-muted-foreground">{s.direccion ?? "Sin dirección"}</span>
                      <StateText state={s.estado} className="text-[12.5px]" />
                      {!isLocatedStop(s) && <span className="block text-[12.5px] text-[hsl(var(--warning))]">No está en el mapa: revisa la dirección</span>}
                    </span>
                  </button>
                  <Link to={`/app/citas/${s.id}`} className="shrink-0 rounded-lg px-2 py-1 text-[12.5px] font-semibold text-primary opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100">
                    Ver cita
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {links.length > 0 && (
        <div className="shrink-0 border-t border-border bg-card px-4 pb-4 pt-3">
          <OpenInGoogleMaps links={links} stops={pendingStops.length} />
        </div>
      )}
    </div>
  );
}

/** Google Maps abre máximo 10 paradas por enlace: con más, un botón despliega las partes (como en el software de rutas). */
function OpenInGoogleMaps({ links, stops }: { links: string[]; stops: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  const button = "flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#141414] px-4 text-[14px] font-semibold text-white transition hover:bg-black active:scale-[.98]";
  if (links.length === 1) {
    return (
      <a href={links[0]} target="_blank" rel="noreferrer" className={button}>
        <ExternalLink className="h-4 w-4" /> Abrir pendientes en Google Maps
      </a>
    );
  }
  const range = (i: number) => {
    const from = i * 10 + 1;
    const to = Math.min(stops, (i + 1) * 10);
    return from === to ? `Visita ${from}` : `Visitas ${from} a ${to}`;
  };
  return (
    <div ref={ref} className="relative">
      {open && (
        <div className="absolute inset-x-0 bottom-full mb-2 overflow-hidden rounded-2xl border border-border bg-card py-1.5 shadow-[0_8px_28px_rgb(20_20_20/0.14)] animate-in fade-in slide-in-from-bottom-1">
          <p className="px-4 pb-1 pt-1.5 text-xs text-muted-foreground">Google Maps abre hasta 10 paradas a la vez</p>
          {links.map((url, i) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" onClick={() => setOpen(false)} className="flex min-h-10 items-center justify-between gap-3 px-4 text-[13.5px] font-semibold hover:bg-muted">
              {range(i)}
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          ))}
        </div>
      )}
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={button}>
        <ExternalLink className="h-4 w-4" /> Abrir pendientes en Google Maps
        <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
      </button>
    </div>
  );
}
