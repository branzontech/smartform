
# Arquitectura del Software MediForm SaaS

## Visión General

MediForm SaaS es una plataforma diseñada para profesionales de la salud que permite la gestión digital de formularios médicos, citas, pacientes y consultas médicas. El sistema implementa un modelo de negocio SaaS basado en suscripciones con período de prueba y una estrategia de lanzamiento con lista de espera.

## Modelo de Negocio SaaS

### Planes de Suscripción

- **Período de Prueba**: 14 días gratuitos con acceso completo a todas las funcionalidades.
- **Plan Básico**: Acceso a formularios estándar, gestión básica de pacientes, hasta 100 pacientes.
- **Plan Profesional**: Acceso completo a todas las funcionalidades, pacientes ilimitados, telemedicina, facturación.
- **Plan Institucional**: Para clínicas y hospitales con múltiples profesionales, soporte prioritario y personalización.

### Precios SaaS

- **Plan Básico**: $19.99/mes por usuario - Ideal para profesionales individuales
- **Plan Profesional**: $39.99/mes por usuario - Para consultorios con necesidades avanzadas
- **Plan Institucional**: Desde $99.99/mes - Para clínicas con múltiples profesionales

### Estrategia de Adquisición de Clientes

- **Lista de Espera**: Implementación de un sistema de lista de espera para gestionar el lanzamiento inicial limitado.
- **Invitaciones Escalonadas**: Control de crecimiento para asegurar la calidad del servicio.
- **Programa de Referidos**: Incentivos para que los usuarios actuales refieran a nuevos usuarios.
- **Período de Prueba**: Conversión de usuarios de prueba a usuarios de pago con onboarding efectivo.

## Arquitectura Técnica Multi-tenant

### Enfoque de Multi-tenancy

MediForm implementa una arquitectura multi-tenant para servir a múltiples clientes desde una única instalación del software:

- **Aislamiento a Nivel de Schema**: Cada cliente (tenant) tiene su propio schema en la base de datos PostgreSQL.
- **Middleware de Tenant**: Un middleware identifica el tenant actual basado en subdominios o tokens JWT.
- **Row-Level Security (RLS)**: Policies en Supabase que garantizan el aislamiento de datos entre tenants.

### Frontend

- **Framework**: React con TypeScript
- **Estilos**: Tailwind CSS con componentes de Shadcn UI
- **Gestión de Estado**: React Query para peticiones y cacheo de datos
- **Enrutamiento**: React Router con sistema de rutas protegidas según suscripción
- **Animaciones**: Lottie para animaciones interactivas
- **Formularios**: React Hook Form para validación de formularios
- **Personalización por Tenant**: Configuración de temas, logos y colores por tenant

### Backend

- **Base de Datos**: PostgreSQL a través de Supabase con esquemas separados para cada tenant
- **Autenticación**: Sistema de autenticación con Supabase Auth
  - Roles diferenciados: admin, profesional, asistente, recepcionista
  - SSO (Single Sign-On) para instituciones mediante OAuth
- **Almacenamiento**: Supabase Storage para documentos y archivos médicos con aislamiento por tenant
- **APIs**: Supabase Edge Functions para la lógica de negocio
- **Cache**: Redis para mejora de performance en datos frecuentemente accedidos
- **Cola de Tareas**: Sistema de colas para procesos asíncronos como notificaciones masivas

### Integraciones Externas

- **Google Calendar**: Sincronización bidireccional de citas médicas
- **Procesador de Pagos**: Stripe para gestión de suscripciones y pagos recurrentes
- **Webhooks**: Integración de Stripe Webhooks para actualización automática de estados de suscripción
- **Facturación**: Generación automática de facturas y recibos
- **Email**: Integración con servicios como SendGrid o AWS SES para comunicaciones
- **SMS**: Servicios de notificaciones SMS para recordatorios de citas

## Infraestructura Cloud y DevOps

### Alojamiento y Escalabilidad

- **Frontend**: Vercel para despliegue continuo con CDN global
- **Backend**: Supabase para base de datos, autenticación y funciones serverless
- **Escalabilidad Horizontal**: Arquitectura serverless que escala automáticamente según demanda
- **CDN**: Distribución global de contenidos para baja latencia

### Entornos de Despliegue

- **Desarrollo**: Entorno para desarrollo activo
- **Staging**: Entorno de pruebas pre-producción
- **Producción**: Entorno final para clientes

### Monitorización y Observabilidad

- **APM (Application Performance Monitoring)**: Monitoreo en tiempo real del rendimiento
- **Logging**: Sistema centralizado de logs con búsqueda y alertas
- **Alertas**: Notificaciones automáticas para incidentes críticos
- **Dashboard de Estado**: Panel de control para visualización de métricas clave

### Seguridad y Cumplimiento

- **Encriptación**: Datos sensibles encriptados en reposo y en tránsito
- **Cumplimiento**: HIPAA/GDPR para información médica protegida
- **Auditoría**: Registro detallado de accesos y modificaciones a datos sensibles
- **Backups**: Copias de seguridad automáticas con retención configurable
- **Análisis de Vulnerabilidades**: Escaneos periódicos de seguridad

## Módulos Principales del SaaS

### Sistema de Gestión de Tenants

- **Onboarding de Nuevos Clientes**: Proceso automatizado de creación de tenant
- **Panel de Administración**: Interfaz para gestionar tenants, suscripciones y configuraciones
- **Configuración por Tenant**: Personalización de la experiencia para cada cliente

### Sistema de Autenticación y Autorización

- Registro e inicio de sesión de usuarios
- Verificación de correo electrónico
- Recuperación de contraseña
- Control de acceso basado en roles y planes de suscripción
- Autenticación de dos factores (2FA) para mayor seguridad

