import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouteIcon, type RouteIconName } from "./MapMarker";

interface RoutePinProps {
  icon: RouteIconName;
  /** Color del número (el del profesional) y del dibujo de respaldo. */
  color: string;
  number?: number;
  done?: boolean;
  active?: boolean;
  /** Atenuado: visitas de otro profesional o ya resueltas. */
  faded?: boolean;
  /** Nombre corto encima del pin (p. ej. el profesional sobre su carro). */
  label?: string;
  bubble?: { title: string; detail: string };
  children?: ReactNode;
}

/**
 * Pin al estilo de las apps de transporte, el mismo del software de rutas:
 * ícono 3D con el número de la visita; si el ícono no carga, círculo, tallo y punto.
 */
export function RoutePin({ icon, color, number, done, active, faded, label, bubble, children }: RoutePinProps) {
  const image = useRouteIcon(icon);
  const badge = done ? (
    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[hsl(var(--success))] text-white">
      <Check className="h-3 w-3" strokeWidth={3.5} />
    </span>
  ) : number !== undefined ? (
    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white px-1 text-[11px] font-bold text-white" style={{ background: color }}>
      {number}
    </span>
  ) : null;

  return (
    <div className={cn("flex flex-col items-center transition-opacity duration-300", faded && !active && "opacity-45")}>
      {bubble && (
        <div className="mb-2 w-max max-w-[240px] rounded-2xl bg-white px-3 py-2 text-left shadow-[0_8px_28px_rgb(20_20_20/0.14)] animate-in fade-in zoom-in-95">
          <p className="text-sm font-bold text-[#141414]">{bubble.title}</p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-[#5f646c]">{bubble.detail}</p>
        </div>
      )}
      {label && !bubble && (
        <span className="mb-1.5 max-w-[200px] truncate rounded-full bg-white px-3 py-1 text-xs font-bold text-[#141414] shadow-[0_8px_28px_rgb(20_20_20/0.14)]">{label}</span>
      )}
      {image ? (
        <span className={cn("relative transition-transform duration-200", active && "scale-125")}>
          <img src={image} alt="" className="h-12 w-12 object-contain drop-shadow-md" draggable={false} />
          {badge}
        </span>
      ) : (
        <>
          <span
            className={cn("flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white text-sm font-bold text-white shadow-md transition-transform", active && "scale-125")}
            style={{ background: color }}
          >
            {children ?? number}
          </span>
          <span className="h-2 w-0.5" style={{ background: color }} />
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
        </>
      )}
    </div>
  );
}
