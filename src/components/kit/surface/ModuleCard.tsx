import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ModuleIcon, type ModuleIconName } from "@/components/ui/module-icon";
import { cn } from "@/lib/utils";

interface ModuleCardProps {
  icon: ModuleIconName;
  title: string;
  description: string;
  to: string;
  className?: string;
}

/**
 * Acceso a un módulo principal (Inicio, lanzador): ícono 3D arriba, título,
 * una línea de descripción. Toda la tarjeta es el enlace; al pasar el mouse
 * crece la sombra y aparece una flecha pequeña en lima de marca.
 */
export function ModuleCard({ icon, title, description, to, className }: ModuleCardProps) {
  return (
    <Link
      to={to}
      className={cn(
        "group flex h-full flex-col rounded-card border border-transparent bg-card p-5 text-left shadow-card md:p-6",
        "transition-shadow duration-200 hover:shadow-card-hover",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "dark:border-border dark:shadow-none dark:hover:border-primary/40",
        className,
      )}
    >
      <ModuleIcon name={icon} className="h-20 w-20 md:h-24 md:w-24" />
      <div className="mt-4 flex flex-1 items-end justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 className="text-[15px] font-semibold leading-tight text-foreground">{title}</h3>
          <p className="text-[13px] leading-snug text-muted-foreground">{description}</p>
        </div>
        <span
          aria-hidden
          className="flex h-7 w-7 shrink-0 -translate-x-1 items-center justify-center rounded-full bg-highlight text-highlight-foreground opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
        >
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
      </div>
    </Link>
  );
}
