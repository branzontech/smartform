import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Aplica una vez un parámetro de la URL (p. ej. ?segmento=por_vencer, desde un
 * KPI del dashboard) y lo quita de la barra de direcciones, para que la vista
 * siga recordándose como siempre. Solo lo aplica si es un valor válido aquí.
 */
export function useParametroUrl(nombre: string, validos: readonly string[], aplicar: (valor: string) => void) {
  const [params, setParams] = useSearchParams();
  const valor = params.get(nombre);
  const valido = valor !== null && validos.includes(valor);

  useEffect(() => {
    if (!valido || valor === null) return;
    aplicar(valor);
    setParams((p) => { p.delete(nombre); return p; }, { replace: true });
    // Solo al llegar con el parámetro; aplicar cambia en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valido, valor, nombre, setParams]);
}
