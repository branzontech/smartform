# Ker Hub — Documentación Técnica del Sistema

## Plataforma de Gestión Clínica con Interoperabilidad HL7 FHIR R4

---

## 1. Visión General

Ker Hub es una plataforma integral de gestión sanitaria construida sobre el estándar de interoperabilidad **HL7 FHIR R4**. Cada módulo, tabla y flujo de datos está diseñado para garantizar compatibilidad con sistemas externos, escalabilidad y precisión clínica.

### Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + Radix UI (shadcn/ui) |
| Estado | TanStack React Query |
| Formularios | React Hook Form + Zod |
| Backend | Lovable Cloud (PostgreSQL + Edge Functions) |
| Autenticación | Auth integrada con RBAC |
| Estándar clínico | HL7 FHIR R4 |

---

## 2. Arquitectura FHIR R4

### 2.1 Principio Fundamental

> **Toda tabla clínica DEBE incluir una columna `fhir_extensions` de tipo JSONB.**

Esta columna actúa como el mecanismo de extensibilidad oficial de FHIR, permitiendo agregar datos dinámicos sin alterar el esquema relacional. Esto es crítico para:

- Evitar migraciones destructivas al agregar campos nuevos.
- Mantener compatibilidad con sistemas que consumen recursos FHIR.
- Almacenar datos específicos de cada país o regulación sin contaminar el esquema base.

### 2.2 Mapeo de Recursos FHIR

| Recurso FHIR | Tabla en BD | Descripción |
|--------------|-------------|-------------|
| `Patient` | `pacientes` | Datos demográficos, identificación, contacto |
| `Encounter` | `admisiones` | Admisiones/encuentros clínicos |
| `Questionnaire` | `formularios` | Plantillas de formularios clínicos |
| `QuestionnaireResponse` | `respuestas_formularios` | Respuestas de pacientes a formularios |
| `Organization` | `pagadores` | Entidades pagadoras / aseguradoras |
| `Contract` | `contratos` | Convenios y contratos de facturación |
| `ChargeItemDefinition` | `tarifarios_maestros` | Tarifarios de servicios |
| `ChargeItem` | `tarifarios_servicios` | Servicios individuales con codificación |
| `Condition` | `catalogo_diagnosticos` | Catálogo de diagnósticos (CIE-10, CIE-11) |

### 2.3 Estructura de `fhir_extensions`

La columna `fhir_extensions` sigue la convención de extensiones FHIR:

```jsonc
// Ejemplo: pacientes.fhir_extensions
{
  "acompanante": {
    "nombre": "María López",
    "telefono": "3001234567",
    "parentesco": "Madre"
  },
  "customFields": {
    "campo_personalizado_1": "valor",
    "campo_personalizado_2": 42
  }
}
```

```jsonc
// Ejemplo: admisiones.fhir_extensions
{
  "diagnosis": [
    {
      "rank": 1,
      "use": "AD",           // Admisión (Principal)
      "code": "J18.9",
      "system": "ICD-10",
      "display": "Neumonía, no especificada"
    },
    {
      "rank": 2,
      "use": "DD",           // Diagnóstico relacionado
      "code": "R50.9",
      "system": "ICD-10",
      "display": "Fiebre, no especificada"
    }
  ],
  "customFields": {}
}
```

### 2.4 Catálogos Médicos y Sistemas de Codificación

El sistema integra catálogos estandarizados con URIs FHIR oficiales:

| Sistema | URI FHIR | Uso |
|---------|----------|-----|
| CIE-10 | `http://hl7.org/fhir/sid/icd-10` | Diagnósticos |
| CIE-11 | `http://id.who.int/icd/release/11/mms` | Diagnósticos |
| CUPS | `urn:oid:2.16.170.1.113883.6.255` | Procedimientos (Colombia) |
| ATC | `http://www.whocc.no/atc` | Medicamentos |
| LOINC | `http://loinc.org` | Laboratorio / Observaciones |
| SNOMED CT | `http://snomed.info/sct` | Terminología clínica general |

