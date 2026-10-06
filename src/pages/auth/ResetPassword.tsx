import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "./AuthLayout";

const CLAVE_MINIMA = 8;

const irALogin = (
  <Link to="/app/login" className="font-medium text-foreground underline-offset-4 hover:underline">
    Ir a iniciar sesión
  </Link>
);

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [listo, setListo] = useState(false);
  const [params] = useSearchParams();
  const token = params.get("token");
  const errorEnlace = params.get("error");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updatePassword } = useAuth();

  if (!token || errorEnlace) {
    return (
      <AuthLayout
        insignia="Enlace no válido"
        titulo="Este enlace ya no sirve"
        descripcion="Puede haber caducado o ya se usó. Pide uno nuevo desde «¿Olvidaste tu contraseña?»."
        pie={irALogin}
      >
        <Button asChild className="h-12 w-full rounded-xl text-[15px] font-semibold">
          <Link to="/app/forgot-password">Pedir un enlace nuevo</Link>
        </Button>
      </AuthLayout>
    );
  }

  if (listo) {
    return (
      <AuthLayout insignia="Contraseña actualizada" titulo="Todo listo" pie={irALogin}>
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
    if (password.length < CLAVE_MINIMA) {
      toast({ title: "Contraseña muy corta", description: `Usa al menos ${CLAVE_MINIMA} caracteres.`, variant: "destructive" });
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
      setListo(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout insignia="Nueva contraseña" titulo="Elige tu nueva contraseña" descripcion={`Mínimo ${CLAVE_MINIMA} caracteres.`} pie={irALogin}>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {[
          { id: "password", etiqueta: "Nueva contraseña", valor: password, cambiar: setPassword },
          { id: "confirmar", etiqueta: "Repite la contraseña", valor: confirmPassword, cambiar: setConfirmPassword },
        ].map((campo) => (
          <div key={campo.id} className="space-y-1.5">
            <Label htmlFor={campo.id} className="text-[13px] font-medium text-muted-foreground">
              {campo.etiqueta}
            </Label>
            <div className="group relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground" />
              <Input
                id={campo.id}
                type="password"
                value={campo.valor}
                onChange={(e) => campo.cambiar(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={isLoading}
                className="campo-relleno pl-10"
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
