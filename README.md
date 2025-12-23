# Sistema de Gestión de Inventarios Gubernamental

![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=flat&logo=next.js)  
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?style=flat&logo=typescript)  
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat&logo=supabase)  
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat&logo=tailwind-css)

Aplicación web moderna para la gestión integral de inventarios de bienes muebles en dependencias gubernamentales. Desarrollada con Next.js 14, TypeScript y Supabase, con un diseño minimalista en blanco y negro enfocado en usabilidad, accesibilidad y seguridad.

---

## 🎯 Características principales

### 📦 Módulos funcionales

- **Inventario**: Registro, clasificación y seguimiento de bienes (ACTIVO/INACTIVO/OBSOLETO)
  - Registro de nuevos bienes con información detallada
  - Clasificación por categorías y áreas
  - Historial completo de cambios de estado

- **Consultas**: Búsqueda avanzada y análisis de datos
  - Inventario INEA (Instituto Nacional de Educación para Adultos)
  - Inventario ITEA (Instituto Tecnológico de Educación para Adultos)
  - Levantamiento de bienes
  - Filtrado por múltiples criterios
  - Visualización de bienes obsoletos

- **Resguardos**: Gestión de asignación y responsabilidad de bienes
  - Creación de resguardos con asignación de responsables
  - Consulta de resguardos activos
  - Registro de bajas y devoluciones
  - Trazabilidad completa

- **Reportes**: Generación automatizada de reportes analíticos
  - Reportes INEA con datos consolidados
  - Reportes ITEA con análisis detallado
  - Exportación a múltiples formatos

- **Administración**: Gestión de usuarios y configuración del sistema
  - Configuración general del sistema
  - Directorio de personal
  - Gestión de áreas y departamentos
  - Validación y aprobación de nuevos usuarios

### 🔒 Seguridad y autenticación

- **Autenticación segura**
  - Login tradicional con usuario y contraseña
  - Integración con AXpert (servicio de identidad institucional)
  - Vinculación de cuentas locales con AXpert
  - Cookies HttpOnly para máxima seguridad

- **Control de acceso basado en roles**
  - Superadmin: Control total del sistema
  - Admin: Gestión de inventarios y usuarios
  - Usuario: Acceso a consultas y resguardos
  - Validación de permisos en cliente y servidor

- **Auditoría y trazabilidad**
  - Historial completo de acciones
  - Registro de cambios en bienes
  - Seguimiento de usuarios y permisos

### 🎨 Diseño y UX

- **Interfaz minimalista B&W**
  - Diseño de alto contraste (WCAG 2.1 AA)
  - Modo claro y oscuro
  - Componentes accesibles

- **Responsive y mobile-first**
  - Optimizado para dispositivos móviles
  - Navegación adaptativa
  - Ideal para trabajo en campo

- **Experiencia de usuario mejorada**
  - Búsqueda global integrada
  - Notificaciones en tiempo real
  - Interfaz intuitiva y consistente

---

## 🛠 Stack tecnológico

| Área          | Tecnologías                                                                 |
|---------------|-----------------------------------------------------------------------------|
| Frontend      | Next.js 14+, TypeScript, React 18+, Tailwind CSS                           |
| Estado        | React Hooks, Context API                                                   |
| Backend       | Next.js API Routes, Supabase (PostgreSQL)                                  |
| Autenticación | NextAuth.js, Supabase Auth, OAuth 2.0                                      |
| UI            | Lucide React (iconos), componentes personalizados                           |
| Validación    | Zod, validación en cliente y servidor                                      |
| Utilidades    | SWR (caché), React Hook Form                                               |

---

## 🗂 Estructura de directorios

```bash
/src
├── app                      # Next.js App Router
│   ├── api                 # API Routes
│   │   ├── auth           # Autenticación (login, logout, session)
│   │   ├── admin          # Endpoints administrativos
│   │   └── supabase-proxy # Proxy seguro a Supabase
│   ├── admin              # Rutas administrativas
│   │   ├── areas          # Gestión de áreas
│   │   ├── personal       # Directorio de personal
│   │   └── usuarios-pendientes # Validación de usuarios
│   ├── consultas          # Módulo de consultas
│   ├── inventario         # Módulo de inventario
│   ├── resguardos         # Módulo de resguardos
│   ├── reportes           # Módulo de reportes
│   ├── login              # Página de login
│   ├── register           # Página de registro
│   ├── pending-approval   # Página de aprobación pendiente
│   └── layout.tsx         # Layout principal
├── components             # Componentes reutilizables
│   ├── Header.tsx         # Barra de navegación
│   ├── NotificationCenter # Centro de notificaciones
│   ├── GlobalSearch       # Búsqueda global
│   ├── roleGuard.tsx      # Protección por roles
│   └── consultas/         # Componentes específicos de consultas
├── hooks                  # Custom React Hooks
│   ├── useSession.ts      # Gestión de sesión
│   ├── useUserRole.ts     # Obtención del rol del usuario
│   └── useNotifications.ts # Gestión de notificaciones
├── context                # React Context
│   └── ThemeContext.tsx   # Contexto de tema (claro/oscuro)
├── lib                    # Utilidades y librerías
│   └── supabase/          # Cliente de Supabase
└── public                 # Assets estáticos
    └── images/            # Logos e imágenes
```

