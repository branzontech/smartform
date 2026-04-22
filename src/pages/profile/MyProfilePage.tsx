import React, { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { BackButton } from "@/App";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { SignatureUploader } from "@/components/profile/SignatureUploader";
import { UserCircle, Loader2, Save, IdCard, Stethoscope, Mail, Phone } from "lucide-react";

interface ProfileFields {
  full_name: string;
  phone: string;
  specialty: string;
  license_number: string;
}

const minimalInput =
  "h-9 rounded-none border-0 border-b border-border bg-transparent px-0 text-sm shadow-none focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/60";

const MyProfilePage: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileFields>({
    full_name: "",
    phone: "",
    specialty: "",
    license_number: "",
  });
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, specialty, license_number")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) {
        setForm({
          full_name: data?.full_name || profile?.full_name || "",
          phone: data?.phone || "",
          specialty: data?.specialty || "",
          license_number: data?.license_number || "",
        });
        setEmail(user.email || "");
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user, profile]);

  const handleChange = (key: keyof ProfileFields, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name.trim(),
          phone: form.phone.trim() || null,
          specialty: form.specialty.trim() || null,
          license_number: form.license_number.trim() || null,
        })
        .eq("user_id", user.id);
      if (error) throw error;
      toast({ title: "Perfil actualizado", description: "Tus datos se guardaron correctamente." });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "No se pudo guardar el perfil",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto py-8 px-4">
          <BackButton />
          <p className="text-sm text-muted-foreground">Inicia sesión para acceder a tu perfil.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto pt-28 pb-10 px-4 max-w-5xl">
        <BackButton />

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <UserCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Mi perfil</h1>
            <p className="text-xs text-muted-foreground">
              Actualiza tu información profesional y firma digital. Aparecerá en órdenes y documentos clínicos que firmes.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* IZQUIERDA: Datos personales y profesionales */}
            <section className="lg:col-span-3 space-y-8 border border-border rounded-lg bg-background p-6">
              <div>
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                  <UserCircle className="w-4 h-4 text-muted-foreground" /> Datos personales
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Nombre completo
                    </Label>
                    <Input
                      className={minimalInput}
                      value={form.full_name}
                      onChange={(e) => handleChange("full_name", e.target.value)}
                      placeholder="Dr. Juan Pérez"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Correo electrónico
                    </Label>
                    <Input className={minimalInput} value={email} disabled />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Teléfono
                    </Label>
                    <Input
                      className={minimalInput}
                      value={form.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="+57 300 000 0000"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Stethoscope className="w-4 h-4 text-muted-foreground" /> Información profesional
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Especialidad
                    </Label>
                    <Input
                      className={minimalInput}
                      value={form.specialty}
                      onChange={(e) => handleChange("specialty", e.target.value)}
                      placeholder="Medicina General"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                      <IdCard className="w-3 h-3" /> Registro médico / licencia
                    </Label>
                    <Input
                      className={minimalInput}
                      value={form.license_number}
                      onChange={(e) => handleChange("license_number", e.target.value)}
                      placeholder="RM 12345"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground/80 mt-3">
                  Estos datos aparecerán automáticamente en las órdenes médicas, recetas e incapacidades que generes.
                </p>
              </div>

              <div className="flex justify-end pt-2 border-t border-border">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="h-8 text-xs gap-1.5"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Guardar cambios
                </Button>
              </div>
            </section>

            {/* DERECHA: Firma digital */}
            <aside className="lg:col-span-2 border border-border rounded-lg bg-background p-6">
              <SignatureUploader />
            </aside>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyProfilePage;