Cada entrada en `catalogo_diagnosticos` contiene:
- `codigo`: Código oficial (ej: `J18.9`)
- `descripcion`: Texto legible
- `sistema`: Nombre corto del sistema
- `fhir_system_uri`: URI completo para interoperabilidad
- `capitulo`: Clasificación jerárquica

---

## 3. Guía de Desarrollo — Nuevas Funcionalidades

### 3.1 Regla de Oro

> **Antes de crear cualquier tabla o funcionalidad clínica, identifica el recurso FHIR equivalente y modela en consecuencia.**

### 3.2 Checklist para Nuevos Módulos

```
□ 1. Identificar el recurso FHIR correspondiente
□ 2. Crear tabla con columna `fhir_extensions JSONB DEFAULT '{}'::jsonb`
□ 3. Agregar índice GIN sobre fhir_extensions para búsquedas eficientes
□ 4. Habilitar RLS con políticas apropiadas
□ 5. Crear tipo TypeScript en src/types/
□ 6. Usar campos dinámicos vía configuracion_campos_* cuando aplique
□ 7. Documentar el mapeo FHIR en esta guía
```

### 3.3 Crear una Nueva Tabla Clínica

**Ejemplo**: Agregar un módulo de Observaciones (signos vitales, laboratorio).

```sql
-- Migración
CREATE TABLE public.observaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  admision_id UUID REFERENCES admisiones(id),
  medico_id UUID NOT NULL,
  
  -- Campos base del recurso FHIR Observation
  codigo TEXT NOT NULL,              -- Código LOINC/SNOMED
  sistema_codificacion TEXT NOT NULL, -- URI del sistema
  valor NUMERIC,
  unidad TEXT,
  fecha_registro TIMESTAMPTZ DEFAULT now(),
  estado TEXT DEFAULT 'final',       -- registered | preliminary | final | amended
  
  -- Extensibilidad FHIR
  fhir_extensions JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para búsquedas en extensiones
CREATE INDEX idx_observaciones_fhir ON observaciones USING GIN (fhir_extensions);

-- RLS
ALTER TABLE observaciones ENABLE ROW LEVEL SECURITY;
```

### 3.4 Campos Dinámicos (Extensiones sin Migración)

El sistema permite agregar campos a formularios de pacientes y admisiones **sin modificar el esquema de BD**, usando las tablas de configuración:

| Tabla de configuración | Formulario destino | Almacenamiento |
|----------------------|-------------------|----------------|
| `configuracion_campos_paciente` | Registro de pacientes | `pacientes.fhir_extensions.customFields` |
| `configuracion_campos_admision` | Formulario de admisión | `admisiones.fhir_extensions.customFields` |

**Tipos de campo soportados**: `texto`, `numero`, `fecha`, `hora`, `seleccion`, `boolean`, `busqueda_cie10`, `busqueda_cie11`, `busqueda_cups`, `busqueda_atc`, `busqueda_loinc`, `busqueda_snomed`.

**Para agregar un nuevo tipo de campo dinámico**:

1. Insertar registro en la tabla `configuracion_campos_*` correspondiente.
2. El componente `DynamicFieldRenderer` lo renderiza automáticamente.
3. El valor se persiste en `fhir_extensions.customFields`.

### 3.5 Formularios Clínicos (Questionnaire / QuestionnaireResponse)

La arquitectura separa estrictamente:

- **`formularios`** → Plantilla (FHIR `Questionnaire`). Define preguntas, tipos, opciones.
- **`respuestas_formularios`** → Respuestas del paciente (FHIR `QuestionnaireResponse`). Vinculada a paciente, médico y admisión.

**Regla**: Las plantillas NUNCA se modifican durante la atención clínica. Siempre se crea un nuevo registro en `respuestas_formularios`.

