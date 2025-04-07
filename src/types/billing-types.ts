
export type InvoiceStatus = "pending" | "paid" | "overdue" | "cancelled";
export type PaymentMethod = "credit_card" | "bank_transfer" | "cash" | "insurance";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  doctorId?: string;
  doctorName?: string;
  issueDate: Date;
  dueDate: Date;
  status: InvoiceStatus;
  total: number;
  subtotal: number;
  tax: number;
  discount?: number;
  items: InvoiceItem[];
  paymentMethod?: PaymentMethod;
  notes?: string;
  paid?: boolean;
  paidAmount?: number;
  paidDate?: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  tax?: number;
  discount?: number;
  serviceId?: string;
  serviceCode?: string;
}

export interface InvoiceFilter {
  status?: InvoiceStatus;
  patientId?: string;
  doctorId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export interface PaymentSummary {
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  pendingCount: number;
  paidCount: number;
  overdueCount: number;
}

export interface RevenueByPeriod {
  period: string;
  amount: number;
}

export interface RevenueByService {
  service: string;
  amount: number;
}

export interface RevenueByDoctor {
  doctorName: string;
  amount: number;
}
