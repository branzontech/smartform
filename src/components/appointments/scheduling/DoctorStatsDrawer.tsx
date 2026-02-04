import React from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  Clock,
  Calendar,
  DollarSign,
  Star,
  Target,
  Brain,
  Activity,
  UserCheck,
  UserX,
  Repeat,
  FileCheck,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DoctorStatsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor: {
    id: string;
    name: string;
    specialty: string;
    avatar: string;
  } | null;
}

// Mock statistics data
const mockDoctorStats = {
  productivity: {
    occupancyRate: 78,
    noShowRate: 12,
    avgConsultationTime: 28,
    scheduledTime: 30,
    newPatients: 42,
    recurringPatients: 158,
  },
  experience: {
    nps: 85,
    waitTime: 8,
    retentionRate: 73,
  },
  financial: {
    avgTicket: 125000,
    privateConversion: 45,
    insuranceConversion: 32,
    procedureConversion: 28,
  },
  clinical: {
    guidelineAdherence: 92,
    aiAcceptance: 76,
    firstVisitResolution: 68,
  }
};

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  suffix = "", 
  trend, 
  trendValue,
  progress,
  variant = "default"
}: { 
  icon: React.ElementType;
  label: string;
  value: string | number;
  suffix?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  progress?: number;
  variant?: "default" | "success" | "warning" | "danger";
}) => {
  const variantColors = {
    default: "text-primary",
    success: "text-green-500",
    warning: "text-amber-500",
    danger: "text-red-500"
  };

  return (
    <div className="p-3 rounded-xl bg-muted/30 border border-border/20 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-4 h-4", variantColors[variant])} />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-[10px]",
            trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-muted-foreground"
          )}>
            {trend === "up" ? <TrendingUp className="w-3 h-3" /> : trend === "down" ? <TrendingDown className="w-3 h-3" /> : null}
            {trendValue}
          </div>
        )}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-lg font-bold">{value}{suffix}</span>
      </div>
      {progress !== undefined && (
        <Progress value={progress} className="h-1.5" />
      )}
    </div>
  );
};

const SectionTitle = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
      <Icon className="w-3.5 h-3.5 text-primary" />
    </div>
    <span className="text-sm font-semibold">{title}</span>
  </div>
);