**Tipos de pregunta soportados**:

| Tipo | Descripción | Calculable |
|------|-------------|-----------|
| `short_text` | Texto corto | No |
| `paragraph` | Texto largo | No |
| `multiple_choice` | Selección múltiple | No |
| `checkbox` | Casillas de verificación | No |
| `dropdown` | Lista desplegable | No |
| `vitals` | Signos vitales (TA, IMC) | No |
| `clinical` | Campos clínicos | No |
| `diagnosis` | Búsqueda de diagnósticos | No |
| `medication` | Gestión de medicamentos | No |
| `multifield` | Subcampos múltiples | **Sí** |
| `calculation` | Cálculo automático | **Sí** |
| `signature` | Firma digital | No |
| `file_upload` | Carga de archivos | No |

**Campos calculados (multifield)**:
- Propiedad `isCalculated: true` activa el modo numérico.
- `calculationType`: `sum | subtract | multiply | divide`
- `numberType`: `integer | decimal`
- El total se computa en tiempo real en el visor de formularios.

---

## 4. Modelo de Datos

### 4.1 Pacientes (`pacientes` → FHIR Patient)

```
id, nombres, apellidos, numero_documento, tipo_documento,
fecha_nacimiento, telefono_principal, telefono_secundario,
email, direccion, ciudad, estado, zona, ocupacion,
numero_historia (auto-generado), estado_paciente,
tipo_afiliacion, regimen, carnet,
fhir_extensions (JSONB), user_id
```

- `numero_historia` = concatenación automática de `tipo_documento + numero_documento`.
- Tipos de documento soportados: CC, CE, PA, RC, TI, NIT, etc.
- Soporte multinacional: Colombia, México, Ecuador, Perú.

### 4.2 Admisiones (`admisiones` → FHIR Encounter)

```
id, paciente_id, tipo_admision_id, contrato_id, servicio_id,
fecha_inicio, fecha_fin, estado, motivo,
diagnostico_principal, profesional_nombre,
numero_ingreso, numero_estudio, factura,
notas, fhir_extensions (JSONB)
```

- Hasta 4 diagnósticos (1 principal + 3 relacionados) en `fhir_extensions.diagnosis`.
- Vinculación con contratos y tarifarios para facturación.

### 4.3 Diagnósticos (`catalogo_diagnosticos` → FHIR Condition)

```
id, codigo, descripcion, sistema, fhir_system_uri,
capitulo, activo
```

### 4.4 Contratos y Facturación

```
contratos: id, pagador_id, nombre_convenio, tipo_contratacion,
           tarifario_id, fecha_inicio, fecha_fin, estado,
           reglas_facturacion (JSONB)

pagadores: id, nombre, tipo_identificacion, numero_identificacion,
           pais, es_particular, activo

tarifarios_maestros: id, nombre, descripcion, moneda, estado,
                     fhir_extensions (JSONB)

tarifarios_servicios: id, tarifario_id, codigo_servicio,
                      descripcion_servicio, sistema_codificacion,
                      valor, metadata_regulatoria (JSONB), activo
```

Tipos de contratación: `evento | capita | paquete | particular`.

---

## 5. Seguridad y Control de Acceso

### 5.1 Roles (RBAC)

Los roles se almacenan en la tabla `user_roles` (NUNCA en profiles):

```sql
-- Enum de roles
app_role: admin | doctor | nurse | receptionist | patient | user

-- Verificación de rol (security definer, evita recursión RLS)
SELECT public.has_role(auth.uid(), 'admin');
```

### 5.2 Políticas RLS

Toda tabla con datos clínicos DEBE tener RLS habilitado. Usar la función `has_role()` para verificaciones en políticas.

### 5.3 Reglas de Seguridad para Desarrollo

