
import { Invoice, InvoiceItem } from "@/types/billing-types";
import { nanoid } from "nanoid";

// Función auxiliar para generar fechas aleatorias en un rango
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Datos de ejemplo de servicios para generar facturas
const medicalServices = [
  { id: "svc-001", description: "Consulta general", price: 600 },
  { id: "svc-002", description: "Consulta especializada", price: 1200 },
  { id: "svc-003", description: "Radiografía", price: 800 },
  { id: "svc-004", description: "Análisis de sangre", price: 450 },
  { id: "svc-005", description: "Electrocardiograma", price: 950 },
  { id: "svc-006", description: "Ultrasonido", price: 1500 },
  { id: "svc-007", description: "Terapia física", price: 700 },
  { id: "svc-008", description: "Consulta nutricional", price: 550 },
  { id: "svc-009", description: "Evaluación psicológica", price: 1100 },
  { id: "svc-010", description: "Vacunación", price: 350 },
];

// Generar ítems aleatorios para una factura
const generateInvoiceItems = (count: number): InvoiceItem[] => {
  const items: InvoiceItem[] = [];
  
  for (let i = 0; i < count; i++) {
    const service = medicalServices[Math.floor(Math.random() * medicalServices.length)];
    const quantity = Math.floor(Math.random() * 3) + 1;
    const unitPrice = service.price;
    
    items.push({
      id: nanoid(),
      description: service.description,
      serviceId: service.id,
      serviceCode: `S${service.id.split('-')[1]}`,
      quantity,
      unitPrice,
      total: quantity * unitPrice
    });
  }
  
  return items;
};

// Generar datos de facturas
export const generateMockInvoices = (count: number): Invoice[] => {
  const invoices: Invoice[] = [];
  const today = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(today.getMonth() - 6);
  
  const patients = [
    { id: "P001", name: "Juan Pérez" },
    { id: "P002", name: "María González" },
    { id: "P003", name: "Carlos Rodríguez" },
    { id: "P004", name: "Ana Martínez" },
    { id: "P005", name: "Roberto López" },
  ];
  
  const doctors = [
    { id: "D001", name: "Dr. Alejandro García" },
    { id: "D002", name: "Dra. Sofía Hernández" },
    { id: "D003", name: "Dr. Miguel Torres" },
  ];
  
  const statuses: ["paid", "pending", "overdue", "cancelled"] = ["paid", "pending", "overdue", "cancelled"];
  const paymentMethods: ["credit_card", "bank_transfer", "cash", "insurance"] = ["credit_card", "bank_transfer", "cash", "insurance"];
  
  for (let i = 1; i <= count; i++) {
    const patient = patients[Math.floor(Math.random() * patients.length)];
    const doctor = Math.random() > 0.2 ? doctors[Math.floor(Math.random() * doctors.length)] : null;
    
    const itemCount = Math.floor(Math.random() * 4) + 1;
    const items = generateInvoiceItems(itemCount);
    
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.16; // 16% IVA
    const hasDiscount = Math.random() > 0.7;
    const discount = hasDiscount ? Math.floor(subtotal * (Math.random() * 0.2)) : 0;
    const total = subtotal + tax - discount;
    
    const issueDate = randomDate(sixMonthsAgo, today);
    const dueDate = new Date(issueDate);
    dueDate.setDate(issueDate.getDate() + 30); // Vencimiento a 30 días
    
    const statusIndex = Math.floor(Math.random() * 4);
    const status = statuses[statusIndex];
    
    let paidDate = null;
    let paidAmount = null;
    
    if (status === "paid") {
      paidDate = new Date(issueDate);
      paidDate.setDate(issueDate.getDate() + Math.floor(Math.random() * 15));
      paidAmount = total;
    }
    
    invoices.push({
      id: nanoid(),
      invoiceNumber: `FAC-${(1000 + i).toString().padStart(4, '0')}`,
      patientId: patient.id,
      patientName: patient.name,
      doctorId: doctor ? doctor.id : undefined,
      doctorName: doctor ? doctor.name : undefined,
      issueDate,
      dueDate,
      status,
      total,
      subtotal,
      tax,
      discount,
      items,
      paymentMethod: status === "paid" ? paymentMethods[Math.floor(Math.random() * paymentMethods.length)] : undefined,
      notes: Math.random() > 0.7 ? "Factura por servicios médicos prestados." : undefined,
      paid: status === "paid",
      paidAmount,
      paidDate,
    });
  }
  
  return invoices;
};

// Generar 30 facturas de ejemplo
export const mockInvoices: Invoice[] = generateMockInvoices(30);

// Función para calcular resumen de pagos
export const calculatePaymentSummary = (invoices: Invoice[]) => {
  const totalPaid = invoices
    .filter(invoice => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoice.total, 0);
  
  const totalPending = invoices
    .filter(invoice => invoice.status === "pending")
    .reduce((sum, invoice) => sum + invoice.total, 0);
  
  const totalOverdue = invoices
    .filter(invoice => invoice.status === "overdue")
    .reduce((sum, invoice) => sum + invoice.total, 0);
  
  return {
    totalPaid,
    totalPending,
    totalOverdue,
    totalAmount: totalPaid + totalPending + totalOverdue
  };
};
