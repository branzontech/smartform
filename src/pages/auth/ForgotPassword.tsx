import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Mail, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "./AuthLayout";

const volver = (
  <Link to="/app/login" className="inline-flex items-center gap-1.5 font-medium text-foreground underline-offset-4 hover:underline">
    <ArrowLeft className="h-3.5 w-3.5" />
    Volver a iniciar sesión
  </Link>
);

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const { toast } = useToast();
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Falta el correo", description: "Ingresa el correo de tu cuenta", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await resetPassword(email.trim());
      if (error) {
        toast({ title: "No se pudo enviar", description: error.message, variant: "destructive" });
        return;
      }
      setEnviado(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (enviado) {
    return (
      <AuthLayout titulo="Te enviamos un enlace" pie={volver}>
        <div className="flex items-start gap-3 rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
          <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>
            Si <span className="font-medium text-foreground">{email}</span> tiene una cuenta en Ker Hub, recibirás un
            enlace para elegir una nueva contraseña. Caduca en una hora.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      titulo="¿Olvidaste tu contraseña?"
      descripcion="Escribe tu correo y te enviaremos un enlace para restablecerla."
      pie={volver}
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[13px] font-medium text-muted-foreground">
            Correo electrónico
          </Label>
          <div className="group relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@clinica.com"
              autoComplete="email"
              disabled={isLoading}
              className="campo-relleno focus-visible:ring-0 focus-visible:ring-offset-0 pl-10"
            />
          </div>
        </div>
        <Button type="submit" disabled={isLoading} className="group h-12 w-full rounded-xl text-[15px] font-semibold">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Enviar enlace
          {!isLoading && <ArrowRight className="ml-1.5 h-4 w-4" />}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
