import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/data/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User, CreditCard, Calendar, Phone, Mail, FileText, Shield, Heart,
  MapPin, Building, Briefcase, IdCard, ChevronDown, ChevronUp, Users,
  Clock, Hash,
} from "lucide-react";
import { differenceInYears, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ICON_MAP: Record<string, React.ElementType> = {
  User, CreditCard, Calendar, Phone, Mail, FileText, Shield, Heart,
  MapPin, Building, Briefcase, IdCard, Users, Clock, Hash,
};

const GENDER_LABELS: Record<string, string> = {
  male: "Masculino",
  female: "Femenino",
  other: "Otro",
  unknown: "No especificado",
};

interface PatientHeaderBannerProps {
  pacienteId: string;
  pacienteData?: any;
  admisionId?: string;
  admisionData?: any;
  /** Dentro de la barra superior de la consulta: sin caja ni margen propios. */
  inline?: boolean;
}

export const PatientHeaderBanner: React.FC<PatientHeaderBannerProps> = ({
  pacienteId,
  pacienteData,
  admisionId,
  admisionData,
  inline = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ["paciente", pacienteId],
    queryFn: async () => {
      const { data, error } = await db
        .from("pacientes")
        .select("*")
        .eq("id", pacienteId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !pacienteData && !!pacienteId,
  });

  const { data: admision, isLoading: admisionLoading } = useQuery({
    queryKey: ["admision", admisionId],
    queryFn: async () => {
      const { data, error } = await db
        .from("admisiones")
        .select("*")
        .eq("id", admisionId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !admisionData && !!admisionId,
  });



  const p = pacienteData || patient;
  const a = admisionData || admision;
  const isLoading = (!pacienteData && patientLoading);

  if (isLoading) {
    return (
      <div className="mb-3 bg-muted/30 border border-border/40 rounded-md px-4 py-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    );
  }

  if (!p) return null;

  const fullName = `${p.nombres || ""} ${p.apellidos || ""}`.trim();
  const initials = `${(p.nombres || "?")[0]}${(p.apellidos || "?")[0]}`.toUpperCase();
  const docDisplay = `${p.tipo_documento || "CC"} ${p.numero_documento || ""}`;
  
  // Age + birth date
  let ageDisplay = "";
  if (p.fecha_nacimiento) {
    try {
      const birth = parseISO(p.fecha_nacimiento);
      const age = differenceInYears(new Date(), birth);
      ageDisplay = `${age} años (${format(birth, "dd/MM/yyyy")})`;
    } catch {
      ageDisplay = p.fecha_nacimiento;
    }
  }

  // Gender
  const genderDisplay = p.genero ? (GENDER_LABELS[p.genero] || p.genero) : "";

  // Admission data
  const numeroIngreso = a?.numero_ingreso || "";
  let fechaIngreso = "";
  if (a?.fecha_inicio) {
    try {
      fechaIngreso = format(parseISO(a.fecha_inicio), "dd/MM/yyyy HH:mm");
    } catch {
      fechaIngreso = a.fecha_inicio;
    }
  }

  // Collapsed row items
  const collapsedItems = [
    { id: "documento", value: docDisplay },
    { id: "edad", value: ageDisplay },
    { id: "genero", value: genderDisplay },
    { id: "ingreso", value: numeroIngreso ? `Ingreso: ${numeroIngreso}` : "" },
  ].filter(item => item.value);

  // Expanded row 2 — contact
  const contactItems = [
    { id: "telefono", icon: Phone, value: p.telefono_principal },
    { id: "direccion", icon: MapPin, value: p.direccion },
    { id: "ciudad", icon: Building, value: p.ciudad },
    { id: "regimen", icon: Shield, value: p.regimen },
    { id: "afiliacion", icon: Heart, value: p.tipo_afiliacion },
  ].filter(item => item.value);

  // Expanded row 3 — admission
  const admissionItems = [
    { label: "Ingreso", value: numeroIngreso },
    { label: "Fecha ingreso", value: fechaIngreso },
    { label: "Historia clínica", value: p.numero_historia },
  ].filter(item => item.value);

  const hasExpandableContent = contactItems.length > 0 || admissionItems.length > 0;

  return (
    <>
      <div className={cn("transition-all duration-200", inline ? "min-w-0 flex-1" : "mb-3 bg-muted/20 border border-border/40 rounded-md px-4 py-2")}>
        {/* Collapsed row */}
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <span className={cn("truncate shrink-0 font-semibold text-foreground", inline ? "text-base" : "text-sm")}>
            {fullName}
          </span>

          {collapsedItems.map((item) => (
            <React.Fragment key={item.id}>
              <span className="text-muted-foreground/40 text-xs shrink-0">·</span>
              <span className="text-sm text-muted-foreground truncate shrink-0">{item.value}</span>
            </React.Fragment>
          ))}

          <div className="flex-1" />

          {/* Incapacidad popover removed — duplicated in atención header */}

          {hasExpandableContent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="shrink-0 h-7 w-7 p-0 text-muted-foreground"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          )}
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="mt-2 space-y-2 transition-all duration-200">
            {/* Row 2 — Contact */}
            {contactItems.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-11">
                {contactItems.map((item) => {
                  const IconComp = item.icon;
                  return (
                    <div key={item.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <IconComp className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.value}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Row 3 — Admission */}
            {admissionItems.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-11 border-t border-dashed border-border/40 pt-2 mt-2">
                {admissionItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>{item.label}:</span>
                    <span className="text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </>
  );
};
