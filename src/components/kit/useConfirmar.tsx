import { useCallback, useRef, useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

interface OpcionesConfirmar {
  titulo: string;
  descripcion: string;
  confirmar?: string;
  cancelar?: string;
  destructivo?: boolean;
}

/**
 * Reemplazo de `window.confirm()` con el diálogo del sistema de diseño
 * (convención: nunca el confirm del navegador). Uso:
 *
 *   const [confirmar, dialogoConfirmar] = useConfirmar();
 *   if (!(await confirmar({ titulo: "¿Cancelar la venta?", descripcion: "…", destructivo: true }))) return;
 *   …
 *   return <>{…}{dialogoConfirmar}</>;
 */
export function useConfirmar() {
  const [opciones, setOpciones] = useState<OpcionesConfirmar | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const confirmar = useCallback((o: OpcionesConfirmar) => new Promise<boolean>((resolve) => {
    resolver.current = resolve;
    setOpciones(o);
  }), []);

  const responder = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOpciones(null);
  };

  const dialogo = (
    <ConfirmDialog
      open={!!opciones}
      onOpenChange={(abierto) => { if (!abierto && resolver.current) responder(false); }}
      title={opciones?.titulo ?? ""}
      description={opciones?.descripcion ?? ""}
      confirmLabel={opciones?.confirmar ?? "Confirmar"}
      cancelLabel={opciones?.cancelar ?? "Volver"}
      variant={opciones?.destructivo ? "destructive" : "default"}
      onConfirm={() => responder(true)}
    />
  );

  return [confirmar, dialogo] as const;
}
