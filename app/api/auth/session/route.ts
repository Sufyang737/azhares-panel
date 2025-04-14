import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

export async function GET(req: NextRequest) {
  try {
    // Obtener la cookie de autenticación
    const authCookie = req.cookies.get('pb_auth');
    
    if (!authCookie?.value) {
      return NextResponse.json(
        { error: 'No authentication cookie found' },
        { status: 401 }
      );
    }

    // Inicializar PocketBase
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
    
    // Cargar la autenticación desde la cookie
    pb.authStore.loadFromCookie(`pb_auth=${authCookie.value}`);
    
    // Verificar si la autenticación es válida
    if (!pb.authStore.isValid) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Devolver los datos de la sesión
    return NextResponse.json({
      token: pb.authStore.token,
      model: pb.authStore.model
    });
  } catch (error) {
    console.error('Error in session endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 