1. **Nunca** verificar roles desde localStorage o sessionStorage.
2. **Nunca** almacenar claves privadas en código frontend.
3. **Siempre** usar `has_role()` en políticas RLS.
4. **Siempre** validar datos con Zod antes de enviar al backend.

---

## 6. Escalabilidad

### 6.1 Arquitectura Multi-Tenant

El sistema está preparado para multi-tenancy mediante `TenantContext`. Para activar aislamiento completo:

1. Agregar `tenant_id UUID` a cada tabla clínica.
2. Incluir `tenant_id` en todas las políticas RLS.
3. Propagar el tenant desde el contexto de autenticación.

### 6.2 Rendimiento

- **Índices GIN** en columnas JSONB para búsquedas eficientes en `fhir_extensions`.
- **React Query** con cacheo inteligente y deduplicación de requests.
- **Lazy loading** de rutas y componentes pesados.
- **Debounce** de 300ms en búsquedas de pacientes y diagnósticos.

### 6.3 Extensión de Catálogos

Para agregar un nuevo sistema de codificación:

1. Insertar registros en `catalogo_diagnosticos` con el `fhir_system_uri` correspondiente.
2. Agregar el tipo de búsqueda en `DynamicFieldConfigurator` (ej: `busqueda_nuevo_sistema`).
3. Implementar el filtro en `DynamicFieldRenderer`.

### 6.4 Internacionalización Regulatoria

El campo `metadata_regulatoria` en servicios y `datos_regulatorios` en encabezado permiten almacenar requisitos específicos por país sin alterar el esquema:

```jsonc
// Ejemplo: metadata_regulatoria para Colombia
{
  "cups_code": "890201",
  "rips_required": true,
  "soat_tariff": 25000
}
```

---

## 7. Estructura del Proyecto

```
src/
├── components/
│   ├── admissions/       # Flujo de admisiones (FHIR Encounter)
│   ├── ai-assistant/     # Asistente IA
│   ├── appointments/     # Gestión de citas
│   ├── auth/             # Autenticación y rutas protegidas
│   ├── billing/          # Facturación
│   ├── chat/             # Mensajería médica
│   ├── config/           # Configuración dinámica de campos
│   ├── customers/        # Gestión de clientes/pagadores
│   ├── doctors/          # Gestión de profesionales
│   ├── forms/            # Constructor y visor de formularios
│   ├── layout/           # Navegación y estructura
│   ├── locations/        # Sedes y consultorios
│   ├── medical/          # Medicamentos
│   ├── patients/         # Dashboard y componentes de pacientes
│   ├── reports/          # Reportes y analíticas
│   ├── shifts/           # Gestión de turnos
│   ├── telemedicine/     # Telemedicina
│   ├── ui/               # Componentes base (shadcn/ui)
│   ├── workflow/         # Constructor de flujos
│   └── zones/            # Zonas geográficas
├── contexts/             # AuthContext, TenantContext
├── hooks/                # Hooks reutilizables
├── types/                # Definiciones TypeScript por dominio
├── utils/                # Utilidades y helpers
├── pages/                # Páginas/rutas de la aplicación
└── integrations/         # Cliente de BD y tipos auto-generados
```

---

## 8. Convenciones de Código

| Aspecto | Convención |
|---------|-----------|
| Idioma de código | Inglés para variables/funciones, español para labels/UI |
| Nombres de tablas | Español, plural, snake_case (`pacientes`, `admisiones`) |
| Columnas FHIR | `fhir_extensions` (JSONB) en toda tabla clínica |
| Tipos TypeScript | Un archivo por dominio en `src/types/` |
| Componentes | PascalCase, archivos `.tsx`, organizados por dominio |
| Estilos | Tokens semánticos de Tailwind, nunca colores directos |
| Validación | Zod schemas para toda entrada de usuario |
| Estado servidor | TanStack React Query, nunca useState para datos remotos |

---

*Documentación Ker Hub v2.0 — Estándar HL7 FHIR R4*