export const DoctorStatsDrawer: React.FC<DoctorStatsDrawerProps> = ({
  open,
  onOpenChange,
  doctor
}) => {
  if (!doctor) return null;

  const stats = mockDoctorStats;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[450px] p-0">
        <SheetHeader className="p-4 pb-0">
          <div className="flex items-center gap-4">
            {/* Doctor Photo */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-xl font-bold text-primary border-2 border-primary/20">
              {doctor.avatar}
            </div>
            <div className="flex-1">
              <SheetTitle className="text-left">{doctor.name}</SheetTitle>
              <Badge variant="secondary" className="mt-1 text-xs">
                {doctor.specialty}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        <Separator className="my-4" />

        <ScrollArea className="h-[calc(100vh-160px)]">
          <div className="px-4 pb-6 space-y-6">
            {/* 1. Productividad y Gestión de Capacidad */}
            <section>
              <SectionTitle icon={Activity} title="Productividad y Capacidad" />
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={Target}
                  label="Tasa de Ocupación"
                  value={stats.productivity.occupancyRate}
                  suffix="%"
                  trend="up"
                  trendValue="+5%"
                  progress={stats.productivity.occupancyRate}
                  variant="success"
                />
                <StatCard
                  icon={UserX}
                  label="Tasa No-Show"
                  value={stats.productivity.noShowRate}
                  suffix="%"
                  trend="down"
                  trendValue="-2%"
                  progress={stats.productivity.noShowRate}
                  variant={stats.productivity.noShowRate > 15 ? "danger" : "warning"}
                />
                <StatCard
                  icon={Clock}
                  label="Tiempo Prom. Consulta"
                  value={stats.productivity.avgConsultationTime}
                  suffix="min"
                  variant={stats.productivity.avgConsultationTime <= stats.productivity.scheduledTime ? "success" : "warning"}
                />
                <StatCard
                  icon={Calendar}
                  label="Tiempo Programado"
                  value={stats.productivity.scheduledTime}
                  suffix="min"
                />
              </div>
              
              {/* Patients Volume */}
              <div className="mt-3 p-3 rounded-xl bg-muted/30 border border-border/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Volumen de Pacientes</span>
                  <Badge variant="outline" className="text-[10px]">Este mes</Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-xs">Nuevos</span>
                    </div>
                    <span className="text-lg font-bold">{stats.productivity.newPatients}</span>
                  </div>
                  <Separator orientation="vertical" className="h-10" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Repeat className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-xs">Recurrentes</span>
                    </div>
                    <span className="text-lg font-bold">{stats.productivity.recurringPatients}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Experiencia y Satisfacción del Paciente */}
            <section>
              <SectionTitle icon={Star} title="Experiencia del Paciente" />
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={Star}
                  label="NPS Score"
                  value={stats.experience.nps}
                  trend="up"
                  trendValue="+8"
                  progress={stats.experience.nps}
                  variant={stats.experience.nps >= 70 ? "success" : stats.experience.nps >= 50 ? "warning" : "danger"}
                />
                <StatCard
                  icon={Clock}
                  label="Tiempo Espera Sala"
                  value={stats.experience.waitTime}
                  suffix="min"
                  trend="down"
                  trendValue="-3min"
                  variant={stats.experience.waitTime <= 10 ? "success" : "warning"}
                />
              </div>
              <div className="mt-3">
                <StatCard
                  icon={UserCheck}
                  label="Tasa de Retención"
                  value={stats.experience.retentionRate}
                  suffix="%"
                  trend="up"
                  trendValue="+4%"
                  progress={stats.experience.retentionRate}
                  variant={stats.experience.retentionRate >= 70 ? "success" : "warning"}
                />
              </div>
            </section>

            {/* 3. Rendimiento Financiero */}
            <section>
              <SectionTitle icon={DollarSign} title="Rendimiento Financiero" />
              <div className="space-y-3">
                <StatCard
                  icon={DollarSign}
                  label="Ticket Promedio"
                  value={`$${(stats.financial.avgTicket / 1000).toFixed(0)}k`}
                  trend="up"
                  trendValue="+12%"
                  variant="success"
                />
                <div className="p-3 rounded-xl bg-muted/30 border border-border/20">
                  <span className="text-xs text-muted-foreground block mb-3">Rentabilidad por Convenio</span>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Particular</span>
                      <div className="flex items-center gap-2">
                        <Progress value={stats.financial.privateConversion} className="w-20 h-1.5" />
                        <span className="text-xs font-medium w-8">{stats.financial.privateConversion}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Aseguradoras</span>
                      <div className="flex items-center gap-2">
                        <Progress value={stats.financial.insuranceConversion} className="w-20 h-1.5" />
                        <span className="text-xs font-medium w-8">{stats.financial.insuranceConversion}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <StatCard
                  icon={Target}
                  label="Conversión Procedimientos"
                  value={stats.financial.procedureConversion}
                  suffix="%"
                  trend="up"
                  trendValue="+3%"
                  progress={stats.financial.procedureConversion}
                />
              </div>
            </section>

            {/* 4. Inteligencia Clínica y Operativa */}
            <section>
              <SectionTitle icon={Brain} title="Inteligencia Clínica" />
              <div className="grid grid-cols-1 gap-3">
                <StatCard
                  icon={FileCheck}
                  label="Adherencia a Guías Clínicas"
                  value={stats.clinical.guidelineAdherence}
                  suffix="%"
                  progress={stats.clinical.guidelineAdherence}
                  variant={stats.clinical.guidelineAdherence >= 90 ? "success" : "warning"}
                />
                <StatCard
                  icon={Sparkles}
                  label="Aceptación Sugerencias IA"
                  value={stats.clinical.aiAcceptance}
                  suffix="%"
                  progress={stats.clinical.aiAcceptance}
                />
                <StatCard
                  icon={CheckCircle2}
                  label="Resolución Primera Cita"
                  value={stats.clinical.firstVisitResolution}
                  suffix="%"
                  trend="up"
                  trendValue="+5%"
                  progress={stats.clinical.firstVisitResolution}
                  variant={stats.clinical.firstVisitResolution >= 60 ? "success" : "warning"}
                />
              </div>
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
