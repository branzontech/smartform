
export type CustomerStatus = 'Lead' | 'Activo' | 'Inactivo' | 'Potencial';
export type CustomerFrequency = 'Frecuente' | 'Regular' | 'Esporádico' | 'Nuevo';
export type CustomerLoyalty = 'Alta' | 'Media' | 'Baja' | 'Sin historial';
export type NotificationType = 'Recordatorio' | 'Felicitación' | 'Promoción' | 'General';
export type NotificationChannel = 'WhatsApp' | 'Email' | 'Ambos';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  status: CustomerStatus;
  frequency: CustomerFrequency;
  loyalty: CustomerLoyalty;
  lastContact?: Date;
  nextContactDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
  tags?: string[];
  appointmentCount: number;
  totalSpent: number;
  lastAppointment?: Date;
  birthday?: Date;
  address?: string;
  profileImage?: string;
}

export interface CustomerNotification {
  id: string;
  customerId: string | 'all';
  customerName?: string;
  type: NotificationType;
  channel: NotificationChannel;
  subject: string;
  message: string;
  imageUrl?: string;
  scheduledFor?: Date;
  sentAt?: Date;
  status: 'Pendiente' | 'Enviado' | 'Fallido';
  createdAt: Date;
  updatedAt?: Date;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  customersByStatus: {
    name: string;
    value: number;
  }[];
  customersByFrequency: {
    name: string;
    value: number;
  }[];
  notificationsSent: number;
  appointmentsBooked: number;
  revenueGenerated: number;
  customerRetentionRate: number;
  customersByMonth: {
    month: string;
    count: number;
  }[];
}
