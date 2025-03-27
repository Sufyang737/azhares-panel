import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

// Inicialización de PocketBase
const pb = new PocketBase('https://pocketbase-ykw4ks40gswowocosk80k440.srv.clostech.tech');

// Obtener un evento específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const record = await pb.collection('evento').getOne(id);
    
    return NextResponse.json({ 
      success: true, 
      data: record 
    });
  } catch (error) {
    console.error(`Error al obtener evento con ID ${params.id}:`, error);
    return NextResponse.json(
      { success: false, error: 'Evento no encontrado' },
      { status: 404 }
    );
  }
}

// Actualizar un evento
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();
    
    const record = await pb.collection('evento').update(id, data);
    
    return NextResponse.json({ 
      success: true, 
      data: record 
    });
  } catch (error) {
    console.error(`Error al actualizar evento con ID ${params.id}:`, error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar evento' },
      { status: 500 }
    );
  }
}

// Eliminar un evento
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    await pb.collection('evento').delete(id);
    
    return NextResponse.json({ 
      success: true,
      message: 'Evento eliminado correctamente'
    });
  } catch (error) {
    console.error(`Error al eliminar evento con ID ${params.id}:`, error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar evento' },
      { status: 500 }
    );
  }
} 