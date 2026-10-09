import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { currentEnvironment, ENVIRONMENTS, selectEnvironment, type EnvironmentId } from "@/config/environments";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "./AuthLayout";

/**
 * Ambiente al que se entra: decide a qué API y a qué base habla la web desde
 * este mismo login. Solo aparece cuando hay más de uno (en local).
 */
function EnvironmentSelect({ value, onChange, disabled }: { value: EnvironmentId; onChange: (id: EnvironmentId) => void; disabled: boolean }) {
  if (ENVIRONMENTS.length < 2) return null;
  const selected = ENVIRONMENTS.find((e) => e.id === value) ?? ENVIRONMENTS[0];
  return (
    <div className="space-y-1.5">
      <Label htmlFor="environment" className="text-[13px] font-medium text-muted-foreground">
        Ambiente
      </Label>
      <div className="relative">
        <Server className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Select value={value} onValueChange={(v) => onChange(v as EnvironmentId)} disabled={disabled}>
          <SelectTrigger id="environment" className="campo-relleno h-11 pl-10 focus:ring-0 focus:ring-offset-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ENVIRONMENTS.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className={`text-[12px] ${selected.id === "produccion" ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"}`}>
        {selected.description}
      </p>
    </div>
  );
}

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [environment, setEnvironment] = useState<EnvironmentId>(() => currentEnvironment().id);
  const queryClient = useQueryClient();
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  // ProtectedRoute deja en `from` la ubicación que se intentaba abrir.
  const from = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
  const redirectTo = from?.pathname?.startsWith("/app") ? `${from.pathname}${from.search ?? ""}` : "/app/home";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Faltan datos", description: "Ingresa tu correo y contraseña", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    selectEnvironment(environment);
    try {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        toast({ title: "No pudimos iniciar sesión", description: "Verifica tu correo y contraseña.", variant: "destructive" });
        return;
      }
      // Nada en caché de otro ambiente ni de otro usuario.
      queryClient.clear();
      navigate(redirectTo, { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Bienvenido de nuevo" description="Ingresa con tu correo para continuar.">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <EnvironmentSelect value={environment} onChange={setEnvironment} disabled={isLoading} />
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

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[13px] font-medium text-muted-foreground">
            Contraseña
          </Label>
          <div className="group relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isLoading}
              className="campo-relleno focus-visible:ring-0 focus-visible:ring-offset-0 pl-10 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Link to="/app/forgot-password" className="text-[13px] font-medium text-foreground underline-offset-4 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="group h-12 w-full rounded-xl text-[15px] font-semibold shadow-[0_10px_24px_-12px_hsl(var(--primary)/0.7)] transition-[color,background-color,box-shadow,transform] duration-200 hover:shadow-[0_14px_28px_-12px_hsl(var(--primary)/0.75)] motion-safe:hover:-translate-y-px active:translate-y-0"
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Entrar
          {!isLoading && <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5" />}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default Login;
