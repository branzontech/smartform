/**
 * Backwards-compatible re-export. New code should import from
 * '@/utils/orders/order-actions' or '@/utils/orders/order-document'.
 */
import type { Order } from '@/components/orders/OrdersListPanel';
import {
  printOrder as printOrderNew,
  shareOrderEmail as shareOrderEmailNew,
  shareOrderWhatsApp as shareOrderWhatsAppNew,
} from '@/utils/orders/order-actions';

export function printOrder(order: Order) {
  return printOrderNew({ order: order as any });
}
export function shareOrderEmail(order: Order) {
  return shareOrderEmailNew(order as any);
}
export function shareOrderWhatsApp(order: Order) {
  return shareOrderWhatsAppNew(order as any);
}
