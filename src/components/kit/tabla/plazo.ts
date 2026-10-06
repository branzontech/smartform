// Color de urgencia para fechas en tablas (va aparte: Celdas.tsx solo exporta componentes).
/** Color de una fecha según cuántos días faltan (sin texto extra). */
export function tonoPlazo(dias: number | null | undefined, umbral = 45): string | undefined {
  if (dias === null || dias === undefined) return undefined;
  if (dias < 0) return "font-medium text-destructive";
  if (dias <= umbral) return "font-medium text-[hsl(var(--warning))]";
  return undefined;
}
