import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Mail, MessageCircle, Loader2 } from 'lucide-react';
import {
  buildIncapacidadInnerHtml,
  type IncapacidadLike,
} from '@/utils/incapacidades/incapacidad-document';
import { ORDER_DOCUMENT_STYLES } from '@/utils/orders/order-document';
import {
  printIncapacidad,
  shareIncapacidadEmail,
  shareIncapacidadWhatsApp,
} from '@/utils/incapacidades/incapacidad-actions';

interface IncapacidadPreviewDialogProps {
  incapacidad: IncapacidadLike | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const IncapacidadPreviewDialog: React.FC<IncapacidadPreviewDialogProps> = ({
  incapacidad,
  open,
  onOpenChange,
}) => {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !incapacidad) return;
    let cancelled = false;
    setLoading(true);
    setHtml('');
    buildIncapacidadInnerHtml({ incapacidad })
      .then(inner => {
        if (!cancelled) setHtml(inner);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, incapacidad]);

  if (!incapacidad) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl w-[95vw] h-[92vh] p-0 gap-0 overflow-hidden flex flex-col"
        aria-describedby={undefined}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b bg-card shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Vista previa
            </span>
            <span className="text-xs text-muted-foreground/60">·</span>
            <span className="text-sm font-mono font-semibold text-foreground truncate">
              {incapacidad.numero_incapacidad || 'Incapacidad'}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0 mr-7">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 text-xs gap-1.5"
              onClick={() => shareIncapacidadEmail(incapacidad)}
            >
              <Mail className="w-3.5 h-3.5" /> Email
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 text-xs gap-1.5 text-emerald-600 hover:text-emerald-700"
              onClick={() => shareIncapacidadWhatsApp(incapacidad)}
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </Button>
            <Button
              variant="default"
              size="sm"
              className="h-8 px-3 text-xs gap-1.5"
              onClick={() => printIncapacidad({ incapacidad })}
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir
            </Button>
          </div>
        </div>

        {/* Document preview area */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-muted/40">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <style dangerouslySetInnerHTML={{ __html: ORDER_DOCUMENT_STYLES }} />
              <div dangerouslySetInnerHTML={{ __html: html }} />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IncapacidadPreviewDialog;
