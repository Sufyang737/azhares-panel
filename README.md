# Azhares Panel (Orcish Dashboard)

![orcish-dashboard](https://github.com/user-attachments/assets/cb458deb-9ba3-435e-a39c-7f48095c85c8)

## Overview

The Azhares Panel (Orcish Dashboard) is a sleek and modern dashboard built with Next.js and the Shadcn UI component library. It features a responsive design with support for both light and dark modes, along with a customizable theme selector that lets you easily switch between different color schemes.

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
