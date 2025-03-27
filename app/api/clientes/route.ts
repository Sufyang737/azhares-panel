import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

// Handler para POST (crear cliente)
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
    if (!data.nombre || !data.contacto) {
      return NextResponse.json(
        { success: false, error: 'Se requieren al menos nombre y contacto' },
        { status: 400 }
      );
    }
    
    // Crear el cliente en PocketBase
    const record = await pb.collection('cliente').create(data);
    
    return NextResponse.json({ 
      success: true, 
      data: record,
      id: record.id
    });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear cliente' },
      { status: 500 }
    );
  }
}

// Handler para GET (obtener clientes)
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
    
    const clientes = await pb.collection('cliente').getList(1, 50, {
      sort: '-created',
    });
    
    return NextResponse.json({ 
      success: true, 
      data: clientes.items
    });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener clientes' },
      { status: 500 }
    );
  }
} 