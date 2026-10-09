import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "./AuthLayout";

const MIN_PASSWORD_LENGTH = 8;

const backToLogin = (
  <Link to="/app/login" className="font-medium text-foreground underline-offset-4 hover:underline">
    Ir a iniciar sesión
  </Link>
);

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [params] = useSearchParams();
  const token = params.get("token");
  const linkError = params.get("error");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updatePassword } = useAuth();

  if (!token || linkError) {
    return (
      <AuthLayout
        title="Este enlace ya no sirve"
        description="Puede haber caducado o ya se usó. Pide uno nuevo desde «¿Olvidaste tu contraseña?»."
        footer={backToLogin}
      >
        <Button asChild className="h-12 w-full rounded-xl text-[15px] font-semibold">
          <Link to="/app/forgot-password">Pedir un enlace nuevo</Link>
        </Button>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout title="Todo listo" footer={backToLogin}>
        <div className="flex items-start gap-3 rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>Ya puedes entrar con tu nueva contraseña.</p>
        </div>
        <Button onClick={() => navigate("/app/login")} className="mt-5 h-12 w-full rounded-xl text-[15px] font-semibold">
          Iniciar sesión
        </Button>
      </AuthLayout>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      toast({ title: "Contraseña muy corta", description: `Usa al menos ${MIN_PASSWORD_LENGTH} caracteres.`, variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "No coinciden", description: "Las dos contraseñas deben ser iguales.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await updatePassword(password, token);
      if (error) {
        toast({ title: "No se pudo cambiar", description: error.message, variant: "destructive" });
        return;
      }
      setDone(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Elige tu nueva contraseña" description={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`} footer={backToLogin}>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {[
          { id: "password", label: "Nueva contraseña", value: password, onChange: setPassword },
          { id: "confirm-password", label: "Repite la contraseña", value: confirmPassword, onChange: setConfirmPassword },
        ].map((field) => (
          <div key={field.id} className="space-y-1.5">
            <Label htmlFor={field.id} className="text-[13px] font-medium text-muted-foreground">
              {field.label}
            </Label>
            <div className="group relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground" />
              <Input
                id={field.id}
                type="password"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={isLoading}
                className="campo-relleno focus-visible:ring-0 focus-visible:ring-offset-0 pl-10"
              />
            </div>
          </div>
        ))}
        <Button type="submit" disabled={isLoading} className="group h-12 w-full rounded-xl text-[15px] font-semibold">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Guardar contraseña
          {!isLoading && <ArrowRight className="ml-1.5 h-4 w-4" />}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
