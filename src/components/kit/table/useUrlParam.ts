import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Aplica una vez un parámetro de la URL (p. ej. ?segment=por_vencer, desde un
 * KPI del dashboard) y lo quita de la barra de direcciones, para que la vista
 * siga recordándose como siempre. Solo lo aplica si es un valor válido aquí.
 */
export function useUrlParam(name: string, allowed: readonly string[], apply: (value: string) => void) {
  const [params, setParams] = useSearchParams();
  const value = params.get(name);
  const isValid = value !== null && allowed.includes(value);

  useEffect(() => {
    if (!isValid || value === null) return;
    apply(value);
    setParams((p) => { p.delete(name); return p; }, { replace: true });
    // Solo al llegar con el parámetro; `apply` cambia en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid, value, name, setParams]);
}
