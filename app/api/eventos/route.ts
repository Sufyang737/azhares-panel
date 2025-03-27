import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

// Inicialización de PocketBase
const pb = new PocketBase('https://pocketbase-ykw4ks40gswowocosk80k440.srv.clostech.tech');

// Handler para GET (obtener eventos)
export async function GET() {
  try {
    const eventos = await pb.collection('evento').getList(1, 50, {
      sort: '-created',
    });
    
    return NextResponse.json({ 
      success: true, 
      data: eventos.items
    });
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener eventos' },
      { status: 500 }
    );
  }
}

// Handler para POST (crear evento)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validar los campos requeridos
    if (!data.nombre || !data.tipo || !data.fecha) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }
    
    // Si es cliente nuevo, verificar que tenga los campos necesarios
    if (data.cliente_nuevo === true) {
      if (!data.cliente_nombre || !data.cliente_email) {
        return NextResponse.json(
          { success: false, error: 'Datos de cliente nuevo incompletos' },
          { status: 400 }
        );
      }
      
      // En un escenario real, aquí podríamos crear primero el cliente
      // y luego usar su ID para el evento
      // const nuevoCliente = await pb.collection('clientes').create({
      //   nombre: data.cliente_nombre,
      //   email: data.cliente_email
      // });
      // data.cliente_id = nuevoCliente.id;
    } else if (!data.cliente_id) {
      return NextResponse.json(
        { success: false, error: 'Debe seleccionar un cliente existente o crear uno nuevo' },
        { status: 400 }
      );
    }
    
    // Eliminar campos que no son parte del modelo de PocketBase
    delete data.cliente_nuevo;
    
    const record = await pb.collection('evento').create(data);
    
    return NextResponse.json({ 
      success: true, 
      data: record 
    });
  } catch (error) {
    console.error('Error al crear evento:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear evento' },
      { status: 500 }
    );
  }
} 