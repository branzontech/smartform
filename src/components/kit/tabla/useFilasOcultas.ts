import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Cuenta las filas que quedan por debajo del área visible de la tabla (el
 * cuerpo tiene scroll propio). Sin este aviso, al elegir 50 o 100 filas por
 * página parecía que no cargaban: estaban ahí, pero fuera de la vista.
 * `reinicio` vuelve arriba cuando cambia la página o el tamaño; `filas` vuelve a medir.
 */
export function useFilasOcultas(reinicio: unknown, filas: number) {
  const tablaRef = useRef<HTMLTableElement>(null);
  const [ocultas, setOcultas] = useState(0);

  const medir = useCallback(() => {
    const caja = tablaRef.current?.parentElement;
    if (!caja) return;
    const fondo = caja.getBoundingClientRect().bottom;
    let n = 0;
    tablaRef.current!.querySelectorAll("tbody > tr").forEach((tr) => { if (tr.getBoundingClientRect().top >= fondo - 8) n++; });
    setOcultas(n);
  }, []);

  useEffect(() => {
    const caja = tablaRef.current?.parentElement;
    if (!caja) return;
    caja.addEventListener("scroll", medir, { passive: true });
    const ro = new ResizeObserver(medir);
    ro.observe(caja);
    ro.observe(tablaRef.current!);
    return () => { caja.removeEventListener("scroll", medir); ro.disconnect(); };
  }, [medir]);

  useEffect(() => {
    tablaRef.current?.parentElement?.scrollTo({ top: 0 });
    medir();
  }, [reinicio, medir]);

  useEffect(() => { medir(); }, [filas, medir]);

  const verMas = useCallback(() => {
    const caja = tablaRef.current?.parentElement;
    caja?.scrollBy({ top: caja.clientHeight * 0.8, behavior: "smooth" });
  }, []);

  return { tablaRef, ocultas, verMas };
}
