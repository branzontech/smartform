
export type TenantStatus = 'active' | 'suspended' | 'trial' | 'pending' | 'cancelled';
export type SubscriptionPlan = 'basic' | 'professional' | 'institutional';
export type TenantFeature = 'telemedicine' | 'billing' | 'forms' | 'appointments' | 'patients' | 'inventory' | 'reports';

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string;
  status: TenantStatus;
  plan: SubscriptionPlan;
  trialEndsAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  maxUsers: number;
  currentUsers: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  features: TenantFeature[];
  settings: TenantSettings;
  country: string;
  language: string;
  timezone: string;
}

export interface TenantSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  schedulingHours: {
    monday: { start: string; end: string; enabled: boolean };
    tuesday: { start: string; end: string; enabled: boolean };
    wednesday: { start: string; end: string; enabled: boolean };
    thursday: { start: string; end: string; enabled: boolean };
    friday: { start: string; end: string; enabled: boolean };
    saturday: { start: string; end: string; enabled: boolean };
    sunday: { start: string; end: string; enabled: boolean };
  };
  appointmentDuration: number;
  currencyCode: string;
  taxRate: number;
  allowPatientRegistration: boolean;
  requireEmailVerification: boolean;
  customTermsUrl?: string;
  customPrivacyUrl?: string;
  customFooterText?: string;
  customCss?: string;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  userId: string;
  role: 'owner' | 'admin' | 'doctor' | 'assistant' | 'receptionist';
  status: 'active' | 'invited' | 'suspended';
  permissions: string[];
  createdAt: Date;
  invitedBy?: string;
  lastLoginAt?: Date;
}

export interface TenantInvitation {
  id: string;
  tenantId: string;
  email: string;
  role: 'admin' | 'doctor' | 'assistant' | 'receptionist';
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
}

export interface TenantStats {
  totalPatients: number;
  totalAppointments: number;
  activeUsers: number;
  storageUsed: number;
  storageLimit: number;
  activeFeatures: TenantFeature[];
  lastBillingAmount: number;
  nextBillingDate: Date;
  planLimitsReached: {
    users: boolean;
    patients: boolean;
    storage: boolean;
  };
  activity: {
    date: string;
    appointments: number;
    newPatients: number;
    invoices: number;
  }[];
}
