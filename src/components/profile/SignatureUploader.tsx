import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, Trash2, Loader2, PenTool } from 'lucide-react';

/**
 * Allows the authenticated user to upload / replace / remove their signature.
 * Stored under bucket `signatures/{userId}/signature.{ext}`.
 * URL persisted in profiles.signature_url.
 */
export const SignatureUploader: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [doctorMeta, setDoctorMeta] = useState<{ full_name?: string; specialty?: string; license_number?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('signature_url, full_name, specialty, license_number')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!cancelled && data) {
        setSignatureUrl(data.signature_url || null);
        setDoctorMeta({
          full_name: data.full_name || undefined,
          specialty: data.specialty || undefined,
          license_number: data.license_number || undefined,
        });
      }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [user]);

  const handleSelectFile = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Formato no válido', description: 'Sube una imagen PNG o JPG', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Archivo muy grande', description: 'La firma no puede exceder 2 MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `${user.id}/signature.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('signatures')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from('signatures').getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`;

      const { error: profErr } = await supabase
        .from('profiles')
        .update({ signature_url: publicUrl })
        .eq('user_id', user.id);
      if (profErr) throw profErr;

      setSignatureUrl(publicUrl);
      toast({ title: 'Firma actualizada', description: 'Aparecerá en tus órdenes médicas.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'No se pudo subir la firma', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!user) return;
    setUploading(true);
    try {
      // Try to remove file (best-effort, both common extensions)
      await supabase.storage.from('signatures').remove([
        `${user.id}/signature.png`,
        `${user.id}/signature.jpg`,
        `${user.id}/signature.jpeg`,
        `${user.id}/signature.webp`,
      ]);
      const { error } = await supabase
        .from('profiles')
        .update({ signature_url: null })
        .eq('user_id', user.id);
      if (error) throw error;
      setSignatureUrl(null);
      toast({ title: 'Firma eliminada' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'No se pudo eliminar', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <p className="text-xs text-muted-foreground">Inicia sesión para configurar tu firma.</p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-medium text-foreground">Firma digital</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Imagen PNG o JPG con fondo transparente o blanco. Aparecerá en órdenes, recetas y documentos clínicos que firmes.
        </p>
      </div>

      <div className="border border-border rounded-lg bg-muted/20 p-5">
        <div className="flex flex-col items-center justify-center gap-3 min-h-[140px]">
          {signatureUrl ? (
            <img
              src={signatureUrl}
              alt="Firma actual"
              className="max-h-[110px] max-w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center text-muted-foreground/60">
              <PenTool className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs">Sin firma cargada</p>
            </div>
          )}
        </div>

        {(doctorMeta?.full_name || doctorMeta?.specialty || doctorMeta?.license_number) && (
          <div className="border-t border-dashed border-border/60 mt-3 pt-3 text-center">
            {doctorMeta.full_name && (
              <p className="text-xs font-semibold text-foreground">{doctorMeta.full_name}</p>
            )}
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {[doctorMeta.specialty, doctorMeta.license_number && `Reg. ${doctorMeta.license_number}`]
                .filter(Boolean).join(' · ')}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          variant="outline" size="sm"
          onClick={handleSelectFile}
          disabled={uploading}
          className="h-8 text-xs gap-1.5"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {signatureUrl ? 'Reemplazar firma' : 'Subir firma'}
        </Button>
        {signatureUrl && (
          <Button
            variant="ghost" size="sm"
            onClick={handleRemove}
            disabled={uploading}
            className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" /> Eliminar
          </Button>
        )}
      </div>
    </div>
  );
};

export default SignatureUploader;
