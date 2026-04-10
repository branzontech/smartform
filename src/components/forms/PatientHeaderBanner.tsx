import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User, CreditCard, Calendar, Phone, Mail, FileText, Shield, Heart,
  MapPin, Building, Briefcase, IdCard, ChevronDown, ChevronUp, Users,
  Clock, Hash, CalendarDays, Plus, Eye,
} from "lucide-react";
import { differenceInYears, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IncapacidadDialog } from "@/components/incapacidades/IncapacidadDialog";
import { useIncapacidadesByAdmision } from "@/hooks/useIncapacidades";

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
}

export const PatientHeaderBanner: React.FC<PatientHeaderBannerProps> = ({
  pacienteId,
  pacienteData,
  admisionId,
  admisionData,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showIncapacidad, setShowIncapacidad] = useState(false);
  const { user } = useAuth();

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

  const { data: admision, isLoading: admisionLoading } = useQuery({
    queryKey: ["admision", admisionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admisiones")
        .select("*")
        .eq("id", admisionId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !admisionData && !!admisionId,
  });

  // Fetch incapacidades for this admission
  const { data: incapacidadesList = [] } = useIncapacidadesByAdmision(admisionId || null);
  const incapacidadCount = incapacidadesList.filter(i => i.estado === "activa").length;

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
    docDisplay,
    ageDisplay,
    genderDisplay,
    numeroIngreso ? `Ingreso: ${numeroIngreso}` : "",
  ].filter(Boolean);

  // Expanded row 2 — contact
  const contactItems = [
    { icon: Phone, value: p.telefono_principal },
    { icon: MapPin, value: p.direccion },
    { icon: Building, value: p.ciudad },
    { icon: Shield, value: p.regimen },
    { icon: Heart, value: p.tipo_afiliacion },
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
      <div className="mb-3 bg-muted/20 border border-border/40 rounded-md px-4 py-2 transition-all duration-200">
        {/* Collapsed row */}
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <span className="font-semibold text-sm text-foreground truncate shrink-0">
            {fullName}
          </span>

          {collapsedItems.map((item, i) => (
            <React.Fragment key={i}>
              <span className="text-muted-foreground/40 text-xs shrink-0">·</span>
              <span className="text-sm text-muted-foreground truncate shrink-0">{item}</span>
            </React.Fragment>
          ))}

          <div className="flex-1" />

          {/* Incapacidad button */}
          {/* Incapacidad popover + button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 h-7 gap-1.5 px-2 text-muted-foreground hover:text-primary"
              >
                <CalendarDays className="w-4 h-4" />
                <span className="text-xs hidden sm:inline">Incapacidad</span>
                {incapacidadCount > 0 && (
                  <Badge variant="secondary" className="h-4 min-w-[16px] px-1 text-[10px] rounded-full">
                    {incapacidadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
                <span className="text-xs font-semibold text-foreground">Incapacidades</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 px-2 text-xs text-primary"
                  onClick={() => setShowIncapacidad(true)}
                >
                  <Plus className="w-3 h-3" />
                  Nueva
                </Button>
              </div>
              {incapacidadesList.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                  Sin incapacidades registradas
                </div>
              ) : (
                <ScrollArea className="max-h-48">
                  <div className="divide-y divide-border/30">
                    {incapacidadesList.map((inc) => {
                      const estadoBadge = inc.estado === "activa"
                        ? "bg-green-500/10 text-green-700 border-green-500/20"
                        : inc.estado === "anulada"
                        ? "bg-red-500/10 text-red-700 border-red-500/20"
                        : "bg-muted text-muted-foreground";
                      return (
                        <div
                          key={inc.id}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-muted/40 cursor-pointer"
                          onClick={() => setShowIncapacidad(true)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-foreground truncate">
                                {inc.numero_incapacidad || "—"}
                              </span>
                              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border", estadoBadge)}>
                                {inc.estado}
                              </span>
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {inc.fecha_inicio} · {inc.duracion_dias} días · {inc.diagnostico_principal}
                            </div>
                          </div>
                          <Eye className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </PopoverContent>
          </Popover>

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
                {contactItems.map((item, i) => {
                  const IconComp = item.icon;
                  return (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
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
                {admissionItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>{item.label}:</span>
                    <span className="text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Incapacidad Dialog */}
      {admisionId && (
        <IncapacidadDialog
          open={showIncapacidad}
          onOpenChange={setShowIncapacidad}
          pacienteId={pacienteId}
          admisionId={admisionId}
          medicoNombre={a?.profesional_nombre || "Médico"}
          medicoId={user?.id || ""}
        />
      )}
    </>
  );
};
