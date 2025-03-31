
import { toast } from "sonner";

// Scope necesario para acceder al calendario del usuario
const SCOPES = 'https://www.googleapis.com/auth/calendar';

// ID de cliente de Google (este es un ejemplo, deberías usar tu propio ID)
const CLIENT_ID = ''; // Necesitarás obtener este ID del Google Cloud Console

// Función para inicializar la API de Google
export const initGoogleApi = () => {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('client:auth2', () => {
        window.gapi.client.init({
          apiKey: '',
          clientId: CLIENT_ID,
          scope: SCOPES,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
        }).then(() => {
          resolve();
        }).catch((error: any) => {
          console.error('Error initializing Google API:', error);
          reject(error);
        });
      });
    };
    script.onerror = (error) => {
      console.error('Error loading Google API script:', error);
      reject(error);
    };
    document.body.appendChild(script);
  });
};

// Verificar si el usuario está autenticado con Google
export const isUserSignedIn = () => {
  if (!window.gapi || !window.gapi.auth2) return false;
  const authInstance = window.gapi.auth2.getAuthInstance();
  return authInstance && authInstance.isSignedIn.get();
};

// Iniciar sesión con Google
export const signInWithGoogle = () => {
  if (!window.gapi || !window.gapi.auth2) {
    toast.error("La API de Google no está inicializada correctamente");
    return Promise.reject("API no inicializada");
  }
  
  return window.gapi.auth2.getAuthInstance().signIn();
};

// Cerrar sesión con Google
export const signOutFromGoogle = () => {
  if (!window.gapi || !window.gapi.auth2) return Promise.resolve();
  
  return window.gapi.auth2.getAuthInstance().signOut();
};

// Crear un evento en Google Calendar
export const createGoogleCalendarEvent = async (appointment: {
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
}) => {
  if (!isUserSignedIn()) {
    await signInWithGoogle();
  }
  
  const event = {
    'summary': appointment.title,
    'location': appointment.location || '',
    'description': appointment.description || '',
    'start': {
      'dateTime': appointment.start.toISOString(),
      'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    'end': {
      'dateTime': appointment.end.toISOString(),
      'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    'reminders': {
      'useDefault': true
    }
  };

  try {
    const response = await window.gapi.client.calendar.events.insert({
      'calendarId': 'primary',
      'resource': event
    });
    
    return response.result;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    toast.error("Error al crear evento en Google Calendar");
    throw error;
  }
};

// Actualizar un evento en Google Calendar
export const updateGoogleCalendarEvent = async (
  eventId: string,
  appointment: {
    title: string;
    description?: string;
    location?: string;
    start: Date;
    end: Date;
  }
) => {
  if (!isUserSignedIn()) {
    await signInWithGoogle();
  }
  
  const event = {
    'summary': appointment.title,
    'location': appointment.location || '',
    'description': appointment.description || '',
    'start': {
      'dateTime': appointment.start.toISOString(),
      'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    'end': {
      'dateTime': appointment.end.toISOString(),
      'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  };

  try {
    const response = await window.gapi.client.calendar.events.update({
      'calendarId': 'primary',
      'eventId': eventId,
      'resource': event
    });
    
    return response.result;
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    toast.error("Error al actualizar evento en Google Calendar");
    throw error;
  }
};

// Eliminar un evento de Google Calendar
export const deleteGoogleCalendarEvent = async (eventId: string) => {
  if (!isUserSignedIn()) {
    await signInWithGoogle();
  }
  
  try {
    await window.gapi.client.calendar.events.delete({
      'calendarId': 'primary',
      'eventId': eventId
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    toast.error("Error al eliminar evento de Google Calendar");
    throw error;
  }
};

// Obtener eventos del Google Calendar
export const listGoogleCalendarEvents = async (
  timeMin: Date = new Date(),
  timeMax: Date = new Date(new Date().setMonth(new Date().getMonth() + 1))
) => {
  if (!isUserSignedIn()) {
    await signInWithGoogle();
  }
  
  try {
    const response = await window.gapi.client.calendar.events.list({
      'calendarId': 'primary',
      'timeMin': timeMin.toISOString(),
      'timeMax': timeMax.toISOString(),
      'showDeleted': false,
      'singleEvents': true,
      'orderBy': 'startTime'
    });
    
    return response.result.items;
  } catch (error) {
    console.error('Error listing Google Calendar events:', error);
    toast.error("Error al obtener eventos de Google Calendar");
    throw error;
  }
};

// Declaración del tipo global para TypeScript
declare global {
  interface Window {
    gapi: any;
  }
}
