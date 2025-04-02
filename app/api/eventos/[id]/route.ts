import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

// Inicialización de PocketBase
const pb = new PocketBase('https://pocketbase-ykw4ks40gswowocosk80k440.srv.clostech.tech');

// Obtener un evento específico
export async function GET(request: NextRequest) {
  // Obtener ID desde la URL
  const url = request.url;
  const idFromUrl = url.split('/').pop();
  
  if (!idFromUrl) {
    return NextResponse.json(
      { success: false, error: 'ID no proporcionado' },
      { status: 400 }
    );
  }
  
  try {
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
    const data = await request.json();
    
    const record = await pb.collection('evento').update(idFromUrl, data);
    
    return NextResponse.json({ 
      success: true, 
      data: record
    });
  } catch (error) {
    console.error(`Error:`, error);
    return NextResponse.json(
      { success: false, error: 'Error' },
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
    await pb.collection('evento').delete(idFromUrl);
    
    return NextResponse.json({ 
      success: true,
      message: 'Operación simulada correctamente'
    });
  } catch (error) {
    console.error(`Error:`, error);
    return NextResponse.json(
      { success: false, error: 'Error' },
      { status: 500 }
    );
  }
} 