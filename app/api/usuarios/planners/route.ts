import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

// Definir interfaz para Planner
interface Planner {
  id: string;
  username: string;
  email: string;
  rol: string;
  rolField?: string;
}

// Definir interfaz para User de PocketBase
interface PocketBaseUser {
  id: string;
  username: string;
  email: string;
  rol?: string;
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  try {
    const pocketbaseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || '';
    const pb = new PocketBase(pocketbaseUrl);
    
    // Obtener cookie de autenticación
    const authCookie = request.cookies.get('pb_auth');
    
    // Autenticar con token de admin o cookie
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
    if (adminToken) {
      pb.authStore.save(adminToken, null);
    } else if (authCookie) {
      pb.authStore.loadFromCookie(`pb_auth=${authCookie.value}`);
    }

    try {
      // Obtener usuarios con rol admin o planner
      const users = await pb.collection('usuarios').getFullList({
        filter: 'rol = "admin" || rol = "planner"',
        sort: 'username'
      });

      console.log('Usuarios encontrados:', users);

      // Si no hay usuarios con roles exactos, intentar con otros criterios
      if (users.length === 0) {
        console.log('No se encontraron usuarios con roles específicos, buscando con criterios alternativos...');
        
        const allUsers = await pb.collection('usuarios').getFullList({
          sort: 'username'
        });

        // Filtrar usuarios que tengan alguna variación de admin o planner en su rol
        const possibleUsers = allUsers.filter(user => {
          const userRol = (user.rol || '').toLowerCase();
          return userRol.includes('admin') || 
                 userRol.includes('administrator') || 
                 userRol.includes('administrador') ||
                 userRol.includes('planner') || 
                 userRol.includes('planificador') || 
                 userRol.includes('organizador');
        });

        if (possibleUsers.length > 0) {
          console.log(`Se encontraron ${possibleUsers.length} posibles usuarios válidos`);
          return NextResponse.json({
            success: true,
            planners: possibleUsers.map(user => ({
              id: user.id,
              username: user.username,
              email: user.email,
              rol: user.rol
            }))
          });
        }

        // Si aún no encontramos nada, devolver un mensaje de error específico
        console.log('No se encontraron usuarios con roles válidos');
        return NextResponse.json({
          success: false,
          message: "No se encontraron usuarios con roles válidos en el sistema"
        });
      }

      // Devolver los usuarios encontrados
      return NextResponse.json({
        success: true,
        planners: users.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          rol: user.rol
        }))
      });

    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      return NextResponse.json({
        success: false,
        message: "Error al obtener usuarios"
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error general:', error);
    return NextResponse.json({
      success: false,
      message: "Error interno del servidor"
    }, { status: 500 });
  }
} 