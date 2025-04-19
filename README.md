# Azares Panel (Orcish Dashboard)

![orcish-dashboard](https://github.com/user-attachments/assets/cb458deb-9ba3-435e-a39c-7f48095c85c8)

## Overview

The Azares Panel (Orcish Dashboard) is a sleek and modern dashboard built with Next.js and the Shadcn UI component library. It features a responsive design with support for both light and dark modes, along with a customizable theme selector that lets you easily switch between different color schemes.

## Features

- **Authentication System**
  - Secure login with PocketBase backend
  - Role-based access control
  - Automatic session management with token refresh
  - Protected routes for authenticated users

- **Event Management**
  - Complete events dashboard
  - Create, edit, and delete events
  - Filter and sort event data
  - Support for recurring events

- **Client Management**
  - Comprehensive client database
  - Detailed client information and history
  - Fast client creation during event scheduling
  - Client analytics and reporting

- **People Management**
  - Staff and team members tracking
  - Employee profiles and contact information
  - Role assignments and permissions

- **Modern UI/UX**
  - Responsive design with mobile support
  - Dark and light mode themes
  - Customizable color schemes
  - Interactive data tables with advanced filtering

## Authentication System

The dashboard implements a comprehensive authentication system using PocketBase:

- **Secure Cookie-Based Authentication**
  - HTTP-only cookies for enhanced security
  - Automatic token refresh mechanism
  - Protection against XSS attacks

- **User Management**
  - User profiles with roles (admin, staff)
  - Profile information display in navigation bar
  - Easy login and logout functionality

- **Protected Routes**
  - Route-based access control via middleware
  - Redirection to login for unauthenticated users
  - Return to original page after successful authentication

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- PocketBase server running with the appropriate collections:
  - `eventos` - For event management
  - `clientes` - For client management
  - `personas` - For people management
  - `usuarios` - For user authentication

### Environment Setup

Create a `.env.local` file in the root directory with:

```
NEXT_PUBLIC_POCKETBASE_URL=http://your-pocketbase-server:8090
```

### Installation

To begin, install the required dependencies using the following command:

```bash
npm install
# or
yarn
# or
pnpm install
# or
bun install
```

### Development Server

After installing the dependencies run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Authentication Flow

1. Users visit the login page at `/login`
2. After successful authentication, they're redirected to the dashboard
3. Protected routes automatically check for valid authentication
4. Session automatically refreshes to maintain login status
5. Users can log out via the profile dropdown in the navigation bar

## Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **UI Components**: Shadcn UI, Tailwind CSS
- **Backend**: PocketBase (authentication, database)
- **State Management**: React Context API
- **Form Handling**: React Hook Form, Zod validation

## Security Features

- HTTP-only cookies for authentication tokens
- Server-side validation of authentication status
- Protection against CSRF attacks
- Automatic token refresh to maintain session security
- Secure password authentication via PocketBase

## Envío de Emails con Resend

La aplicación utiliza [Resend](https://resend.com) para enviar emails transaccionales, específicamente emails de bienvenida a clientes nuevos cuando se crean eventos.

### Configuración

Para configurar el envío de emails, sigue estos pasos:

1. Regístrate en [Resend](https://resend.com) y crea una nueva API key.
2. Verifica un dominio de envío o utiliza el dominio por defecto `onboarding@resend.dev`.
3. Añade la API key a tus variables de entorno:

```env
RESEND_API_KEY=re_tu_api_key_aquí
```

### Funcionalidades implementadas

1. **Emails de bienvenida para nuevos clientes**: Cuando se crea un evento con un cliente nuevo, se envía automáticamente un email de bienvenida con los detalles del evento.

2. **Plantillas de email con React**: Las plantillas de email están creadas utilizando React y `@react-email/components`, lo que permite crear emails con un diseño moderno y responsive.

3. **Endpoint de API para envío de emails**: La aplicación cuenta con un endpoint en `app/api/email/send/route.ts` que maneja el envío de emails. Este endpoint se integra con la creación de eventos.

4. **Endpoint de prueba**: Para verificar la configuración de Resend, puedes acceder a `/api/email/test-open` que enviará un email de prueba.

### Pruebas

Para probar la funcionalidad de envío de emails:

1. Asegúrate de que la API key de Resend esté configurada correctamente.
2. Inicia sesión en la aplicación.
3. Crea un nuevo evento con la opción "Cliente nuevo" activada.
4. Proporciona un nombre y un email válido para el cliente.
5. Después de crear el evento, se enviará automáticamente un email de bienvenida al cliente.

También puedes probar directamente el envío de emails utilizando el script incluido en `scripts/test-resend.cjs`:

```bash
NODE_ENV=development RESEND_API_KEY=tu_api_key node scripts/test-resend.cjs
```

O utilizando el endpoint de prueba navegando a `/api/email/test-open` en tu navegador.

## Estructura de la base de datos

El sistema utiliza PocketBase como backend y tiene las siguientes colecciones principales:

### Clientes

La colección `cliente` almacena la información básica de los clientes que solicitan eventos:

- **ID**: Identificador único (generado por PocketBase)
- **nombre**: Nombre del cliente
- **contacto**: Información de contacto principal
- **email**: Correo electrónico (opcional)
- **persona_id**: Array de IDs que relaciona este cliente con múltiples personas (relación uno a muchos)

### Personas

La colección `personas` almacena información detallada de las personas asociadas a los clientes:

- **ID**: Identificador único (generado por PocketBase)
- **nombre**: Nombre de la persona
- **apellido**: Apellido de la persona
- **telefono**: Número de teléfono
- **email**: Correo electrónico
- **cumpleanio**: Fecha de cumpleaños (opcional)
- **pais**: País de residencia (opcional)
- **ciudad**: Ciudad de residencia (opcional)
- **instagram**: Enlace a perfil de Instagram (opcional)
- **direccion**: Dirección física (opcional)
- **comentario**: Comentarios adicionales (opcional)
- **cliente_id**: ID del cliente al que está asociada esta persona (relación uno a uno desde persona a cliente)

## Relaciones entre entidades

### Relación Cliente-Persona (Uno a Muchos)

Un cliente puede tener múltiples personas asociadas. Esta relación se mantiene de dos formas:

1. Cada registro de persona tiene un campo `cliente_id` que apunta al cliente relacionado
2. Cada cliente tiene un campo `persona_id` que es un array de IDs de personas asociadas

Al crear una nueva persona desde el formulario, el sistema:
1. Crea el registro de la persona con el `cliente_id` correspondiente
2. Actualiza el array `persona_id` del cliente para incluir a la nueva persona

## Flujo del formulario de clientes

1. Un cliente recibe un enlace único con su ID
2. Al acceder, el cliente completa el formulario de información personal (datos básicos y detalles adicionales)
3. Los datos se guardan como una nueva persona asociada al cliente
4. Se presenta al cliente la opción de agregar información de personas adicionales relacionadas:
   - Para cada persona adicional, se especifica el tipo de relación (familiar, amigo, pareja, etc.)
   - Se completan sus datos básicos (nombre, apellido, contacto)
   - Cada persona adicional se guarda como un registro independiente en la colección "personas"
   - Todas las personas se relacionan automáticamente con el mismo cliente
5. El cliente puede agregar tantas personas relacionadas como desee
6. Al finalizar, el cliente es dirigido a una página de agradecimiento
7. La relación bidireccional entre cliente y todas las personas se actualiza automáticamente
