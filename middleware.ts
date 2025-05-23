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
    '/api/email/send',
    '/formulario', // Formulario público
    '/api/formulario', // API del formulario público
    '/api/birthdays',  
    '/api/test-birthday-email'  // Agregamos la nueva ruta de prueba
  ];

  // Rutas restringidas por rol
  // const roleRestrictions: Record<string, { restricted: string[], allowedPaths: string[] }> = {
  //   'contabilidad': {
  //     restricted: [
  //       '/dashboard/events',
  //       '/dashboard/people',
  //       '/dashboard/clients',
  //       '/dashboard/providers',
  //     ],
  //     allowedPaths: [
  //       '/dashboard',
  //       '/dashboard/contabilidad',
  //     ]
  //   },
  //   'planner': {
  //     restricted: [
  //       '/dashboard/contabilidad',
  //     ],
  //     allowedPaths: [
  //       '/dashboard',
  //       '/dashboard/events',
  //       '/dashboard/people',
  //       '/dashboard/clients',
  //       '/dashboard/providers',
  //     ]
  //   }
  // };
  
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
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  try {
    // Inicializar PocketBase
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
    pb.authStore.loadFromCookie(`pb_auth=${authCookie}`);
    
    if (!pb.authStore.isValid) {
      console.log('Middleware - Token inválido, redirigiendo a login');
      const loginUrl = new URL('/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('pb_auth');
      response.cookies.delete('pb_auth_model');
      return response;
    }

    // Verificar restricciones de rol
    const userRole = pb.authStore.model?.rol?.toLowerCase();
    console.log('Middleware - Rol del usuario:', userRole);
    console.log('Middleware - Ruta actual:', request.nextUrl.pathname);

    // Si el usuario es admin o dev, permitir acceso a todas las rutas
    // if (userRole === 'admin' || userRole === 'dev') {
    //   const response = NextResponse.next();
    //   response.headers.set('Cache-Control', 'no-store, must-revalidate, max-age=0');
    //   response.headers.set('Pragma', 'no-cache');
    //   response.headers.set('Expires', '0');
    //   return response;
    // }

    // if (userRole && roleRestrictions[userRole]) {
    //   const { restricted, allowedPaths } = roleRestrictions[userRole];
      
    //   // Verificar si la ruta actual está restringida para este rol
    //   const isRestricted = restricted.some(route => {
    //     const isMatch = request.nextUrl.pathname.startsWith(route);
    //     console.log(`Verificando ruta restringida ${route}:`, isMatch);
    //     return isMatch;
    //   });

    //   // Verificar si la ruta actual está explícitamente permitida
    //   const isAllowed = allowedPaths.some(route => {
    //     const isMatch = request.nextUrl.pathname.startsWith(route);
    //     console.log(`Verificando ruta permitida ${route}:`, isMatch);
    //     return isMatch;
    //   });

    //   console.log('Middleware - Ruta restringida:', isRestricted);
    //   console.log('Middleware - Ruta permitida:', isAllowed);

    //   if (isRestricted) {
    //     console.log(`Middleware - Acceso denegado para rol ${userRole} en ruta ${request.nextUrl.pathname}`);
    //     return NextResponse.redirect(new URL('/dashboard', request.url));
    //   }
    // }
    
    // Si la ruta es / (raíz) y el usuario está autenticado, redirigir al dashboard
    if (request.nextUrl.pathname === '/' && pb.authStore.isValid) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Autenticación válida, permitir acceso
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Error al verificar autenticación en middleware:', error);
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('pb_auth');
    response.cookies.delete('pb_auth_model');
    return response;
  }
}

// Configurar las rutas a las que aplicar el middleware
export const config = {
  matcher: [
    '/((?!api/|_next/static|_next/image|favicon.ico|assets|formulario).*)',
  ],
}; 