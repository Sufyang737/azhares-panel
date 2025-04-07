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

/**
 * GET handler para obtener la lista de planners
 * Este endpoint requiere autenticación
 */
export async function GET(request: NextRequest) {
  try {
    // Inicialización de PocketBase
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

    // Obtener la cookie de autenticación
    const authCookie = request.cookies.get('pb_auth');
    if (!authCookie) {
      return NextResponse.json(
        { success: false, message: 'No autenticado' },
        { status: 401 }
      );
    }

    // Cargar la autenticación desde la cookie
    pb.authStore.loadFromCookie(authCookie.value);

    // Verificar si el usuario está autenticado
    if (!pb.authStore.isValid) {
      return NextResponse.json(
        { success: false, message: 'Sesión inválida o expirada' },
        { status: 401 }
      );
    }

    try {
      // Obtener los usuarios con rol de planner
      const planners = await pb.collection('usuarios').getList(1, 50, {
        filter: 'rol = "planner"',
        sort: 'nombre',
        fields: 'id,nombre'
      });

      return NextResponse.json({
        success: true,
        planners: planners.items
      });
    } catch (error) {
      console.error('Error al obtener planners:', error);
      return NextResponse.json(
        { success: false, message: 'Error al obtener planners' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error general:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 