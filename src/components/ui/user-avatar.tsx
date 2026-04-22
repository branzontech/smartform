import React, { useMemo } from "react";
import multiavatar from "@multiavatar/multiavatar/esm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  /** Stable identifier (user id, email, or name). Same seed → same avatar. */
  seed?: string | null;
  /** Optional explicit image URL (takes precedence over the generated avatar). */
  src?: string | null;
  /** Initials fallback when no seed/src is available. */
  initials?: string;
  /** Accessible alt text. */
  alt?: string;
  className?: string;
  fallbackClassName?: string;
}

/**
 * Deterministic per-user avatar powered by @multiavatar/multiavatar.
 * Produces an inline-SVG data URI so no network requests are made.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  seed,
  src,
  initials,
  alt,
  className,
  fallbackClassName,
}) => {
  const generatedSrc = useMemo(() => {
    if (!seed) return null;
    const svg = multiavatar(String(seed));
    // Encode for safe data-uri usage
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }, [seed]);

  const finalSrc = src || generatedSrc || undefined;

  return (
    <Avatar className={cn(className)}>
      {finalSrc && <AvatarImage src={finalSrc} alt={alt || "Avatar"} />}
      <AvatarFallback className={cn("bg-primary/10 text-primary font-semibold", fallbackClassName)}>
        {initials || (seed ? seed.slice(0, 2).toUpperCase() : "?")}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
