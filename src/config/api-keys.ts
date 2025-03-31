
// Almacena temporalmente las claves API en una sesión
// NOTA: En un entorno de producción, estas claves deberían estar en el backend

import { toast } from "sonner";

// Interface para los tipos de API keys soportados
interface ApiKeys {
  anthropic?: string;
}

// Singleton para gestionar las claves de API
class ApiKeyManager {
  private static instance: ApiKeyManager;
  private keys: ApiKeys = {};
  
  private constructor() {
    // Constructor privado para patrón singleton
    this.loadFromStorage();
  }
  
  public static getInstance(): ApiKeyManager {
    if (!ApiKeyManager.instance) {
      ApiKeyManager.instance = new ApiKeyManager();
    }
    return ApiKeyManager.instance;
  }
  
  // Obtener una clave API
  public getKey(service: keyof ApiKeys): string | undefined {
    return this.keys[service];
  }
  
  // Establecer una clave API con validación básica
  public setKey(service: keyof ApiKeys, key: string): boolean {
    // Validaciones básicas según el servicio
    if (service === 'anthropic') {
      if (!key.startsWith('sk-ant')) {
        toast.error("La clave API de Anthropic no tiene el formato correcto");
        return false;
      }
      
      // Ocultar la clave en logs (solo para demostración)
      const safeKey = `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
      console.log(`Clave API de ${service} establecida: ${safeKey}`);
    }
    
    this.keys[service] = key;
    this.saveToStorage();
    return true;
  }
  
  // Verificar si existe una clave API
  public hasKey(service: keyof ApiKeys): boolean {
    return !!this.keys[service];
  }
  
  // Eliminar una clave API
  public removeKey(service: keyof ApiKeys): void {
    delete this.keys[service];
    this.saveToStorage();
  }
  
  // Guardar en localStorage con encriptación básica
  private saveToStorage(): void {
    try {
      // En una aplicación real, usaríamos encriptación más fuerte
      const encoded = btoa(JSON.stringify(this.keys));
      sessionStorage.setItem('api_keys', encoded);
    } catch (error) {
      console.error('Error al guardar claves API:', error);
    }
  }
  
  // Cargar desde localStorage
  private loadFromStorage(): void {
    try {
      const stored = sessionStorage.getItem('api_keys');
      if (stored) {
        this.keys = JSON.parse(atob(stored));
      }
    } catch (error) {
      console.error('Error al cargar claves API:', error);
      // Si hay error, limpiamos el storage
      sessionStorage.removeItem('api_keys');
    }
  }
  
  // Limitar tiempo de uso de la clave
  public setupKeyExpiration(service: keyof ApiKeys, minutes: number = 30): void {
    setTimeout(() => {
      this.removeKey(service);
      toast.info(`La sesión para ${service} ha expirado por seguridad`);
    }, minutes * 60 * 1000);
  }
}

export const apiKeys = ApiKeyManager.getInstance();

// Inicializar con la clave proporcionada (solo en desarrollo, no en producción)
if (import.meta.env.DEV) {
  // Esto es solo para desarrollo, nunca hacer esto en producción
  apiKeys.setKey('anthropic', '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');
  apiKeys.setupKeyExpiration('anthropic', 60); // Expira en 60 minutos
}
