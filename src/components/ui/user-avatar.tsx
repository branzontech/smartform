import React from "react";
import BoringAvatar from "boring-avatars";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/**
 * Paleta de marca sin el morado de la barra superior (si no, el avatar se pierde
 * en ella): lima, violetas suaves y el violeta oscuro del texto sobre lima.
 */
const PALETTE = ["#A2F603", "#F1E9FC", "#4B1D95", "#D9F7A8", "#C9A7F5"];

interface UserAvatarProps {
  /** Semilla estable: el nombre de la persona (la misma persona se ve igual en todo el sistema). */
  seed?: string | null;
  /** Foto real (tiene prioridad sobre el avatar generado). */
  src?: string | null;
  /** Iniciales si no hay semilla ni foto. */
  initials?: string;
  /** Texto alternativo. */
  alt?: string;
  className?: string;
  fallbackClassName?: string;
}

/**
 * Avatar de persona como en Audit Pro: boring-avatars, variante «beam» (MIT),
 * dibujado en SVG sin peticiones de red. Con foto, se muestra la foto.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({ seed, src, initials, alt, className, fallbackClassName }) => {
  if (!src && seed) {
    return (
      <span role="img" aria-label={alt || "Avatar"} className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}>
        <BoringAvatar name={String(seed)} variant="beam" size="100%" colors={PALETTE} />
      </span>
    );
  }
  return (
    <Avatar className={cn(className)}>
      {src && <AvatarImage src={src} alt={alt || "Avatar"} />}
      <AvatarFallback className={cn("bg-primary/10 text-primary font-semibold", fallbackClassName)}>
        {initials || (seed ? seed.slice(0, 2).toUpperCase() : "?")}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
