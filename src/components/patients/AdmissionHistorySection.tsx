import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Clock, Calendar, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Admission {
  id: string;
  estado: string;
  motivo: string | null;
  profesional_nombre: string | null;
  diagnostico_principal: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  tipo_admision?: { nombre: string } | null;
}

const estadoConfig: Record<string, { label: string; className: string }> = {
  en_curso: { label: "En curso", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  planificada: { label: "Planificada", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  completada: { label: "Completada", className: "bg-muted text-muted-foreground border-border" },
  cancelada: { label: "Cancelada", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

interface Props {
  patientId: string;
}

export const AdmissionHistorySection: React.FC<Props> = ({ patientId }) => {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("admisiones")
        .select("*, tipo_admision:tipos_admision(nombre)")
        .eq("paciente_id", patientId)
        .order("fecha_inicio", { ascending: false })
        .limit(10);
      setAdmissions((data as any[]) || []);
      setLoading(false);
    };
    fetch();
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Cargando historial…
      </div>
    );
  }

  if (admissions.length === 0) {
    return (
      <div className="py-3 text-center">
        <ClipboardList className="w-5 h-5 mx-auto text-muted-foreground/40 mb-1" />
        <p className="text-xs text-muted-foreground/60">Sin admisiones registradas</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {admissions.map((adm) => {
        const config = estadoConfig[adm.estado] || estadoConfig.completada;
        const fechaInicio = format(new Date(adm.fecha_inicio), "dd MMM yyyy", { locale: es });

        return (
          <div
            key={adm.id}
            className="flex items-start gap-3 py-2 group"
          >
            {/* Timeline dot */}
            <div className="mt-1.5 shrink-0">
              <div className={cn(
                "w-2 h-2 rounded-full",
                adm.estado === "en_curso" ? "bg-emerald-500" :
                adm.estado === "planificada" ? "bg-blue-500" :
                "bg-muted-foreground/30"
              )} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">
                  {adm.tipo_admision?.nombre || "Admisión"}
                </span>
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", config.className)}>
                  {config.label}
                </Badge>
              </div>
              {adm.motivo && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{adm.motivo}</p>
              )}
              <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground/70">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {fechaInicio}
                </span>
                {adm.profesional_nombre && (
                  <span>{adm.profesional_nombre}</span>
                )}
                {adm.diagnostico_principal && (
                  <span className="truncate max-w-[150px]">{adm.diagnostico_principal}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
