import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { changeCitaState, type Cita, type CitaState } from "./agenda-api";
import { clinicalRecordUrl, currentPosition, errorMessage } from "./agenda-ui";
import { LOCATION_STATES, SUCCESS_LABEL } from "./cita-actions";

interface StateChange {
  estado: CitaState;
  motivo?: string | null;
}

/**
 * Cambio de estado de una cita. Al salir en camino o iniciar la atención pide
 * la ubicación del dispositivo; si no se obtiene, el cambio sigue sin ella.
 */
export function useCitaStateChange(cita: Cita) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async ({ estado, motivo }: StateChange) => {
      const position = LOCATION_STATES.includes(estado) ? await currentPosition() : null;
      await changeCitaState(cita.id, { estado, motivo: motivo?.trim() || null, ...(position ?? {}) });
      return { estado, located: position !== null };
    },
    onSuccess: ({ estado, located }) => {
      void queryClient.invalidateQueries({ queryKey: ["agenda"] });
      const description = LOCATION_STATES.includes(estado)
        ? located ? "Ubicación registrada." : "Se guardó sin ubicación: el dispositivo no la compartió."
        : undefined;
      toast.success(SUCCESS_LABEL[estado] ?? "Cita actualizada", {
        description,
        action: estado === "en_atencion"
          ? { label: "Abrir historia clínica", onClick: () => navigate(clinicalRecordUrl(cita)) }
          : undefined,
      });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}
