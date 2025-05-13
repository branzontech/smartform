
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Tenant, SubscriptionPlan, TenantFeature } from "@/types/tenant-types";

// Interface for context
interface TenantContextType {
  tenant: Tenant | null;
  isLoading: boolean;
  error: string | null;
  plan: SubscriptionPlan | null;
  hasFeature: (feature: TenantFeature) => boolean;
  isTrialActive: boolean;
  daysLeftInTrial: number | null;
  isPlanExpired: boolean;
  reloadTenant: () => Promise<void>;
}

// Default values for the context
const defaultTenantContext: TenantContextType = {
  tenant: null,
  isLoading: true,
  error: null,
  plan: null,
  hasFeature: () => false,
  isTrialActive: false,
  daysLeftInTrial: null,
  isPlanExpired: false,
  reloadTenant: async () => {},
};

// Create the context
const TenantContext = createContext<TenantContextType>(defaultTenantContext);

// Custom hook for using tenant context
export const useTenant = () => useContext(TenantContext);

// Mock function to get tenant data - this would be replaced with an API call
const fetchTenantData = async (): Promise<Tenant> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return mock data
  return {
    id: "tenant-1",
    name: "Clínica San Rafael",
    subdomain: "sanrafael",
    status: "active",
    plan: "professional",
    trialEndsAt: new Date(new Date().setDate(new Date().getDate() + 7)), // 7 days from now
    createdAt: new Date(),
    maxUsers: 10,
    currentUsers: 3,
    features: ["telemedicine", "billing", "forms", "appointments", "patients", "reports"],
    settings: {
      emailNotifications: true,
      smsNotifications: true,
      schedulingHours: {
        monday: { start: "08:00", end: "18:00", enabled: true },
        tuesday: { start: "08:00", end: "18:00", enabled: true },
        wednesday: { start: "08:00", end: "18:00", enabled: true },
        thursday: { start: "08:00", end: "18:00", enabled: true },
        friday: { start: "08:00", end: "18:00", enabled: true },
        saturday: { start: "09:00", end: "13:00", enabled: true },
        sunday: { start: "00:00", end: "00:00", enabled: false },
      },
      appointmentDuration: 30,
      currencyCode: "MXN",
      taxRate: 16.0,
      allowPatientRegistration: true,
      requireEmailVerification: true
    },
    country: "México",
    language: "es",
    timezone: "America/Mexico_City"
  };
};

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider = ({ children }: TenantProviderProps) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate derived state
  const plan = tenant?.plan || null;
  const isTrialActive = tenant?.status === "trial" && tenant?.trialEndsAt ? new Date() < tenant.trialEndsAt : false;
  
  const daysLeftInTrial = tenant?.trialEndsAt 
    ? Math.max(0, Math.ceil((tenant.trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) 
    : null;
  
  const isPlanExpired = tenant?.status === "cancelled" || tenant?.status === "suspended";

  // Check if tenant has a specific feature
  const hasFeature = (feature: TenantFeature): boolean => {
    if (!tenant) return false;
    return tenant.features.includes(feature);
  };

  // Function to reload tenant data
  const reloadTenant = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTenantData();
      setTenant(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading tenant data");
    } finally {
      setIsLoading(false);
    }
  };

  // Load tenant data on component mount
  useEffect(() => {
    const loadTenant = async () => {
      try {
        const data = await fetchTenantData();
        setTenant(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading tenant data");
      } finally {
        setIsLoading(false);
      }
    };

    loadTenant();
  }, []);

  // Context value
  const contextValue: TenantContextType = {
    tenant,
    isLoading,
    error,
    plan,
    hasFeature,
    isTrialActive,
    daysLeftInTrial,
    isPlanExpired,
    reloadTenant
  };

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
};
