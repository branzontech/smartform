import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError, apiFetch } from "@/integrations/api/client";
import { AuthLayout } from "./AuthLayout";

/**
 * Enlace de invitación: /app/invitacion#t=<token>.
 *
 * El token llega en el fragmento (#), que el navegador nunca envía a un
 * servidor. Se lee una vez, se borra de la barra de direcciones y solo vive en
 * memoria; viaja a la API en el cuerpo de un POST.
 */

interface Preview {
  tipo: "empresa" | "miembro";
  empresa: string;
  email: string;
  rol: string;
  cuentaExiste: boolean;
  expiraEn: string;
}

const MIN_PASSWORD = 10;

function readTokenOnce(): string | null {
  const token = new URLSearchParams(window.location.hash.slice(1)).get("t");
  if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
  return token;
}

const errorText = (e: unknown) => (e instanceof ApiError || e instanceof Error ? e.message : "Algo salió mal. Intenta de nuevo.");

/** Entrar a la empresa recién aceptada con la app limpia (sin caché de otra sesión). */
const enterApp = () => window.location.assign("/app/home");

export default function AcceptInvitation() {
  const { user, isLoading: sessionLoading, signIn, signOut } = useAuth();
  const tokenRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [invalid, setInvalid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (tokenRef.current === null) tokenRef.current = readTokenOnce();
    const token = tokenRef.current;
    if (!token) {
      setInvalid("El enlace está incompleto. Ábrelo de nuevo desde el correo.");
      return;
    }
    apiFetch<Preview>("/api/invitaciones/verificar", { method: "POST", body: JSON.stringify({ token }) })
      .then(setPreview)
      .catch((e) => setInvalid(errorText(e)));
  }, []);

  const accept = (extra: Record<string, string> = {}) =>
    apiFetch("/api/invitaciones/aceptar", { method: "POST", body: JSON.stringify({ token: tokenRef.current, ...extra }) });

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const createAccount = (e: FormEvent) => {
    e.preventDefault();
    if (!preview) return;
    if (password.length < MIN_PASSWORD) return setError(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
    if (password !== confirm) return setError("Las contraseñas no coinciden.");
    void run(async () => {
      await accept({ nombre: name.trim(), password });
      const { error: signInError } = await signIn(preview.email, password);
      if (signInError) throw new Error("Tu cuenta quedó creada, pero no pudimos iniciar sesión. Entra desde el login.");
      enterApp();
    });
  };

  const signInAndAccept = (e: FormEvent) => {
    e.preventDefault();
    if (!preview) return;
    void run(async () => {
      const { error: signInError } = await signIn(preview.email, password);
      if (signInError) throw new Error("La contraseña no es correcta.");
      await accept();
      enterApp();
    });
  };

  const joinWithSession = () =>
    void run(async () => {
      await accept();
      enterApp();
    });

  if (invalid) {
    return (
      <AuthLayout title="Invitación no disponible" description={invalid}>
        <Button asChild className="h-12 w-full rounded-xl text-[15px] font-semibold">
          <Link to="/app/login">Ir al inicio de sesión</Link>
        </Button>
      </AuthLayout>
    );
  }

  if (!preview || sessionLoading) {
    return (
      <AuthLayout title="Revisando tu invitación" description="Un momento…">
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AuthLayout>
    );
  }

  const title = preview.tipo === "empresa" ? `Activa ${preview.empresa}` : `Únete a ${preview.empresa}`;
  const description =
    preview.tipo === "empresa" ? "Serás el administrador de la empresa en Doctor Ker." : `Te invitan como ${preview.rol.toLowerCase()}.`;
  const sameUser = !!user && user.email.toLowerCase() === preview.email;
  const errorLine = error ? <p role="alert" className="text-[13px] text-destructive">{error}</p> : null;

  // Con sesión de otra cuenta: la invitación está atada a su correo.
  if (user && !sameUser) {
    return (
      <AuthLayout title={title} description={description}>
        <div className="space-y-5">
          <p className="text-[14px] text-muted-foreground">
            Esta invitación es para <span className="font-medium text-foreground">{preview.email}</span>, pero entraste como{" "}
            <span className="font-medium text-foreground">{user.email}</span>. Cierra sesión y abre el enlace de nuevo.
          </p>
          <Button onClick={() => void signOut()} className="h-12 w-full rounded-xl text-[15px] font-semibold">
            Cerrar sesión
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (sameUser) {
    return (
      <AuthLayout title={title} description={description}>
        <div className="space-y-5">
          <p className="text-[14px] text-muted-foreground">
            Entraste como <span className="font-medium text-foreground">{preview.email}</span>.
          </p>
          {errorLine}
          <Button onClick={joinWithSession} disabled={busy} className="h-12 w-full rounded-xl text-[15px] font-semibold">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {preview.tipo === "empresa" ? "Activar empresa" : "Unirme"}
          </Button>
        </div>
      </AuthLayout>
    );
  }

  const emailField = (
    <div className="space-y-1.5">
      <Label htmlFor="email" className="text-[13px] font-medium text-muted-foreground">
        Correo electrónico
      </Label>
      <div className="relative">
        <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="email"
          value={preview.email}
          readOnly
          className="campo-relleno pl-10 text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
    </div>
  );

  const passwordField = (id: string, label: string, value: string, onChange: (v: string) => void, autoComplete: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[13px] font-medium text-muted-foreground">
        {label}
      </Label>
      <div className="group relative">
        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground" />
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          disabled={busy}
          className="campo-relleno pl-10 pr-11 focus-visible:ring-0 focus-visible:ring-offset-0"
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
  );

  const submit = (label: string) => (
    <Button type="submit" disabled={busy} className="group h-12 w-full rounded-xl text-[15px] font-semibold">
      {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {label}
      {!busy && <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5" />}
    </Button>
  );

  // Ya tiene cuenta (en otra empresa): entra con su contraseña y acepta.
  if (preview.cuentaExiste) {
    return (
      <AuthLayout title={title} description={description}>
        <form onSubmit={signInAndAccept} className="space-y-5" noValidate>
          <p className="text-[14px] text-muted-foreground">Ya tienes cuenta en Doctor Ker. Entra para aceptar.</p>
          {emailField}
          {passwordField("password", "Contraseña", password, setPassword, "current-password")}
          {errorLine}
          {submit("Entrar y aceptar")}
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={title} description={description}>
      <form onSubmit={createAccount} className="space-y-5" noValidate>
        {emailField}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-[13px] font-medium text-muted-foreground">
            Nombre completo
          </Label>
          <div className="group relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground" />
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              disabled={busy}
              className="campo-relleno pl-10 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
        {passwordField("password", "Contraseña", password, setPassword, "new-password")}
        {passwordField("confirm", "Confirmar contraseña", confirm, setConfirm, "new-password")}
        <p className="text-[12px] text-muted-foreground">Mínimo {MIN_PASSWORD} caracteres, sin tu correo.</p>
        {errorLine}
        {submit(preview.tipo === "empresa" ? "Crear cuenta y activar" : "Crear cuenta y unirme")}
      </form>
    </AuthLayout>
  );
}
