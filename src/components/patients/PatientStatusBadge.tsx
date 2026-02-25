import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PatientStatus = "registrado" | "activo" | "inactivo";

const statusConfig: Record<PatientStatus, { label: string; className: string }> = {
  registrado: {
    label: "Registrado",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  },
  activo: {
    label: "Activo",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  },
  inactivo: {
    label: "Inactivo",
    className: "bg-muted text-muted-foreground border-border",
  },
};

interface PatientStatusBadgeProps {
  status?: PatientStatus;
  className?: string;
}

export const PatientStatusBadge: React.FC<PatientStatusBadgeProps> = ({
  status = "registrado",
  className,
}) => {
  const config = statusConfig[status] || statusConfig.registrado;
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] font-medium px-1.5 py-0", config.className, className)}
    >
      {config.label}
    </Badge>
  );
};
