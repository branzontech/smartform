
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu correo electrónico",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    // Simulación de envío de correo exitoso
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      toast({
        title: "Correo enviado",
        description: "Revisa tu bandeja de entrada para restablecer tu contraseña",
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50">
      <div className="w-full max-w-md p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary">MediForm</h1>
          <p className="text-muted-foreground mt-2">Gestión de Formularios Médicos</p>
        </div>
        
        <Card className="w-full animate-fade-in shadow-lg border-primary/10">
          <CardHeader>
            <CardTitle className="text-2xl">Recuperar contraseña</CardTitle>
            <CardDescription>
              {!isSubmitted 
                ? "Ingresa tu correo electrónico para recuperar tu contraseña" 
                : "Te hemos enviado instrucciones para recuperar tu contraseña"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full mt-4"
                  disabled={isLoading}
                >
                  {isLoading ? "Enviando..." : "Recuperar contraseña"}
                </Button>
              </form>
            ) : (
              <div className="text-center py-4">
                <p className="mb-4">Hemos enviado un correo electrónico a <strong>{email}</strong> con las instrucciones para recuperar tu contraseña.</p>
                <p className="text-sm text-muted-foreground">Si no recibes el correo en unos minutos, revisa tu carpeta de spam o intenta de nuevo.</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <div className="text-sm text-center">
              <Link to="/app/login" className="text-primary hover:underline">
                Volver a inicio de sesión
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
