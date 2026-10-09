import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SurfaceCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Esquina superior derecha: selector de rango en píldora o menú «⋮». */
  actions?: ReactNode;
  /** Sombra elevada al pasar el mouse (tarjetas que son enlaces o botones). */
  interactive?: boolean;
}

/**
 * Tarjeta base del sistema de diseño (docs/ux-ui/sistema-diseno.md): blanca
 * sobre el lienzo gris, radio de 24 px, sombra suave en claro y borde en oscuro.
 */
export function SurfaceCard({ title, subtitle, actions, interactive, className, children, ...rest }: SurfaceCardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-transparent bg-card p-5 text-card-foreground shadow-card md:p-6",
        "dark:border-border dark:shadow-none",
        interactive && "transition-shadow duration-200 hover:shadow-card-hover",
        className,
      )}
      {...rest}
    >
      {(title || actions) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            {title && <h3 className="text-[15px] font-semibold leading-tight text-foreground">{title}</h3>}
            {subtitle && <p className="text-[13px] text-muted-foreground">{subtitle}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
