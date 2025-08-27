import { FormTemplate } from "@/components/forms/form-customizer/types";

const FORM_TEMPLATES_KEY = "form_templates";

export const saveFormTemplate = (template: FormTemplate): void => {
  const templates = getFormTemplates();
  const existingIndex = templates.findIndex(t => t.id === template.id);
  
  if (existingIndex >= 0) {
    templates[existingIndex] = template;
  } else {
    templates.push(template);
  }
  
  localStorage.setItem(FORM_TEMPLATES_KEY, JSON.stringify(templates));
};

export const getFormTemplates = (): FormTemplate[] => {
  try {
    const templates = localStorage.getItem(FORM_TEMPLATES_KEY);
    if (!templates) return [];
    
    return JSON.parse(templates).map((template: any) => ({
      ...template,
      sectionName: template.sectionName || "Información Adicional", // Fallback para plantillas existentes
      createdAt: new Date(template.createdAt),
      updatedAt: template.updatedAt ? new Date(template.updatedAt) : undefined
    }));
  } catch (error) {
    console.error("Error loading form templates:", error);
    return [];
  }
};

export const getFormTemplateById = (id: string): FormTemplate | undefined => {
  const templates = getFormTemplates();
  return templates.find(template => template.id === id);
};

export const getDefaultFormTemplate = (): FormTemplate | undefined => {
  const templates = getFormTemplates();
  return templates.find(template => template.isDefault);
};

export const deleteFormTemplate = (id: string): void => {
  const templates = getFormTemplates();
  const filteredTemplates = templates.filter(template => template.id !== id);
  localStorage.setItem(FORM_TEMPLATES_KEY, JSON.stringify(filteredTemplates));
};

export const setDefaultTemplate = (templateId: string): void => {
  const templates = getFormTemplates();
  const updatedTemplates = templates.map(template => ({
    ...template,
    isDefault: template.id === templateId
  }));
  localStorage.setItem(FORM_TEMPLATES_KEY, JSON.stringify(updatedTemplates));
};