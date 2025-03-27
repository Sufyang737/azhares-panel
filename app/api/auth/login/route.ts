import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/auth/login - Iniciando proceso de login");
    
    // Inicialización de PocketBase usando la variable de entorno
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
    
    const data = await request.json();
    console.log("Intentando autenticar al usuario:", data.identity);
    
    // Validar los campos requeridos
    if (!data.identity || !data.password) {
      console.log("Error: Faltan credenciales");
      return NextResponse.json(
        { success: false, message: 'Se requiere usuario/email y contraseña' },
        { status: 400 }
      );
    }
    
    try {
      // Autenticar con PocketBase
      const authData = await pb.collection('usuarios').authWithPassword(
        data.identity,
        data.password
      );
      
      console.log("Autenticación exitosa para:", authData.record.id);
      
      // Obtener los datos del usuario
      const userData = {
        id: authData.record.id,
        email: authData.record.email,
        username: authData.record.username,
        rol: authData.record.rol,
        emailVisibility: authData.record.emailVisibility,
        verified: authData.record.verified,
        created: authData.record.created,
        updated: authData.record.updated
      };
      
      // Preparar respuesta
      const response = NextResponse.json({ 
        success: true, 
        user: userData
      });
      
      // Obtener las cookies de autenticación de PocketBase
      const pbAuthCookie = pb.authStore.exportToCookie();
      
      // Extraer las partes de la cookie
      const cookieParts = pbAuthCookie.split(';');
      const authValue = cookieParts[0].split('=')[1];
      
      console.log("Cookie PB Auth:", authValue ? "presente" : "no presente");
      
      // Configurar la cookie con los parámetros adecuados para que persista
      response.cookies.set('pb_auth', authValue, {
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 1 semana
        httpOnly: true, // Cookie solo accesible en el servidor
        secure: process.env.NODE_ENV === 'production', // Segura en producción
        sameSite: 'lax',
      });
      
      // Guardar también el modelo de autenticación
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
      
      console.log("Cookies de autenticación establecidas correctamente");
      
      return response;
    } catch (authError) {
      console.error('Error en la autenticación:', authError);
      return NextResponse.json(
        { success: false, message: 'Credenciales incorrectas' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    return NextResponse.json(
      { success: false, message: 'Error en el servidor' },
      { status: 500 }
    );
  }
} 