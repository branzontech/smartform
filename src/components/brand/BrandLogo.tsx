import { cn } from "@/lib/utils";

/** Nombre de la plataforma (2026-10-16: antes «Ker Hub»). */
export const BRAND_NAME = "Doctor Ker";

const SIZE = {
  sm: { mark: "h-7", text: "text-[21px]" },
  md: { mark: "h-8 sm:h-9", text: "text-[24px] sm:text-[27px]" },
} as const;

/**
 * Logotipo de Doctor Ker: el símbolo de la marca y el nombre en texto vivo
 * («Doctor» claro, «Ker» en lima), para fondos morados u oscuros.
 */
export function BrandLogo({ size = "sm", className }: { size?: keyof typeof SIZE; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 leading-none", className)} aria-label={BRAND_NAME} role="img">
      <img src="/doctorker-simbolo.png" alt="" aria-hidden="true" className={cn("w-auto", SIZE[size].mark)} />
      <span aria-hidden="true" className={cn("whitespace-nowrap tracking-tight", SIZE[size].text)}>
        <span className="font-light text-white">Doctor</span>
        <span className="ml-[0.18em] font-bold text-highlight">Ker</span>
      </span>
    </span>
  );
}
