import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Mail, MessageCircle, X, Loader2 } from 'lucide-react';
import {
  buildOrderInnerHtml,
  ORDER_DOCUMENT_STYLES,
  type OrderLike,
} from '@/utils/orders/order-document';
import { printOrder, shareOrderEmail, shareOrderWhatsApp } from '@/utils/orders/order-actions';

interface OrderPreviewDialogProps {
  order: OrderLike | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OrderPreviewDialog: React.FC<OrderPreviewDialogProps> = ({ order, open, onOpenChange }) => {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !order) return;
    let cancelled = false;
    setLoading(true);
    setHtml('');
    buildOrderInnerHtml({ order })
      .then(inner => {
        if (!cancelled) setHtml(inner);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, order]);

  if (!order) return null;

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
              {order.numero_orden}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost" size="sm"
              className="h-8 px-2.5 text-xs gap-1.5"
              onClick={() => shareOrderEmail(order)}
            >
              <Mail className="w-3.5 h-3.5" /> Email
            </Button>
            <Button
              variant="ghost" size="sm"
              className="h-8 px-2.5 text-xs gap-1.5 text-emerald-600 hover:text-emerald-700"
              onClick={() => shareOrderWhatsApp(order)}
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </Button>
            <Button
              variant="default" size="sm"
              className="h-8 px-3 text-xs gap-1.5"
              onClick={() => printOrder({ order })}
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 ml-1"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" />
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

export default OrderPreviewDialog;
