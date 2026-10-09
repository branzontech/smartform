// Color de urgencia para fechas en tablas (va aparte: Cells.tsx solo exporta componentes).
/** Color de una fecha según cuántos días faltan (sin texto extra). */
export function deadlineTone(days: number | null | undefined, threshold = 45): string | undefined {
  if (days === null || days === undefined) return undefined;
  if (days < 0) return "font-medium text-destructive";
  if (days <= threshold) return "font-medium text-[hsl(var(--warning))]";
  return undefined;
}
