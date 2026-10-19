import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import { SurfaceCard } from "@/components/kit/surface";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CITA_PRIORITY_LABEL, MODALITY_LABEL, REQUEST_CHANNEL_LABEL, fetchCita, formatLongDay, formatShortDay, localDay, localTime, type Cita,
} from "@/components/agenda/agenda-api";
import { capitalizeFirst, errorMessage, mapsUrl } from "@/components/agenda/agenda-ui";
import { CitaActions } from "@/components/agenda/CitaActions";
import { CitaTimeline } from "@/components/agenda/CitaTimeline";
import { StateText } from "@/components/agenda/StateText";

const linkClass = "font-medium text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-sm";

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-[12.5px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words text-[14px] text-foreground">{children}</dd>
    </div>
  );
}

/** Cómo y cuándo la pidió el paciente, en una línea. */
function requestOf(cita: Cita): string | null {
  const parts = [
    cita.formaSolicitud ? REQUEST_CHANNEL_LABEL[cita.formaSolicitud] : null,
    cita.fechaDeseada ? `deseaba el ${formatShortDay(cita.fechaDeseada)}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

function BackLink() {
  return (
    <Link to="/app/citas" className="inline-flex items-center gap-1.5 rounded-lg text-[13px] text-muted-foreground transition-colors hover:text-foreground">
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Agenda
    </Link>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-5" aria-hidden>
      <Skeleton className="h-8 w-72 rounded-lg" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Skeleton className="h-80 rounded-card" />
        <Skeleton className="h-80 rounded-card" />
      </div>
    </div>
  );
}

/** Detalle de una cita: datos, acciones según su estado y bitácora. */
export default function CitaDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const query = useQuery({ queryKey: ["agenda", "cita", id], queryFn: () => fetchCita(id), enabled: !!id });
  const cita = query.data;

  if (query.isLoading) {
    return <div className="mx-auto max-w-6xl space-y-5 py-6"><BackLink /><DetailSkeleton /></div>;
  }
  if (query.isError || !cita) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 py-6">
        <BackLink />
        <p className="text-[13px] text-destructive">{query.isError ? errorMessage(query.error) : "No se encontró la cita."}</p>
      </div>
    );
  }

  const day = localDay(cita.inicio);
  const document = cita.documento ? `${cita.tipoDocumento ?? ""} ${cita.documento}`.trim() : null;

  return (
    <div className="mx-auto max-w-6xl space-y-5 py-6">
      <BackLink />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{cita.paciente}</h1>
          <p className="text-[14px] text-muted-foreground">
            {capitalizeFirst(formatLongDay(day))}, {localTime(cita.inicio)} – {localTime(cita.fin)} · <StateText state={cita.estado} />
          </p>
        </div>
        <CitaActions cita={cita} />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <SurfaceCard title="Cita">
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <Field label="Fecha">{capitalizeFirst(formatLongDay(day))}</Field>
              <Field label="Hora"><span className="tabular-nums">{localTime(cita.inicio)} – {localTime(cita.fin)}</span></Field>
              <Field label="Profesional">{cita.profesional}</Field>
              <Field label="Modalidad">{MODALITY_LABEL[cita.modalidad]}</Field>
              <Field label="Tipo de cita">{cita.tipoCita ?? "Sin tipo definido"}</Field>
              <Field label="Prioridad">{CITA_PRIORITY_LABEL[cita.prioridad]}</Field>
              {requestOf(cita) && <Field label="Solicitud">{requestOf(cita)}</Field>}
              {cita.llegadaAt && <Field label="Llegada"><span className="tabular-nums">{localTime(cita.llegadaAt)}</span></Field>}
              {cita.modalidad === "telemedicina" && (
                <Field label="Videollamada" wide>
                  {cita.enlaceTelemedicina ? (
                    <a href={cita.enlaceTelemedicina} target="_blank" rel="noopener noreferrer" className={linkClass}>Abrir el enlace</a>
                  ) : "Enlace pendiente"}
                </Field>
              )}
              {cita.modalidad === "domicilio" && (
                <Field label="Dirección" wide>
                  {cita.direccion ? (
                    <a href={mapsUrl(cita.direccion)} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 ${linkClass}`}>
                      <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                      {cita.direccion}
                    </a>
                  ) : "Sin dirección registrada"}
                </Field>
              )}
              {cita.sede && <Field label="Sede">{cita.sede}</Field>}
              <Field label="Servicio">{cita.servicio ? `${cita.servicioCodigo ? `${cita.servicioCodigo} · ` : ""}${cita.servicio}` : "—"}</Field>
              <Field label="Convenio">{cita.convenio ?? "—"}</Field>
              {cita.admisionId && (cita.estado === "en_atencion" || cita.estado === "atendida") && (
                <Field label="Atención">
                  <Link to={`/app/pacientes/${cita.pacienteId}?tab=atenciones&cita=${cita.id}`} className={linkClass}>Ver lo registrado</Link>
                </Field>
              )}
              {cita.motivo && <Field label="Motivo de la consulta" wide>{cita.motivo}</Field>}
              {cita.instrucciones && <Field label="Indicaciones para el paciente" wide><span className="whitespace-pre-line">{cita.instrucciones}</span></Field>}
              {cita.notas && <Field label="Notas" wide><span className="whitespace-pre-line">{cita.notas}</span></Field>}
              {cita.motivoCancelacion && <Field label="Motivo de cancelación" wide>{cita.motivoCancelacion}</Field>}
              {cita.reprogramadaDesde && (
                <Field label="Reprogramada desde" wide>
                  <Link to={`/app/citas/${cita.reprogramadaDesde}`} className={linkClass}>Ver la cita anterior</Link>
                </Field>
              )}
            </dl>
          </SurfaceCard>

          <SurfaceCard title="Paciente">
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <Field label="Nombre">
                <Link to={`/app/pacientes/${cita.pacienteId}`} className={linkClass}>{cita.paciente}</Link>
              </Field>
              <Field label="Documento"><span className="tabular-nums">{document ?? "—"}</span></Field>
              <Field label="Teléfono">
                {cita.telefono ? <a href={`tel:${cita.telefono}`} className={`tabular-nums ${linkClass}`}>{cita.telefono}</a> : "—"}
              </Field>
              {cita.responsable && (
                <Field label="Responsable">
                  {cita.responsable.nombre}
                  {cita.responsable.parentesco ? ` · ${cita.responsable.parentesco}` : ""}
                  {cita.responsable.telefono && (
                    <>
                      {" · "}
                      <a href={`tel:${cita.responsable.telefono}`} className={`tabular-nums ${linkClass}`}>{cita.responsable.telefono}</a>
                    </>
                  )}
                </Field>
              )}
            </dl>
          </SurfaceCard>
        </div>

        <SurfaceCard title="Bitácora" subtitle="Cada cambio de la cita, con quién y cuándo">
          <CitaTimeline events={cita.eventos} />
        </SurfaceCard>
      </div>
    </div>
  );
}
