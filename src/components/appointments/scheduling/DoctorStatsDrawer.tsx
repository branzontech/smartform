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
    success: "text-lime",
    warning: "text-amber-400",
    danger: "text-destructive"
  };

  const progressColors = {
    default: "[&>div]:bg-primary",
    success: "[&>div]:bg-lime",
    warning: "[&>div]:bg-amber-400",
    danger: "[&>div]:bg-destructive"
  };

  return (
    <div className="p-4 rounded-2xl bg-card/40 backdrop-blur-md border border-border/10 space-y-3 hover:bg-card/60 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center",
            variant === "success" ? "bg-lime/20" : 
            variant === "warning" ? "bg-amber-400/20" :
            variant === "danger" ? "bg-destructive/20" : "bg-primary/20"
          )}>
            <Icon className={cn("w-4 h-4", variantColors[variant])} />
          </div>
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full",
            trend === "up" ? "text-lime bg-lime/10" : 
            trend === "down" ? "text-destructive bg-destructive/10" : 
            "text-muted-foreground bg-muted/30"
          )}>
            {trend === "up" ? <TrendingUp className="w-3 h-3" /> : 
             trend === "down" ? <TrendingDown className="w-3 h-3" /> : null}
            {trendValue}
          </div>
        )}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold tracking-tight">{value}{suffix}</span>
      </div>
      {progress !== undefined && (
        <Progress 
          value={progress} 
          className={cn("h-1.5 bg-muted/20 rounded-full", progressColors[variant])} 
        />
      )}
    </div>
  );
};

const SectionTitle = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
      <Icon className="w-4 h-4 text-primary-foreground" />
    </div>
    <span className="text-sm font-bold tracking-tight">{title}</span>
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
      <SheetContent 
        side="right" 
        className="w-[420px] sm:w-[480px] p-0 border-l border-border/20 bg-gradient-to-b from-background via-background to-muted/20 backdrop-blur-xl"
      >
        {/* Header with gradient */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-lime/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <SheetHeader className="relative p-6 pb-4">
            <div className="flex items-center gap-4">
              {/* Doctor Photo with gradient border */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-lime rounded-2xl blur-sm opacity-60" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-lime/20 flex items-center justify-center text-xl font-bold border-2 border-white/20 backdrop-blur-sm">
                  {doctor.avatar}
                </div>
              </div>
              <div className="flex-1">
                <SheetTitle className="text-left text-lg font-bold">{doctor.name}</SheetTitle>
                <Badge className="mt-1.5 text-xs bg-primary/20 text-primary hover:bg-primary/30 border-0 rounded-lg px-3">
                  {doctor.specialty}
                </Badge>
              </div>
            </div>
          </SheetHeader>
        </div>

        <Separator className="bg-border/10" />

        <ScrollArea className="h-[calc(100vh-160px)]">
          <div className="px-6 py-6 space-y-8">
            {/* 1. Productividad y Gestión de Capacidad */}
            <section>
              <SectionTitle icon={Activity} title="Productividad y Capacidad" />
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={Target}
                  label="Tasa Ocupación"
                  value={stats.productivity.occupancyRate}
                  suffix="%"
                  trend="up"
                  trendValue="+5%"
                  progress={stats.productivity.occupancyRate}
                  variant="success"
                />
                <StatCard
                  icon={UserX}
                  label="No-Show"
                  value={stats.productivity.noShowRate}
                  suffix="%"
                  trend="down"
                  trendValue="-2%"
                  progress={stats.productivity.noShowRate}
                  variant={stats.productivity.noShowRate > 15 ? "danger" : "warning"}
                />
                <StatCard
                  icon={Clock}
                  label="Tiempo Consulta"
                  value={stats.productivity.avgConsultationTime}
                  suffix="min"
                  variant={stats.productivity.avgConsultationTime <= stats.productivity.scheduledTime ? "success" : "warning"}
                />
                <StatCard
                  icon={Clock}
                  label="Programado"
                  value={stats.productivity.scheduledTime}
                  suffix="min"
                />
              </div>
              
              {/* Patients Volume Card */}
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-md border border-border/10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-muted-foreground font-medium">Volumen de Pacientes</span>
                  <Badge variant="outline" className="text-[10px] rounded-lg border-lime/30 text-lime">
                    Este mes
                  </Badge>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex-1 p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium text-muted-foreground">Nuevos</span>
                    </div>
                    <span className="text-2xl font-bold">{stats.productivity.newPatients}</span>
                  </div>
                  <div className="flex-1 p-3 rounded-xl bg-lime/10 border border-lime/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Repeat className="w-4 h-4 text-lime" />
                      <span className="text-xs font-medium text-muted-foreground">Recurrentes</span>
                    </div>
                    <span className="text-2xl font-bold">{stats.productivity.recurringPatients}</span>
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
                  label="Espera en Sala"
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
                
                {/* Profitability by Agreement */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-md border border-border/10">
                  <span className="text-xs text-muted-foreground font-medium block mb-4">Rentabilidad por Convenio</span>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium">Particular</span>
                        <span className="text-xs font-bold text-lime">{stats.financial.privateConversion}%</span>
                      </div>
                      <Progress value={stats.financial.privateConversion} className="h-2 bg-muted/20 rounded-full [&>div]:bg-lime" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium">Aseguradoras</span>
                        <span className="text-xs font-bold text-primary">{stats.financial.insuranceConversion}%</span>
                      </div>
                      <Progress value={stats.financial.insuranceConversion} className="h-2 bg-muted/20 rounded-full [&>div]:bg-primary" />
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

            {/* Footer branding */}
            <div className="pt-4 pb-2 text-center">
              <p className="text-[10px] text-muted-foreground/60">
                Powered by <span className="font-semibold text-primary">Ker Hub</span>
              </p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
