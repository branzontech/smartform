import type { ReactNode } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useCountry } from "@/config/country";
import { capitalizeFirst } from "@/components/agenda/agenda-ui";
import { formatShortDay, localDay, localTime, type Cita } from "@/components/agenda/agenda-api";
import type { EditablePatientRow } from "@/components/patients/PatientEditForm";
import { cn } from "@/lib/utils";
import type { ClinicalSnapshot } from "./clinical-snapshot";

/** Color del estado de un signo: solo en el texto, nunca en puntos ni barras. */
const TONE_TEXT = { ok: "text-[hsl(var(--success))]", warn: "text-[hsl(var(--warning))]", bad: "text-destructive" } as const;

export const fullName = (p: EditablePatientRow) => `${p.nombres ?? ""} ${p.apellidos ?? ""}`.trim();

export function ageOf(birth?: string | null): number | null {
  if (!birth) return null;
  const b = new Date(birth);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - b.getFullYear();
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) years--;
  return years;
}

function Item({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={cn("min-w-0", wide && "col-span-2")}>
      <dt className="text-[12px] text-muted-foreground">{label}</dt>
      <dd className="mt-px break-words text-[13.5px] text-foreground">{children}</dd>
    </div>
  );
}

function Block({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[12.5px] font-semibold text-muted-foreground">{title}</h2>
        {aside && <span className="text-[12px] text-muted-foreground/70">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

interface PatientRailProps {
  patient: EditablePatientRow;
  snapshot: ClinicalSnapshot;
  next: Cita | null;
  collapsed: boolean;
  onToggle: () => void;
  onOpenProfile: () => void;
}

/**
 * Lo esencial del paciente, siempre a la vista (como el Storyboard de Epic o el
 * perfil clínico de Elation): identificación, alertas, diagnósticos, últimos
 * signos y próxima cita. Se pliega para dar espacio a la historia.
 */
export function PatientRail({ patient: p, snapshot, next, collapsed, onToggle, onOpenProfile }: PatientRailProps) {
  const { format: fmt } = useCountry();
  const name = fullName(p);
  const age = ageOf(p.fecha_nacimiento);
  const avatar = <UserAvatar seed={p.id} alt={name} className={collapsed ? "h-10 w-10" : "h-11 w-11 shrink-0"} />;

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        {avatar}
        <button type="button" onClick={onToggle} aria-label="Mostrar datos del paciente" title="Mostrar datos del paciente" className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const allergies = snapshot.allergies;
  return (
    <div className="flex h-full flex-col gap-[18px] overflow-y-auto p-[18px] [scrollbar-width:thin]">
      <div className="flex items-start gap-3">
        {avatar}
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold leading-snug text-foreground">{name}</h1>
          <p className="text-[13px] text-muted-foreground">{[p.genero, age !== null ? `${age} años` : null].filter(Boolean).join(" · ")}</p>
        </div>
        <button type="button" onClick={onToggle} aria-label="Ocultar datos del paciente" title="Ocultar datos del paciente" className="-mr-1.5 -mt-1 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5">
        <Item label="Documento"><span className="tabular-nums">{`${p.tipo_documento ?? ""} ${p.numero_documento ?? ""}`.trim() || "—"}</span></Item>
        <Item label="Régimen">{fmt.insuranceRegimeLabel(p.regimen) || "—"}</Item>
        <Item label="Teléfono">
          {p.telefono_principal ? <a href={`tel:${p.telefono_principal}`} className="tabular-nums text-primary hover:text-primary/80">{p.telefono_principal}</a> : "—"}
        </Item>
        <Item label="Historia"><span className="tabular-nums">{p.numero_historia || "—"}</span></Item>
        {(p.direccion || p.ciudad) && <Item label="Dirección" wide>{[p.direccion, p.ciudad].filter(Boolean).join(", ")}</Item>}
      </dl>

      <Block title="Alergias" aside={allergies ? format(allergies.at, "d MMM", { locale: es }) : undefined}>
        <p className={cn("text-[13.5px]", allergies?.status === "Sí" ? "font-semibold text-destructive" : "text-foreground")}>
          {!allergies ? <span className="text-muted-foreground">Sin registro</span> : allergies.status === "Sí" ? allergies.detail ?? "Sí, sin detalle" : allergies.status}
        </p>
      </Block>

      <Block title="Diagnósticos recientes">
        {snapshot.diagnoses.length === 0 ? (
          <p className="text-[13.5px] text-muted-foreground">Sin diagnósticos registrados</p>
        ) : (
          snapshot.diagnoses.map((d) => (
            <p key={d.code} className="text-[13.5px] leading-snug text-foreground">
              <span className="font-semibold tabular-nums">{d.code}</span> {d.name}
            </p>
          ))
        )}
      </Block>

      <Block title="Últimos signos" aside={snapshot.vitals ? format(snapshot.vitals.at, "d MMM", { locale: es }) : undefined}>
        {!snapshot.vitals ? (
          <p className="text-[13.5px] text-muted-foreground">Sin signos registrados</p>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {snapshot.vitals.readings.map((v) => (
              <div key={v.key} className="rounded-xl bg-canvas px-2.5 py-2">
                <div className="text-[11.5px] text-muted-foreground">{v.label}</div>
                <div className="text-base font-semibold tabular-nums text-foreground">
                  {v.value} <span className="text-[11px] font-normal text-muted-foreground">{v.unit}</span>
                </div>
                {v.state && <div className={cn("text-[11.5px] font-semibold", TONE_TEXT[v.state.tone])}>{v.state.label}</div>}
              </div>
            ))}
          </div>
        )}
      </Block>

      <Block title="Próxima cita">
        {next ? (
          <>
            <p className="text-[13.5px] text-foreground">{capitalizeFirst(formatShortDay(localDay(next.inicio)))} · {localTime(next.inicio)}</p>
            <p className="text-[13px] text-muted-foreground">{next.servicio ?? next.profesional}</p>
          </>
        ) : (
          <p className="text-[13.5px] text-muted-foreground">Ninguna programada</p>
        )}
      </Block>

      <button type="button" onClick={onOpenProfile} className="mt-auto flex h-9 w-full items-center justify-between rounded-xl bg-canvas px-3 text-[13px] text-foreground transition-colors hover:bg-muted active:scale-[.98]">
        Ficha completa y edición
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}
