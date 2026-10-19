/**
 * Cliente de planes de sesiones (citas recurrentes) para Doctor Ker web. La
 * lógica vive en @kerhub/core/planes (compartida con la app del profesional).
 */
import { apiFetch } from "@/integrations/api/client";
import { createPlansApi } from "@kerhub/core/planes";

export * from "@kerhub/core/planes";

export const { previewPlan, createPlan, extendPlan, fetchPlan, fetchPatientPlans, changePlanProfessional, cancelPlan } = createPlansApi(apiFetch);
