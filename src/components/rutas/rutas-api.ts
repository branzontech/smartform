/**
 * Rutas para Doctor Ker web (coordinación). La lógica vive en @kerhub/core
 * (compartida con la app del profesional); aquí solo se conecta a apiFetch.
 */
import { apiFetch } from "@/integrations/api/client";
import { createRoutesApi } from "@kerhub/core/rutas";

export * from "@kerhub/core/rutas";

export const { fetchDay } = createRoutesApi(apiFetch);

/** Clave del SDK de Google Maps para el navegador (restringida por dominio en Google Cloud). */
export const fetchMapsKey = () => apiFetch<{ apiKey: string }>("/api/maps/config");
