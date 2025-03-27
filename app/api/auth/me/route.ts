import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/auth/me - Verificando autenticación');
    
    // Inicializar PocketBase
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
    
    // Obtener todas las cookies para depuración
    const cookies = request.cookies.getAll();
    console.log('Cookies recibidas:', cookies.map(c => c.name).join(', '));
    
    // Obtener cookie de autenticación específica
    const authCookie = request.cookies.get('pb_auth')?.value;
    
    if (!authCookie) {
      console.log('No se encontró cookie pb_auth');
      return NextResponse.json(
        { success: false, message: 'No autenticado' },
        { status: 401 }
      );
    }
    
    try {
      console.log('Cookie pb_auth encontrada, verificando validez...');
      
      // Cargar la autenticación desde la cookie
      pb.authStore.loadFromCookie(`pb_auth=${authCookie}`);
      
      // Verificar si la autenticación es válida
      if (!pb.authStore.isValid) {
        console.log('Token inválido o expirado');
        
        // Crear respuesta para indicar que no está autenticado
        const response = NextResponse.json(
          { success: false, message: 'Sesión expirada o inválida' },
          { status: 401 }
        );
        
        // Limpiar cookies inválidas
        response.cookies.delete('pb_auth');
        response.cookies.delete('pb_auth_model');
        
        return response;
      }
      
      // Obtener el modelo de usuario actual
      const user = pb.authStore.model;
      console.log('Usuario autenticado:', user?.id);
      
      // Determinar si necesitamos refrescar el token (opcional, para mantener la sesión activa)
      const needsRefresh = isTokenAboutToExpire(pb.authStore.token);
      let refreshedCookie = null;
      
      if (needsRefresh) {
        console.log('Refrescando token de autenticación...');
        try {
          // Refrescar la autenticación
          await pb.collection('usuarios').authRefresh();
          
          // Obtener nueva cookie si se refrescó con éxito
          refreshedCookie = pb.authStore.exportToCookie();
        } catch (refreshError) {
          console.error('Error al refrescar token:', refreshError);
          // Continuar con el token actual si no se pudo refrescar
        }
      }
      
      // Devolver información del usuario
      const response = NextResponse.json({
        success: true,
        user: {
          id: user?.id,
          username: user?.username,
          email: user?.email,
          rol: user?.rol,
          created: user?.created,
          updated: user?.updated
        }
      });
      
      // Si refrescamos el token, actualizar la cookie
      if (refreshedCookie) {
        const cookieParts = refreshedCookie.split(';');
        const authValue = cookieParts[0].split('=')[1];
        
        response.cookies.set('pb_auth', authValue, {
          path: '/',
          maxAge: 7 * 24 * 60 * 60,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });
        
        // Actualizar también el modelo si está disponible
        if (pb.authStore.model) {
          const modelJSON = JSON.stringify(pb.authStore.model);
          
          response.cookies.set('pb_auth_model', modelJSON, {
            path: '/',
            maxAge: 7 * 24 * 60 * 60,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
          });
        }
      }
      
      return response;
    } catch (authError) {
      console.error('Error al verificar autenticación:', authError);
      
      // Crear respuesta para error de autenticación
      const response = NextResponse.json(
        { success: false, message: 'Error al verificar autenticación' },
        { status: 401 }
      );
      
      // Limpiar cookies potencialmente inválidas
      response.cookies.delete('pb_auth');
      response.cookies.delete('pb_auth_model');
      
      return response;
    }
  } catch (error) {
    console.error('Error al obtener información del usuario:', error);
    return NextResponse.json(
      { success: false, message: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

// Función para verificar si un token está a punto de expirar (en las próximas 24 horas)
function isTokenAboutToExpire(token: string): boolean {
  if (!token) return false;
  
  try {
    // Decodificar el token JWT (parte del payload)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const payload = JSON.parse(jsonPayload);
    
    // Verificar si el token tiene tiempo de expiración
    if (!payload.exp) return false;
    
    // Calcular cuánto tiempo queda hasta la expiración (en segundos)
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpire = payload.exp - now;
    
    // Refrescar si quedan menos de 24 horas (86400 segundos)
    return timeUntilExpire < 86400;
  } catch (error) {
    console.error('Error al verificar expiración del token:', error);
    return false;
  }
} 