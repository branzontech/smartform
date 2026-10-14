import { Navigate, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, type CompanyBlock } from "@/contexts/AuthContext";
import { AuthLayout } from "@/pages/auth/AuthLayout";

const BLOCK_REASON: Record<string, string> = {
  suspendida: "está suspendida",
  vencida: "tiene la licencia vencida",
  por_iniciar: "aún no inicia su licencia",
  pendiente: "aún no está activa",
};

function blockText(blocks: CompanyBlock[]): string {
  if (!blocks.length) return "Tu cuenta no pertenece a ninguna empresa activa. Pide a tu administrador que te invite.";
  return blocks.map((b) => `${b.nombre} ${BLOCK_REASON[b.estado] ?? "no está disponible"}`).join(". ") + ". Comunícate con su administrador o con el equipo de Ker Hub.";
}

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, company, blocks, isPlatformAdmin, signOut } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/app/login" state={{ from: location }} replace />;
  }

  // Sin empresa con acceso no hay datos que ver: el dueño de plataforma va a Empresas; el resto, sabe por qué.
  if (!company) {
    if (isPlatformAdmin) {
      return location.pathname.startsWith("/app/plataforma") ? <>{children}</> : <Navigate to="/app/plataforma/empresas" replace />;
    }
    return (
      <AuthLayout title="Sin acceso por ahora" description={blockText(blocks)}>
        <Button onClick={() => void signOut()} variant="outline" className="h-12 w-full rounded-xl text-[15px] font-semibold">
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </Button>
      </AuthLayout>
    );
  }

  return <>{children}</>;
};
