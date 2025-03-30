import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

export async function middleware(request: NextRequest) {
  // Rutas públicas que no requieren autenticación
  const publicRoutes = [
    '/login', 
    '/_next', 
    '/favicon.ico', 
    '/api/auth', 
    '/api/email/test-open',
    '/formulario' // Añadimos la ruta del formulario como pública
  ];
  
  // Verificar si la ruta actual está en las rutas públicas
  const isPublicPath = publicRoutes.some(route => 
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route)
  );

  // Si es una ruta pública, permitir el acceso sin verificar autenticación
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // Obtener la cookie de autenticación
  const authCookie = request.cookies.get('pb_auth')?.value;
  
  // Si no hay cookie de autenticación, redirigir al login
  if (!authCookie) {
    console.log('Middleware - No hay cookie de autenticación, redirigiendo a login');
    const loginUrl = new URL('/login', request.url);
    // Añadir el parámetro redirect para saber dónde redirigir después del login
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  try {
    // Inicializar PocketBase
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
    
    // Cargar la autenticación desde la cookie
    pb.authStore.loadFromCookie(`pb_auth=${authCookie}`);
    
    // Si la autenticación no es válida, redirigir al login
    if (!pb.authStore.isValid) {
      console.log('Middleware - Token inválido, redirigiendo a login');
      const loginUrl = new URL('/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      
      // Eliminar cookies inválidas
      response.cookies.delete('pb_auth');
      response.cookies.delete('pb_auth_model');
      
      return response;
    }
    
    console.log('Middleware - Usuario autenticado:', pb.authStore.model?.id);
    
    // Si la ruta es / (raíz) y el usuario está autenticado, redirigir al dashboard
    if (request.nextUrl.pathname === '/' && pb.authStore.isValid) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Autenticación válida, permitir acceso
    const response = NextResponse.next();
    
    // Configurar encabezados para evitar problemas de caché
    response.headers.set('Cache-Control', 'no-store, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Error al verificar autenticación en middleware:', error);
    
    // En caso de error, redirigir al login
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    
    // Eliminar cookies potencialmente inválidas
    response.cookies.delete('pb_auth');
    response.cookies.delete('pb_auth_model');
    
    return response;
  }
}

// Configurar las rutas a las que aplicar el middleware
export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas excepto:
     * 1. /api/auth (endpoints de autenticación)
     * 2. /_next (archivos de Next.js)
     * 3. /favicon.ico, /assets, etc. (archivos estáticos)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|assets|formulario).*)',
  ],
}; 