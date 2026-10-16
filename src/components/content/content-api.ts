/**
 * Cliente del contenido de la app (Inicio) para Doctor Ker web. La lógica vive en
 * @kerhub/core (compartida con las apps, que lo muestran); aquí solo se conecta a apiFetch.
 */
import { apiFetch } from "@/integrations/api/client";
import { createContentApi } from "@kerhub/core/contenido";

export * from "@kerhub/core/contenido";

export const { fetchAll, createContent, updateContent, deleteContent } = createContentApi(apiFetch);
