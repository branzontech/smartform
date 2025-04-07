
import { nanoid } from "nanoid";
import { InventoryItem, InventoryItemFormValues } from "@/types/inventory-types";

// Datos de ejemplo para el inventario
const MOCK_INVENTORY: InventoryItem[] = [
  {
    id: "inv-001",
    name: "Paracetamol 500mg",
    description: "Analgésico y antipirético",
    category: "Medicamentos",
    quantity: 150,
    unit: "Tabletas",
    location: "Farmacia - Estante A",
    purchasePrice: 0.15,
    salePrice: 0.30,
    expirationDate: "2025-12-31",
    supplier: "Laboratorios MedPharma",
    status: "Disponible",
    minimumStock: 30,
    lastUpdated: new Date("2025-01-15"),
    barcode: "7501234567890",
    notes: "Mantener en lugar fresco y seco"
  },
  {
    id: "inv-002",
    name: "Jeringa desechable 5ml",
    description: "Jeringa estéril de un solo uso",
    category: "Insumos médicos",
    quantity: 500,
    unit: "Unidades",
    location: "Almacén - Estante B",
    purchasePrice: 0.25,
    salePrice: 0.5,
    supplier: "Medical Supplies Inc.",
    status: "Disponible",
    minimumStock: 100,
    lastUpdated: new Date("2025-02-10"),
    barcode: "7502345678901",
    notes: "Presentación: caja de 100 unidades"
  },
  {
    id: "inv-003",
    name: "Tensiómetro digital",
    description: "Aparato para medir la presión arterial",
    category: "Equipos médicos",
    quantity: 5,
    unit: "Unidades",
    location: "Consultorio 3",
    purchasePrice: 45.00,
    salePrice: 65.00,
    supplier: "Medical Devices S.A.",
    status: "Disponible",
    minimumStock: 2,
    lastUpdated: new Date("2025-02-05"),
    barcode: "7503456789012",
    notes: "Incluye garantía de 1 año"
  },
  {
    id: "inv-004",
    name: "Guantes de látex",
    description: "Guantes de examinación no estériles",
    category: "Insumos médicos",
    quantity: 20,
    unit: "Cajas",
    location: "Almacén - Estante C",
    purchasePrice: 8.50,
    salePrice: 12.00,
    expirationDate: "2026-06-30",
    supplier: "Protection Healthcare",
    status: "Próximo a agotarse",
    minimumStock: 15,
    lastUpdated: new Date("2025-03-01"),
    barcode: "7504567890123",
    notes: "Cada caja contiene 100 pares"
  },
  {
    id: "inv-005",
    name: "Formatos de historia clínica",
    description: "Formularios impresos para registro de pacientes",
    category: "Papelería",
    quantity: 200,
    unit: "Unidades",
    location: "Recepción",
    purchasePrice: 0.10,
    salePrice: 0,
    supplier: "Imprenta Médica",
    status: "Disponible",
    minimumStock: 50,
    lastUpdated: new Date("2025-02-20"),
    notes: "Uso interno"
  }
];

// Simulamos una base de datos local con localStorage
const LOCAL_STORAGE_KEY = "smart_doctor_inventory";

// Función para inicializar el inventario con datos de ejemplo
export const initializeInventory = (): void => {
  const existingInventory = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!existingInventory) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(MOCK_INVENTORY));
  }
};

// Función para obtener todos los artículos del inventario
export const getAllInventoryItems = (): InventoryItem[] => {
  initializeInventory(); // Aseguramos que el inventario esté inicializado
  const inventoryData = localStorage.getItem(LOCAL_STORAGE_KEY);
  return inventoryData ? JSON.parse(inventoryData) : [];
};

// Función para obtener un artículo por su ID
export const getInventoryItemById = (id: string): InventoryItem | undefined => {
  const inventory = getAllInventoryItems();
  return inventory.find(item => item.id === id);
};

// Función para agregar un nuevo artículo al inventario
export const addInventoryItem = (itemData: InventoryItemFormValues): InventoryItem => {
  const inventory = getAllInventoryItems();
  
  const newItem: InventoryItem = {
    id: `inv-${nanoid(8)}`,
    ...itemData,
    lastUpdated: new Date(),
  };
  
  const updatedInventory = [...inventory, newItem];
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedInventory));
  
  return newItem;
};

// Función para actualizar un artículo existente
export const updateInventoryItem = (id: string, itemData: InventoryItemFormValues): InventoryItem | undefined => {
  const inventory = getAllInventoryItems();
  const itemIndex = inventory.findIndex(item => item.id === id);
  
  if (itemIndex === -1) return undefined;
  
  const updatedItem: InventoryItem = {
    ...inventory[itemIndex],
    ...itemData,
    id,
    lastUpdated: new Date(),
  };
  
  inventory[itemIndex] = updatedItem;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(inventory));
  
  return updatedItem;
};

// Función para eliminar un artículo
export const deleteInventoryItem = (id: string): boolean => {
  const inventory = getAllInventoryItems();
  const updatedInventory = inventory.filter(item => item.id !== id);
  
  if (updatedInventory.length === inventory.length) return false;
  
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedInventory));
  return true;
};

// Función para buscar artículos por nombre, descripción o categoría
export const searchInventoryItems = (query: string): InventoryItem[] => {
  if (!query.trim()) return getAllInventoryItems();
  
  const inventory = getAllInventoryItems();
  const lowercaseQuery = query.toLowerCase();
  
  return inventory.filter(item => 
    item.name.toLowerCase().includes(lowercaseQuery) ||
    (item.description && item.description.toLowerCase().includes(lowercaseQuery)) ||
    item.category.toLowerCase().includes(lowercaseQuery) ||
    (item.supplier && item.supplier.toLowerCase().includes(lowercaseQuery))
  );
};
