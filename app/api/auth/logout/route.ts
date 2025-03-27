import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true, message: 'Logout exitoso' });
    
    // Eliminar cookie de autenticación
    response.cookies.delete('pb_auth');
    
    // Eliminar otras cookies relacionadas si existen
    response.cookies.delete('pb_auth_model');
    response.cookies.delete('user_data');
    
    return response;
  } catch (error) {
    console.error('Error durante el proceso de logout:', error);
    return NextResponse.json(
      { success: false, message: 'Error al procesar el logout' },
      { status: 500 }
    );
  }
} 