---

## 🔐 Flujo de autenticación

```
Usuario
  ↓
┌─────────────────────────────────────┐
│ Login Tradicional o AXpert          │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ Validación de credenciales          │
│ (Supabase Auth)                     │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ Creación de cookies HttpOnly        │
│ (authToken, userData, refreshToken) │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ Validación de rol y permisos        │
│ (Middleware + Componentes)          │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ Acceso al sistema                   │
└─────────────────────────────────────┘
```

---

## 📊 Modelo de datos clave

```
Usuarios
├── id (UUID)
├── email (único)
├── username (único)
├── first_name
├── last_name
├── rol (superadmin | admin | usuario)
├── is_active
├── pending_approval
├── oauth_provider (local | axpert)
└── oauth_user_id

Bienes
├── id (UUID)
├── nombre
├── descripción
├── estado (ACTIVO | INACTIVO | OBSOLETO)
├── area_id
├── categoria
└── created_at

Resguardos
├── id (UUID)
├── usuario_id
├── bien_id
├── fecha_asignacion
├── fecha_devolucion
└── estado
```

---

## 🚀 Instalación y configuración

### Requisitos previos

- Node.js 18+
- PNPM (recomendado) o NPM
- Cuenta de Supabase
- Variables de entorno configuradas

### Pasos de instalación

```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd inventario

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp .env.example .env.local

# 4. Configurar Supabase
# Agregar las siguientes variables en .env.local:
# NEXT_PUBLIC_SUPABASE_URL=<tu-url>
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
# SUPABASE_SERVICE_ROLE_KEY=<tu-service-key>

# 5. Iniciar servidor de desarrollo
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`

---

## 🔧 Variables de entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# OAuth (AXpert)
SUPABASE_OAUTH_PROVIDER_URL=https://your-oauth-provider.com
SUPABASE_OAUTH_CLIENT_ID=your-client-id
SUPABASE_OAUTH_CLIENT_SECRET=your-client-secret

# SSO
NEXT_PUBLIC_SSO_URL_HEADER=https://your-sso-url.com
```

---

## 📱 Uso de la aplicación

### Para usuarios normales

1. **Registrarse**: Crear cuenta con email y contraseña
2. **Esperar aprobación**: El superadmin debe validar la cuenta
3. **Acceder**: Login con credenciales
4. **Consultar**: Acceso a inventarios y resguardos
5. **Vincular cuenta**: Opcionalmente, vincular con AXpert

### Para administradores

1. **Validar usuarios**: Aprobar o rechazar solicitudes de registro
2. **Gestionar inventario**: Crear, editar y clasificar bienes
3. **Generar reportes**: Crear reportes analíticos
4. **Configurar sistema**: Gestionar áreas y permisos

### Para superadmin

- Acceso total a todas las funciones
- Gestión de usuarios y roles
- Configuración del sistema
- Validación de usuarios pendientes

---

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén disponibles)
pnpm test

# Tests con coverage
pnpm test:coverage
```

---

## 📈 Roadmap futuro

- 📱 **App móvil nativa** para inventarios en campo
- 📊 **Dashboard avanzado** con gráficos y análisis
- 🤖 **Predicción de obsolescencia** con ML
- 📡 **Integración con sistemas gubernamentales** existentes
- 🔔 **Notificaciones por email** y SMS
- 📄 **Generación de reportes en PDF** mejorada
- 🌐 **Soporte multiidioma**

---

## 🤝 Contribución

Este proyecto es de uso gubernamental interno. Para contribuciones, contactar al equipo de desarrollo.

---

## 📄 Licencia

Proyecto desarrollado para uso gubernamental. Licencia interna.

---

## 📞 Soporte

Para reportar bugs o solicitar features, contactar al equipo de desarrollo.

---

## 👥 Equipo

- **Desarrollo**: Equipo de TI Gubernamental
- **Diseño**: Equipo de UX/UI
- **Gestión**: Coordinación de Sistemas

---

**Última actualización**: Diciembre 2025
