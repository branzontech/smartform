import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_LABEL, STAFF_ROLES, type StaffRole } from "./tenancy-api";

export type InviteInput = { kind: "member"; email: string; rol: StaffRole } | { kind: "admin"; email: string };

interface InviteDialogProps {
  /** member: personal de la empresa activa, con rol. admin: administrador de una empresa (plataforma). */
  kind: "member" | "admin";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: InviteInput) => Promise<void>;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Invitar a una persona a la empresa activa, o (plataforma) al administrador de una empresa. */
export function InviteDialog({ kind, open, onOpenChange, onSubmit }: InviteDialogProps) {
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState<StaffRole>("doctor");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setEmail("");
    setRol("doctor");
    setError(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!EMAIL.test(email.trim())) return setError("El correo no es válido.");
    setBusy(true);
    setError(null);
    try {
      await onSubmit(kind === "member" ? { kind, email: email.trim(), rol } : { kind, email: email.trim() });
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar la invitación.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md rounded-2xl">
        <form onSubmit={submit} noValidate className="space-y-5">
          <DialogHeader>
            <DialogTitle>{kind === "member" ? "Invitar usuario" : "Invitar administrador"}</DialogTitle>
            <DialogDescription>
              {kind === "member"
                ? "Le llega un enlace por correo, de un solo uso y válido por 72 horas."
                : "Recibe un enlace de un solo uso, válido por 72 horas, para crear su cuenta y administrar la empresa. Ocupa una silla."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="invite-email">{kind === "member" ? "Correo" : "Correo del administrador"}</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              autoFocus
            />
          </div>

          {kind === "member" && (
            <div className="space-y-1.5">
              <Label htmlFor="invite-role">Rol</Label>
              <Select value={rol} onValueChange={(v) => setRol(v as StaffRole)}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAFF_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && <p role="alert" className="text-[13px] text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              disabled={busy}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar invitación
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
