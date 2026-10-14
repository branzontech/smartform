import { apiFetch } from "@/integrations/api/client";

/** Roles que una empresa asigna a su personal (iguales a los del servidor). */
export const STAFF_ROLES = ["admin", "doctor", "nurse", "receptionist"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  doctor: "Médico",
  nurse: "Enfermería",
  receptionist: "Admisiones",
  patient: "Paciente",
  user: "Sin rol",
};

export interface Member {
  userId: string;
  nombre: string;
  email: string;
  rol: string;
  estado: "activo" | "suspendido";
  desde: string;
}

export interface PendingInvitation {
  id: string;
  email: string;
  rol: string;
  expiraEn: string;
  enviadaEn: string | null;
  creadaEn: string;
}

export interface CompanyUsers {
  empresa: string | null;
  miembros: Member[];
  invitaciones: PendingInvitation[];
}

export type LicenseState = "pendiente" | "suspendida" | "por_iniciar" | "vigente" | "por_vencer" | "en_gracia" | "vencida";

export const LICENSE_LABEL: Record<LicenseState, string> = {
  pendiente: "Sin activar",
  suspendida: "Suspendida",
  por_iniciar: "Por iniciar",
  vigente: "Vigente",
  por_vencer: "Por vencer",
  en_gracia: "En periodo de gracia",
  vencida: "Vencida",
};

export const COUNTRY_LABEL: Record<string, string> = { CO: "Colombia", MX: "México", EC: "Ecuador", PE: "Perú" };

/** Datos editables de la empresa y su licencia (lo que acepta la API). */
export interface CompanyInput {
  nombre: string;
  nit: string | null;
  pais: string;
  plan: string | null;
  sillas: number | null;
  licenciaInicio: string | null;
  licenciaFin: string | null;
  diasGracia: number;
  contactoNombre: string | null;
  contactoEmail: string | null;
  contactoTelefono: string | null;
  notas: string | null;
}

export interface PlatformCompany extends CompanyInput {
  id: string;
  estado: "pendiente" | "activa" | "suspendida";
  sillasUsadas: number;
  invitacionesAbiertas: number;
  motivoSuspension: string | null;
  creadaEn: string;
  licencia: { estado: LicenseState; acceso: boolean; graciaHasta?: string };
}

export interface CompanyEvent {
  id: number;
  evento: "creada" | "actualizada" | "suspendida" | "reactivada" | "activada";
  detalle: Record<string, unknown>;
  fecha: string;
  actor: string | null;
}

export interface PlatformCompanyDetail extends PlatformCompany {
  usuarios: Member[];
  invitaciones: (PendingInvitation & { tipo: "empresa" | "miembro" })[];
  eventos: CompanyEvent[];
}

const post = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

// Empresa activa (administrador)
export const fetchCompanyUsers = () => apiFetch<CompanyUsers>("/api/empresa/miembros");
export const inviteMember = (email: string, rol: StaffRole) => post<{ enviada: boolean }>("/api/empresa/invitaciones", { email, rol });
export const resendMemberInvitation = (id: string) => post<{ enviada: boolean }>(`/api/empresa/invitaciones/${id}/reenviar`);
export const revokeMemberInvitation = (id: string) => post(`/api/empresa/invitaciones/${id}/revocar`);
export const updateMember = (userId: string, change: { rol?: StaffRole; estado?: "activo" | "suspendido" }) =>
  apiFetch(`/api/empresa/miembros/${userId}`, { method: "PATCH", body: JSON.stringify(change) });

// Plataforma (Branzon)
export const fetchPlatformCompanies = () => apiFetch<PlatformCompany[]>("/api/plataforma/empresas");
export const fetchPlatformCompany = (id: string) => apiFetch<PlatformCompanyDetail>(`/api/plataforma/empresas/${id}`);
export const createCompany = (input: CompanyInput) => post<{ id: string }>("/api/plataforma/empresas", input);
export const updateCompany = (id: string, changes: Partial<CompanyInput>) =>
  apiFetch(`/api/plataforma/empresas/${id}`, { method: "PATCH", body: JSON.stringify(changes) });
export const suspendCompany = (id: string, motivo: string) => post(`/api/plataforma/empresas/${id}/suspender`, { motivo });
export const reactivateCompany = (id: string) => post(`/api/plataforma/empresas/${id}/reactivar`);
export const inviteCompanyAdmin = (id: string, email: string) => post<{ enviada: boolean }>(`/api/plataforma/empresas/${id}/invitaciones`, { email });
export const resendCompanyInvitation = (id: string) => post<{ enviada: boolean }>(`/api/plataforma/invitaciones/${id}/reenviar`);
export const revokeCompanyInvitation = (id: string) => post(`/api/plataforma/invitaciones/${id}/revocar`);

/** Estado de una invitación abierta para mostrar en la tabla. */
export function invitationState(inv: { expiraEn: string; enviadaEn: string | null }): "vencida" | "sin_enviar" | "enviada" {
  if (new Date(inv.expiraEn).getTime() <= Date.now()) return "vencida";
  return inv.enviadaEn ? "enviada" : "sin_enviar";
}

/** Mensaje tras invitar o reenviar: si el correo no salió, se dice sin rodeos. */
export const deliveryMessage = (enviada: boolean) =>
  enviada ? "Invitación enviada por correo." : "La invitación quedó creada, pero el correo no salió. Revisa la configuración de correo y reenvíala.";
