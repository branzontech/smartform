import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TenantProvider } from "@/contexts/TenantContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { OnboardingWrapper } from "@/components/onboarding/OnboardingWrapper";
import { Layout } from "@/components/layout";
import { HelmetProvider } from "react-helmet-async";

import LandingPage from "./pages/landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import AppRoutes from "./routes/AppRoutes";

export const BackButton = () => {
  const navigate = useNavigate();
  
  return (
    <Button 
      variant="ghost" 
      onClick={() => navigate(-1)}
      className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-card/60 backdrop-blur-md border border-border/50 hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
    >
      <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
        <ArrowLeft className="h-4 w-4 text-primary" />
      </div>
      <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
        Volver
      </span>
    </Button>
  );
};

const queryClient = new QueryClient();

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <TenantProvider>
                <Toaster />
                <Sonner />
                <OnboardingWrapper>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/app/login" element={<Login />} />
                    <Route path="/app/register" element={<Register />} />
                    <Route path="/app/forgot-password" element={<ForgotPassword />} />
                    <Route path="/app/reset-password" element={<ResetPassword />} />

                    {/* Protected app routes */}
                    <Route path="/app/*" element={
                      <ProtectedRoute>
                        <Layout>
                          <AppRoutes />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    {/* Legacy redirects */}
                    <Route path="/crear" element={<Navigate to="/app/crear" replace />} />
                    <Route path="/pacientes" element={<Navigate to="/app/pacientes" replace />} />
                    <Route path="/citas" element={<Navigate to="/app/citas" replace />} />
                    <Route path="/configuracion" element={<Navigate to="/app/configuracion" replace />} />

                    {/* 404 */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </OnboardingWrapper>
              </TenantProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
