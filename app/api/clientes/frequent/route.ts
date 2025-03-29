import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

/**
 * GET handler para obtener clientes frecuentes
 * Este endpoint requiere autenticación
 */
export async function GET(request: NextRequest) {
  try {
    // Inicialización de PocketBase
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
    console.log('API Clientes - PocketBase URL:', process.env.NEXT_PUBLIC_POCKETBASE_URL);
    
    // Obtener la cookie de autenticación
    const authCookie = request.cookies.get('pb_auth');
    console.log('API Clientes - Cookie de autenticación presente:', !!authCookie);
    
    if (!authCookie) {
      // Si no hay cookie, intentar usar el token de administrador para operaciones de solo lectura
      const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
      if (adminToken) {
        console.log('API Clientes - Usando token de administrador como fallback');
        pb.authStore.save(adminToken, null);
      } else {
        console.log('API Clientes - No hay token de administrador configurado');
        return NextResponse.json(
          { success: false, message: 'No autenticado y no hay token de administrador' },
          { status: 401 }
        );
      }
    } else {
      try {
        // Cargar la autenticación desde la cookie
        console.log('API Clientes - Cargando autenticación desde cookie...');
        pb.authStore.loadFromCookie(authCookie.value);
        
        // Verificar si el usuario está autenticado
        console.log('API Clientes - Autenticación válida:', pb.authStore.isValid);
        if (!pb.authStore.isValid) {
          console.log('API Clientes - Sesión expirada o inválida, intentando fallback a admin token');
          // Si la sesión es inválida, intentar usar el token de administrador como fallback
          const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
          if (adminToken) {
            pb.authStore.save(adminToken, null);
          } else {
            return NextResponse.json(
              { success: false, message: 'Sesión inválida o expirada' },
              { status: 401 }
            );
          }
        }
      } catch (error) {
        console.error('API Clientes - Error al cargar autenticación desde cookie:', error);
        // Si hay error con la cookie, intentar usar el token de administrador
        const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
        if (adminToken) {
          pb.authStore.save(adminToken, null);
        } else {
          return NextResponse.json(
            { success: false, message: 'Error de autenticación' },
            { status: 401 }
          );
        }
      }
    }
    
    try {
      // Obtener los clientes frecuentes
      console.log('API Clientes - Consultando clientes...');
      const clientes = await pb.collection('cliente').getList(1, 50, {
        sort: 'nombre',
        fields: 'id,nombre,contacto,email'
      });
      
      console.log(`API Clientes - Encontrados ${clientes.items.length} clientes`);
      
      return NextResponse.json({
        success: true,
        clientes: clientes.items
      });
    } catch (error) {
      console.error('API Clientes - Error al obtener clientes:', error);
      return NextResponse.json(
        { success: false, message: `Error al obtener clientes: ${error}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API Clientes - Error en el servidor:', error);
    return NextResponse.json(
      { success: false, message: `Error en el servidor: ${error}` },
      { status: 500 }
    );
  }
} 