### Sistema de Lista de Espera y Onboarding

- **Registro de Interesados**: Captura de datos básicos de profesionales interesados
- **Sistema de Prioridad**: Algoritmo para determinar el orden de invitación
- **Notificaciones**: Envío automático de invitaciones por lotes
- **Onboarding Guiado**: Tutorial interactivo para nuevos usuarios
- **Métricas**: Análisis de conversión de lista de espera a usuarios activos

### Gestión de Suscripciones

- **Checkout**: Proceso de suscripción con Stripe Checkout
- **Gestión de Planes**: Cambio de plan, cancelación, pausa
- **Período de Prueba**: Automatización del período de prueba de 14 días
- **Recordatorios**: Notificaciones previas a la finalización del período de prueba
- **Renovaciones**: Procesamiento automático de renovaciones
- **Facturación**: Sistema de facturación automática para suscripciones

### Formularios Médicos

- Creador de formularios personalizables
- Plantillas predefinidas para especialidades médicas
- Sistema de llenado de formularios para pacientes
- Almacenamiento y organización de respuestas
- Exportación a formatos estándar (PDF, CSV)

### Gestión de Pacientes

- Registro y perfiles de pacientes
- Historia clínica digital
- Seguimiento de consultas
- Alertas y recordatorios de seguimiento
- Segmentación de pacientes para campañas

### Sistema de Citas y Telemedicina

- Calendario de citas con múltiples vistas
- Recordatorios automáticos multicanalales (email, SMS)
- Confirmación de asistencia
- Reprogramación y cancelación
- Videoconsultas integradas
- Grabación opcional de sesiones

### Módulo de Facturación y Pagos

- Generación automática de facturas para servicios médicos
- Integración con procesadores de pago
- Seguimiento de pagos pendientes
- Reportes financieros

### Sistema de Reportes y Analítica

- Dashboard personalizable para métricas clave
- Reportes predefinidos por especialidades
- Análisis de tendencias de pacientes y consultas
- Exportación de datos para análisis externo

## Flujos de Usuario SaaS

### Registro de Interés y Lista de Espera

1. El profesional visita la landing page
2. Proporciona su correo electrónico y datos básicos
3. Recibe confirmación de ingreso a la lista de espera
4. Obtiene actualizaciones periódicas sobre su posición
5. Recibe invitación para registrarse cuando sea su turno

### Creación de Cuenta y Configuración de Tenant

1. El profesional recibe invitación con código de acceso
2. Completa el registro con sus datos profesionales
3. Selecciona plan (o inicia período de prueba)
4. Configura perfil de consultorio o clínica
5. Personaliza opciones (logo, colores, dominio)

### Conversión a Suscripción Pagada

1. El usuario recibe notificación sobre la proximidad del fin de su prueba
2. Selecciona un plan de suscripción
3. Ingresa información de pago a través de Stripe
4. Confirma la suscripción
5. Recibe factura y confirmación de activación

### Gestión de Equipo (Plan Institucional)

1. El administrador accede a la sección de gestión de equipo
2. Invita a nuevos miembros con roles específicos
3. Asigna permisos y accesos según rol
4. Gestiona cuentas de usuarios
5. Monitorea actividad y uso de recursos

## Sistema de Métricas SaaS

### KPIs de Negocio

- **MRR (Monthly Recurring Revenue)**: Ingresos mensuales recurrentes
- **ARR (Annual Recurring Revenue)**: Ingresos anuales recurrentes
- **Churn Rate**: Tasa de cancelación de suscripciones
- **Customer Acquisition Cost (CAC)**: Costo de adquisición de clientes
- **Customer Lifetime Value (LTV)**: Valor del cliente durante su ciclo de vida
- **Conversion Rate**: Porcentaje de conversión de prueba gratuita a pago

### Métricas de Engagement

- **Active Users**: Usuarios activos diarios/mensuales
- **Feature Adoption**: Uso de características principales
- **Session Duration**: Duración promedio de sesiones
- **Retention Rate**: Tasa de retención de usuarios
- **NPS (Net Promoter Score)**: Satisfacción del cliente

## Estrategia de Escalabilidad y Crecimiento

### Optimización Técnica

- **Cacheo Inteligente**: Reducción de carga en base de datos mediante cacheo estratégico
- **Consultas Optimizadas**: Índices y consultas eficientes para alto volumen de datos
- **Servicio de Workers**: Procesamiento en background para tareas intensivas
- **Particionamiento de Datos**: Estrategias para manejar grandes volúmenes de datos

### Expansión de Mercado

- **Internacionalización**: Soporte multiidioma y adaptación a normativas locales
- **Verticales por Especialidad**: Versiones especializadas para nichos médicos específicos
- **Integraciones con Sistemas Locales**: Conectores para sistemas de salud por país
- **Programa de Partners**: Red de revendedores y consultores certificados

## Roadmap de Desarrollo

### Fase 1: MVP SaaS (3 meses)

- Implementación de arquitectura multi-tenant básica
- Sistema de suscripciones con Stripe
- Dashboard de administración para tenants
- Migración de funcionalidades core al modelo SaaS

### Fase 2: Escalabilidad (3 meses)

- Optimización de rendimiento para múltiples tenants
- Mejoras en el sistema de monitoreo y alertas
- Implementación de cache distribuido
- Ampliación de opciones de personalización por tenant

### Fase 3: Expansión (6 meses)

- Internacionalización completa
- Nuevas integraciones con sistemas de salud regionales
- API pública para desarrolladores externos
- Marketplace de extensiones y plugins

Esta arquitectura proporciona una visión general del enfoque SaaS para MediForm, adaptando la aplicación existente para servir a múltiples clientes desde una infraestructura compartida pero segura, con un modelo de negocio basado en suscripciones recurrentes.
