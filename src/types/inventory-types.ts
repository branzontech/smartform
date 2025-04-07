
export type InventoryCategory = 
  | "Medicamentos" 
  | "Insumos médicos" 
  | "Equipos médicos" 
  | "Material quirúrgico"
  | "Papelería" 
  | "Mobiliario" 
  | "Limpieza" 
  | "Otros";

export type InventoryStatus = 
  | "Disponible" 
  | "Agotado" 
  | "Próximo a agotarse" 
  | "Vencido" 
  | "En cuarentena";

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  location?: string;
  purchasePrice?: number;
  salePrice?: number;
  expirationDate?: string;
  supplier?: string;
  status: InventoryStatus;
  minimumStock?: number;
  lastUpdated: Date;
  image?: string;
  barcode?: string;
  notes?: string;
}

export interface InventoryItemFormValues {
  name: string;
  description?: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  location?: string;
  purchasePrice?: number;
  salePrice?: number;
  expirationDate?: string;
  supplier?: string;
  status: InventoryStatus;
  minimumStock?: number;
  image?: string;
  barcode?: string;
  notes?: string;
}
