import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

// Handler para POST (crear persona)
export async function POST(request: NextRequest) {
  try {
    // Inicialización de PocketBase usando la variable de entorno
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
    
    // Autenticar como administrador
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
    if (adminToken) {
      pb.authStore.save(adminToken, null);
    } else {
      throw new Error('Token de administrador no configurado');
    }
    
    const data = await request.json();
    
    // Validar los campos requeridos mínimos
    if (!data.nombre || !data.email) {
      return NextResponse.json(
        { success: false, error: 'Se requieren al menos nombre y email' },
        { status: 400 }
      );
    }
    
    // Crear la persona en PocketBase
    const record = await pb.collection('personas').create(data);
    
    return NextResponse.json({ 
      success: true, 
      data: record,
      id: record.id
    });
  } catch (error) {
    console.error('Error al crear persona:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear persona' },
      { status: 500 }
    );
  }
}

// Handler para GET (obtener personas)
export async function GET() {
  try {
    // Inicialización de PocketBase usando la variable de entorno
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
    
    // Autenticar como administrador
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
    if (adminToken) {
      pb.authStore.save(adminToken, null);
    } else {
      throw new Error('Token de administrador no configurado');
    }
    
    const personas = await pb.collection('personas').getList(1, 50, {
      sort: '-created',
    });
    
    return NextResponse.json({ 
      success: true, 
      data: personas.items
    });
  } catch (error) {
    console.error('Error al obtener personas:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener personas' },
      { status: 500 }
    );
  }
} 