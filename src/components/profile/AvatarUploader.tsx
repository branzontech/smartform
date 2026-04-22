import React, { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Camera, Loader2, Trash2, Upload } from "lucide-react";

const MAX_SIZE_MB = 2;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export const AvatarUploader: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const initials = (profile?.full_name || user?.email || "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    e.target.value = ""; // allow re-picking same file

    if (!ACCEPTED.includes(file.type)) {
      toast({
        title: "Formato no soportado",
        description: "Usa JPG, PNG o WEBP.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: `El máximo permitido es ${MAX_SIZE_MB}MB.`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { cacheControl: "3600", upsert: true });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id);
      if (updErr) throw updErr;

      await refreshProfile();
      toast({ title: "Foto actualizada", description: "Tu avatar fue actualizado correctamente." });
    } catch (err: any) {
      toast({
        title: "Error al subir foto",
        description: err.message || "Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!user) return;
    setRemoving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("user_id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast({ title: "Foto eliminada", description: "Volvió a usarse el avatar generado." });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "No se pudo eliminar la foto.",
        variant: "destructive",
      });
    } finally {
      setRemoving(false);
    }
  };

  const hasCustom = !!profile?.avatar_url;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Camera className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Foto de perfil</h2>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative">
          <UserAvatar
            seed={user?.id || user?.email || undefined}
            src={profile?.avatar_url}
            initials={initials}
            alt="Foto de perfil"
            className="w-20 h-20 ring-2 ring-border"
          />
          {(uploading || removing) && (
            <div className="absolute inset-0 rounded-full bg-background/70 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handlePick}
            disabled={uploading || removing}
            className="h-8 text-xs gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            {hasCustom ? "Cambiar foto" : "Subir foto"}
          </Button>
          {hasCustom && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleRemove}
              disabled={uploading || removing}
              className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Quitar foto
            </Button>
          )}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
        Si no subes una foto, se mostrará un avatar único generado automáticamente. Formatos: JPG, PNG, WEBP. Máximo {MAX_SIZE_MB}MB.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
};

export default AvatarUploader;
