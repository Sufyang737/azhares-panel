import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

// Inicialización de PocketBase usando la variable de entorno
const pocketbaseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase-ykw4ks40gswowocosk80k440.srv.clostech.tech';

// Handler para GET (obtener eventos)
export async function GET() {
  try {
    const pb = new PocketBase(pocketbaseUrl);
    
    // Autenticar como administrador
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
    if (adminToken) {
      pb.authStore.save(adminToken, null);
    } else {
      throw new Error('Token de administrador no configurado');
    }
    
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
    const pb = new PocketBase(pocketbaseUrl);
    
    // Autenticar como administrador
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
    if (adminToken) {
      pb.authStore.save(adminToken, null);
    } else {
      throw new Error('Token de administrador no configurado');
    }
    
    const data = await request.json();
    
    // Validar los campos requeridos
    if (!data.nombre || !data.tipo || !data.fecha) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }
    
    // Si es cliente nuevo, crear primero registros en personas y cliente
    if (data.cliente_nuevo === true) {
      if (!data.cliente_nombre || !data.cliente_email) {
        return NextResponse.json(
          { success: false, error: 'Datos de cliente nuevo incompletos' },
          { status: 400 }
        );
      }
      
      try {
        // 1. Crear registro de persona primero
        const personaData = {
          nombre: data.cliente_nombre,
          email: data.cliente_email,
          // Opcionalmente podríamos incluir más campos si están disponibles
        };
        
        const nuevaPersona = await pb.collection('personas').create(personaData);
        
        // 2. Crear registro de cliente utilizando el ID de la persona
        const clienteData = {
          nombre: data.cliente_nombre,
          contacto: data.cliente_email,
          // Agregar el ID de la persona creada en la relación persona_id
          persona_id: [nuevaPersona.id]
        };
        
        const nuevoCliente = await pb.collection('cliente').create(clienteData);
        
        // 3. Usar el ID del cliente creado para el evento
        data.cliente_id = nuevoCliente.id;
      } catch (error) {
        console.error('Error al crear persona/cliente:', error);
        return NextResponse.json(
          { success: false, error: 'Error al crear los datos del cliente nuevo' },
          { status: 500 }
        );
      }
    } else if (!data.cliente_id) {
      return NextResponse.json(
        { success: false, error: 'Debe seleccionar un cliente existente o crear uno nuevo' },
        { status: 400 }
      );
    }
    
    // Eliminar campos que no son parte del modelo de PocketBase
    delete data.cliente_nuevo;
    delete data.cliente_nombre;
    delete data.cliente_email;
    
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