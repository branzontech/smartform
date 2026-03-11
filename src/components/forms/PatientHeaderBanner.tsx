import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User, CreditCard, Calendar, Phone, Mail, FileText, Shield, Heart,
  MapPin, Building, Briefcase, IdCard, ChevronDown, ChevronUp,
} from "lucide-react";
import { differenceInYears, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  User, CreditCard, Calendar, Phone, Mail, FileText, Shield, Heart,
  MapPin, Building, Briefcase, IdCard,
};

interface HeaderFieldConfig {
  id: string;
  campo: string;
  etiqueta: string;
  fhir_path: string | null;
  fhir_element_type: string | null;
  orden: number;
  visible: boolean;
  grupo: string;
  formato: string;
  icono: string | null;
  pais: string[];
  fhir_extensions: any;
}

interface PatientHeaderBannerProps {
  pacienteId: string;
  pacienteData?: any;
}

const resolvePatientValue = (
  patient: any,
  campo: string,
  formato: string
): string | null => {
  if (campo === "nombre_completo") {
    return `${patient.nombres || ""} ${patient.apellidos || ""}`.trim() || null;
  }

  // Direct column lookup
  let value = patient[campo];

  // Fallback to fhir_extensions for extension-type fields
  if ((value === null || value === undefined) && patient.fhir_extensions) {
    const ext = typeof patient.fhir_extensions === "string"
      ? JSON.parse(patient.fhir_extensions)
      : patient.fhir_extensions;
    value = ext[campo] ?? ext?.custom_fields?.[campo] ?? null;
  }

  if (value === null || value === undefined || value === "") return null;

  return String(value);
};

const formatFieldValue = (
  rawValue: string | null,
  formato: string,
  patient: any
): React.ReactNode => {
  if (!rawValue) return <span className="text-muted-foreground/60 italic text-xs">—</span>;

  switch (formato) {
    case "age_from_date": {
      try {
        const birthDate = parseISO(rawValue);
        const age = differenceInYears(new Date(), birthDate);
        return (
          <Badge variant="secondary" className="font-medium text-xs">
            {age} años
          </Badge>
        );
      } catch {
        return rawValue;
      }
    }
    case "date": {
      try {
        return format(parseISO(rawValue), "d 'de' MMMM 'de' yyyy", { locale: es });
      } catch {
        return rawValue;
      }
    }
    case "document_with_type": {
      const tipo = patient?.tipo_documento || "CC";
      return `${tipo} ${rawValue}`;
    }
    case "phone":
      return rawValue;
    case "badge":
      return rawValue ? (
        <Badge variant="outline" className="text-xs font-normal">
          {rawValue}
        </Badge>
      ) : null;
    default:
      return rawValue;
  }
};

const shouldShowField = (field: HeaderFieldConfig, patientCountry: string | null): boolean => {
  if (!field.pais || field.pais.length === 0) return true;
  if (!patientCountry) return true; // show if we can't determine country
  return field.pais.includes(patientCountry);
};

export const PatientHeaderBanner: React.FC<PatientHeaderBannerProps> = ({
  pacienteId,
  pacienteData,
}) => {
  const [expanded, setExpanded] = useState(false);

  // Query 1: Config
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["configuracion-encabezado-paciente"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("configuracion_encabezado_paciente")
        .select("*")
        .eq("visible", true)
        .order("orden", { ascending: true });
      if (error) throw error;
      return (data || []) as HeaderFieldConfig[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Query 2: Patient data (skip if provided via props)
  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ["paciente", pacienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pacientes")
        .select("*")
        .eq("id", pacienteId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !pacienteData && !!pacienteId,
  });

  const patientRecord = pacienteData || patient;
  const isLoading = configLoading || (!pacienteData && patientLoading);

  if (isLoading) {
    return (
      <Card className="p-4 mb-4 border border-border/50 bg-card/80">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 grid grid-cols-4 gap-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </Card>
    );
  }

  if (!patientRecord || !config || config.length === 0) return null;

  // Determine patient country for filtering
  const patientCountry: string | null = null; // Could be derived from ciudad/estado if needed

  const visibleFields = config.filter((f) => shouldShowField(f, patientCountry));

  const principalFields = visibleFields.filter((f) => f.grupo === "principal");
  const secondaryFields = visibleFields.filter(
    (f) => f.grupo === "secundario" || f.grupo === "regulatorio"
  );

  const nameField = principalFields.find((f) => f.campo === "nombre_completo");
  const otherPrincipal = principalFields.filter((f) => f.campo !== "nombre_completo");

  const initials = `${(patientRecord.nombres || "?")[0]}${(patientRecord.apellidos || "?")[0]}`.toUpperCase();
  const fullName = resolvePatientValue(patientRecord, "nombre_completo", "text");

  return (
    <Card className="mb-4 border border-border/40 bg-gradient-to-r from-muted/30 to-card rounded-lg shadow-sm overflow-hidden">
      <div className="p-4">
        {/* Principal row */}
        <div className="flex items-center gap-4">
          <Avatar className="h-11 w-11 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* Name */}
            {fullName && (
              <p className="font-semibold text-base text-foreground truncate leading-tight">
                {fullName}
              </p>
            )}

            {/* Other principal fields */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
              {otherPrincipal.map((field) => {
                const raw = resolvePatientValue(patientRecord, field.campo, field.formato);
                const formatted = formatFieldValue(raw, field.formato, patientRecord);
                const IconComp = field.icono ? ICON_MAP[field.icono] : null;

                return (
                  <div key={field.id} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    {IconComp && <IconComp className="w-3.5 h-3.5 shrink-0" />}
                    <span className="text-foreground">{formatted}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expand toggle */}
          {secondaryFields.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="shrink-0 h-8 px-2 text-muted-foreground"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  <span className="text-xs">Menos</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  <span className="text-xs">Más</span>
                </>
              )}
            </Button>
          )}
        </div>

        {/* Secondary/Regulatory row (collapsible) */}
        {expanded && secondaryFields.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/30">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {secondaryFields.map((field) => {
                const raw = resolvePatientValue(patientRecord, field.campo, field.formato);
                const formatted = formatFieldValue(raw, field.formato, patientRecord);
                const IconComp = field.icono ? ICON_MAP[field.icono] : null;

                return (
                  <div key={field.id} className="flex items-center gap-1.5 text-sm">
                    {IconComp && <IconComp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                    <span className="text-muted-foreground text-xs">{field.etiqueta}:</span>
                    <span className="text-foreground">{formatted}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
