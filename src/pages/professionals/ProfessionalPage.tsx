import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { fetchProfessional, PRO_TYPE_LABEL, type ProfessionalDetail } from "@/components/agenda/agenda-api";
import { professionalKeys } from "@/components/professionals/professional-form";
import { ProfileSection } from "@/components/professionals/ProfileSection";
import { ScheduleSection } from "@/components/professionals/ScheduleSection";
import { UnavailabilitySection } from "@/components/professionals/UnavailabilitySection";
import { UpcomingAppointmentsSection } from "@/components/professionals/UpcomingAppointmentsSection";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

const LIST_PATH = "/app/profesionales";

/*
 * Las secciones editables se montan con una clave sacada de los datos del
 * servidor: al guardar (o si otra persona cambió algo) se reinician con lo
 * nuevo, pero una recarga con los mismos datos no borra lo que se está editando.
 */
const profileKey = (p: ProfessionalDetail) =>
  JSON.stringify([p.tipo, p.especialidad, p.registroProfesional, p.modalidades, p.duracionCitaMin, p.color, p.activo]);
const scheduleKey = (p: ProfessionalDetail) =>
  JSON.stringify(p.horario.map((b) => [b.diaSemana, b.horaInicio, b.horaFin, b.modalidad, b.sedeId]));

const ProfessionalPage = () => {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canEdit = hasRole("admin");
  const { data: professional, isLoading, error } = useQuery({
    queryKey: professionalKeys.detail(id),
    queryFn: () => fetchProfessional(id),
    enabled: !!id,
  });

  const header = (title: string, subtitle?: string) => (
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Volver a profesionales"
        onClick={() => navigate(LIST_PATH)}
        className="h-9 w-9 shrink-0 rounded-full text-muted-foreground"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden />
      </Button>
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold">{title}</h1>
        {subtitle && <p className="truncate text-[13px] text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-5xl gap-4 py-6" aria-busy="true">
        <Skeleton className="h-9 w-72" />
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-card" />)}
      </div>
    );
  }

  if (error || !professional) {
    return (
      <div className="mx-auto grid max-w-5xl gap-4 py-6">
        {header("Profesional")}
        <p className="py-12 text-center text-sm text-destructive">
          No se pudo cargar el profesional{error ? `: ${(error as Error).message}` : "."}
        </p>
      </div>
    );
  }

  const subtitle = [PRO_TYPE_LABEL[professional.tipo] ?? professional.tipo, professional.especialidad, professional.activo ? null : "Inactivo"]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto grid max-w-5xl gap-4 py-6">
      {header(professional.nombre, subtitle)}
      <ProfileSection key={profileKey(professional)} professional={professional} canEdit={canEdit} />
      <ScheduleSection key={scheduleKey(professional)} professional={professional} canEdit={canEdit} />
      <UnavailabilitySection professional={professional} canEdit={canEdit} />
      <UpcomingAppointmentsSection professionalId={professional.id} />
    </div>
  );
};

export default ProfessionalPage;
