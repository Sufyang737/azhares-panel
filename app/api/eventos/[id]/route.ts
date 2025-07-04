import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

// Inicialización de PocketBase usando la variable de entorno
const pocketbaseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || '';

// Obtener un evento específico
export async function GET(request: NextRequest) {
  const url = request.url;
  const idFromUrl = url.split('/').pop();
  
  if (!idFromUrl) {
    return NextResponse.json(
      { success: false, error: 'ID no proporcionado' },
      { status: 400 }
    );
  }
  
  try {
    const pb = new PocketBase(pocketbaseUrl);
    
    // Autenticar como administrador
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
    if (adminToken) {
      pb.authStore.save(adminToken, null);
    } else {
      throw new Error('Token de administrador no configurado');
    }

    const record = await pb.collection('evento').getOne(idFromUrl);
    
    return NextResponse.json({ 
      success: true, 
      data: record
    });
  } catch (error) {
    console.error(`Error al obtener evento:`, error);
    return NextResponse.json(
      { success: false, error: 'Evento no encontrado' },
      { status: 404 }
    );
  }
}

// Actualizar un evento
export async function PATCH(request: NextRequest) {
  const url = request.url;
  const idFromUrl = url.split('/').pop();
  
  if (!idFromUrl) {
    return NextResponse.json(
      { success: false, error: 'ID no proporcionado' },
      { status: 400 }
    );
  }
  
  try {
    const pb = new PocketBase(pocketbaseUrl);
    
    // Autenticar como administrador
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
    if (adminToken) {
      pb.authStore.save(adminToken, null);
    } else {
      throw new Error('Token de administrador no configurado');
    }

    const data = await request.json();
    
    const record = await pb.collection('evento').update(idFromUrl, data);
    
    return NextResponse.json({ 
      success: true, 
      data: record
    });
  } catch (error) {
    console.error(`Error al actualizar evento:`, error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar el evento' },
      { status: 500 }
    );
  }
}

// Eliminar un evento
export async function DELETE(request: NextRequest) {
  const url = request.url;
  const idFromUrl = url.split('/').pop();
  
  if (!idFromUrl) {
    return NextResponse.json(
      { success: false, error: 'ID no proporcionado' },
      { status: 400 }
    );
  }
  
  try {
    const pb = new PocketBase(pocketbaseUrl);
    
    // Autenticar como administrador
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
    if (adminToken) {
      pb.authStore.save(adminToken, null);
    } else {
      throw new Error('Token de administrador no configurado');
    }

    await pb.collection('evento').delete(idFromUrl);
    
    return NextResponse.json({ 
      success: true,
      message: 'Evento eliminado correctamente'
    });
  } catch (error) {
    console.error(`Error al eliminar evento:`, error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar el evento' },
      { status: 500 }
    );
  }
} 