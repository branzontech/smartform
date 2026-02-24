import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Eye, EyeOff, Mail, Lock, User, X, ArrowRight, Shield, Clock, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const benefits = [
  { icon: Clock, text: "14 días de prueba gratis" },
  { icon: Shield, text: "Datos 100% seguros" },
  { icon: Sparkles, text: "Sin tarjeta de crédito" },
];

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast({ title: "Error", description: "Por favor completa todos los campos", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(email, password, name);
    setIsLoading(false);

    if (error) {
      toast({ title: "Error al registrarse", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "¡Cuenta creada!",
        description: "Revisa tu correo electrónico para confirmar tu cuenta.",
      });
      navigate("/app/login");
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-auto bg-background">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 -right-32 w-[500px] h-[500px] bg-secondary/15 rounded-full blur-[120px]"
        />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: "linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Left - Benefits */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex w-1/2 flex-col justify-center p-12 xl:p-20"
      >
        <Link to="/" className="flex items-center gap-3 mb-12">
          <img src="/kerhub-logo.png" alt="Ker Hub" className="h-14 w-auto" />
        </Link>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl xl:text-5xl font-bold mb-6"
        >
          Comienza a gestionar tu práctica{" "}
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            como un profesional
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg text-muted-foreground mb-10"
        >
          Únete a profesionales de la salud que ya optimizaron su consulta con Ker Hub.
        </motion.p>

        <div className="space-y-4">
          {benefits.map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <benefit.icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-foreground font-medium">{benefit.text}</span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-12 p-6 bg-card border border-border/50 rounded-2xl"
        >
          <p className="text-muted-foreground italic mb-4">
            "Ker Hub transformó mi práctica médica. Ahora puedo atender más pacientes sin perder tiempo en tareas administrativas."
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-semibold text-sm">
              MG
            </div>
            <div>
              <div className="font-medium text-sm">Dra. María González</div>
              <div className="text-xs text-muted-foreground">Médico General - Bogotá</div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Right - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex lg:hidden items-center justify-center mb-8">
            <img src="/kerhub-logo.png" alt="Ker Hub" className="h-12 w-auto" />
          </Link>

          <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Crear Cuenta</h2>
              <p className="text-muted-foreground">Ingresa tus datos para comenzar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Dr. Juan Pérez"
                    className="pl-10 h-12 bg-background border-border/50 focus:border-primary"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Correo electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="doctor@ejemplo.com"
                    className="pl-10 h-12 bg-background border-border/50 focus:border-primary"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-12 bg-background border-border/50 focus:border-primary"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Confirmar contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-12 bg-background border-border/50 focus:border-primary"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  {confirmPassword && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      {confirmPassword === password ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <X className="w-5 h-5 text-destructive" />
                      )}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Al registrarte, aceptas nuestros{" "}
                <a href="#" className="text-primary hover:underline">Términos de Servicio</a>
                {" "}y{" "}
                <a href="#" className="text-primary hover:underline">Política de Privacidad</a>
              </p>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 group"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Creando cuenta...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Crear Cuenta
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>
              </motion.div>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              ¿Ya tienes una cuenta?{" "}
              <Link to="/app/login" className="text-primary font-medium hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            <Link to="/" className="hover:text-foreground transition-colors">
              ← Volver al inicio
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
