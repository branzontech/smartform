import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { STATE_LABEL, formatShortDay, localDay, localTime, type CitaEvent } from "./agenda-api";
import { capitalizeFirst, coordsUrl } from "./agenda-ui";

const textOf = (detalle: Record<string, unknown>, key: string) => {
  const v = detalle[key];
  return typeof v === "string" && v.trim() ? v.trim() : null;
};

function describe(e: CitaEvent): string {
  if (e.evento === "creada") return textOf(e.detalle, "reprogramadaDesde") ? "Creó la cita al reprogramar la anterior" : "Creó la cita";
  if (e.evento === "reprogramada") return "Reprogramó la cita";
  if (e.evento === "actualizada") return "Actualizó los datos de la cita";
  if (e.estadoAnterior && e.estadoNuevo) return `Cambió de ${STATE_LABEL[e.estadoAnterior]} a ${STATE_LABEL[e.estadoNuevo]}`;
  return e.estadoNuevo ? `Marcó ${STATE_LABEL[e.estadoNuevo]}` : "Cambió el estado";
}

/** Bitácora de la cita: quién hizo qué y cuándo, con motivo y ubicación si la hay. */
export function CitaTimeline({ events }: { events: CitaEvent[] }) {
  if (events.length === 0) return <p className="text-[13px] text-muted-foreground">Sin movimientos registrados.</p>;
  const ordered = [...events].sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha));

  return (
    <ol className="divide-y divide-border/60">
      {ordered.map((e) => {
        const reason = textOf(e.detalle, "motivo");
        const newCita = textOf(e.detalle, "nuevaCita");
        const previous = textOf(e.detalle, "reprogramadaDesde");
        const location = e.latitud !== null && e.longitud !== null ? coordsUrl(e.latitud, e.longitud) : null;
        return (
          <li key={e.id} className="space-y-0.5 py-3 first:pt-0 last:pb-0">
            <p className="text-[13.5px] font-medium text-foreground">{describe(e)}</p>
            <p className="text-[12.5px] text-muted-foreground">
              {capitalizeFirst(formatShortDay(localDay(e.fecha)))}, {localTime(e.fecha)} · {e.actor}
            </p>
            {reason && <p className="text-[13px] text-foreground/80">Motivo: {reason}</p>}
            {newCita && (
              <Link to={`/app/citas/${newCita}`} className="inline-block text-[13px] font-medium text-primary hover:text-primary/80">Ver la nueva cita</Link>
            )}
            {previous && (
              <Link to={`/app/citas/${previous}`} className="inline-block text-[13px] font-medium text-primary hover:text-primary/80">Ver la cita anterior</Link>
            )}
            {location && (
              <a
                href={location}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-fit items-center gap-1 text-[13px] font-medium text-primary hover:text-primary/80"
              >
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                Ubicación registrada
              </a>
            )}
          </li>
        );
      })}
    </ol>
  );
}
