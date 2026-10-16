/**
 * Cliente de la agenda para Ker Hub web. La lógica vive en @kerhub/core
 * (compartida con la app del profesional); aquí solo se conecta a apiFetch.
 */
import { apiFetch } from "@/integrations/api/client";
import { createAgendaApi } from "@kerhub/core/agenda";

export * from "@kerhub/core/agenda";

export const {
  fetchProfessionals,
  fetchProfessional,
  saveProfessional,
  saveSchedule,
  addUnavailability,
  removeUnavailability,
  fetchSlots,
  fetchCitas,
  fetchCita,
  fetchPatientCitas,
  fetchMyDay,
  createCita,
  changeCitaState,
  rescheduleCita,
} = createAgendaApi(apiFetch);
