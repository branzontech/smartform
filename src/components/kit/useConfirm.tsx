import { useCallback, useRef, useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

/**
 * Reemplazo de `window.confirm()` con el diálogo del sistema de diseño
 * (convención: nunca el confirm del navegador). Uso:
 *
 *   const [confirm, confirmDialog] = useConfirm();
 *   if (!(await confirm({ title: "¿Cancelar la venta?", description: "…", destructive: true }))) return;
 *   …
 *   return <>{…}{confirmDialog}</>;
 */
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback((o: ConfirmOptions) => new Promise<boolean>((resolve) => {
    resolver.current = resolve;
    setOptions(o);
  }), []);

  const respond = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOptions(null);
  };

  const confirmDialog = (
    <ConfirmDialog
      open={!!options}
      onOpenChange={(open) => { if (!open && resolver.current) respond(false); }}
      title={options?.title ?? ""}
      description={options?.description ?? ""}
      confirmLabel={options?.confirmLabel ?? "Confirmar"}
      cancelLabel={options?.cancelLabel ?? "Volver"}
      variant={options?.destructive ? "destructive" : "default"}
      onConfirm={() => respond(true)}
    />
  );

  return [confirm, confirmDialog] as const;
}
