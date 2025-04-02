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
    
    // Transformar los datos para manejar valores undefined
    const clientesFormateados = clientes.items.map(cliente => {
      return {
        id: cliente.id,
        nombre: cliente.nombre || '',
        contacto: cliente.contacto || null,
        email: cliente.email || null,
        telefono: cliente.telefono || null, 
        direccion: cliente.direccion || null,
        comentarios: cliente.comentarios || null,
        estado: cliente.estado || 'Activo',
        created: cliente.created,
        updated: cliente.updated,
        eventos: cliente.eventos || []
      };
    });
    
    return NextResponse.json({ 
      success: true, 
      data: clientesFormateados
    });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener clientes' },
      { status: 500 }
    );
  }
}

// Handler para PATCH (actualizar cliente)
export async function PATCH(request: NextRequest) {
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
    
    // Obtener datos del cuerpo de la solicitud
    const data = await request.json();
    console.log('PATCH Cliente - Datos recibidos:', JSON.stringify(data, null, 2));
    
    // Validar que se proporcionó un ID
    if (!data.id) {
      console.log('PATCH Cliente - Falta ID del cliente');
      return NextResponse.json(
        { success: false, error: 'Se requiere ID del cliente' },
        { status: 400 }
      );
    }
    
    // Extraer ID y preparar datos para actualización
    const clienteId = data.id;
    const updateData = { ...data };
    delete updateData.id; // Eliminar ID de los datos a actualizar
    
    console.log(`PATCH Cliente - Actualizando cliente ${clienteId} con:`, JSON.stringify(updateData, null, 2));
    
    // Actualizar el cliente en PocketBase
    try {
      const updatedRecord = await pb.collection('cliente').update(clienteId, updateData);
      console.log('PATCH Cliente - Cliente actualizado con éxito:', updatedRecord.id);
      
      return NextResponse.json({
        success: true,
        data: updatedRecord
      });
    } catch (error) {
      console.error('PATCH Cliente - Error al actualizar cliente:', error);
      
      // Intentar obtener detalles del error
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      return NextResponse.json(
        { success: false, error: `Error al actualizar cliente: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('PATCH Cliente - Error general:', error);
    return NextResponse.json(
      { success: false, error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

// Handler para DELETE (eliminar cliente)
export async function DELETE(request: NextRequest) {
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
    
    // Obtener el ID del cliente a eliminar desde la URL
    const url = new URL(request.url);
    const clienteId = url.searchParams.get('id');
    
    if (!clienteId) {
      console.log('DELETE Cliente - Falta ID del cliente');
      return NextResponse.json(
        { success: false, error: 'Se requiere ID del cliente' },
        { status: 400 }
      );
    }
    
    console.log(`DELETE Cliente - Intentando eliminar cliente ${clienteId}`);
    
    // Verificar si el cliente tiene eventos asociados
    try {
      const eventos = await pb.collection('evento').getList(1, 1, {
        filter: `cliente_id="${clienteId}"`
      });
      
      if (eventos.totalItems > 0) {
        console.log(`DELETE Cliente - El cliente ${clienteId} tiene ${eventos.totalItems} eventos asociados`);
        return NextResponse.json(
          { 
            success: false, 
            error: `No se puede eliminar el cliente porque tiene ${eventos.totalItems} eventos asociados` 
          },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('DELETE Cliente - Error al verificar eventos asociados:', error);
      // Continuamos con la eliminación aunque haya error en la verificación
    }
    
    try {
      // Intentar eliminar el cliente
      await pb.collection('cliente').delete(clienteId);
      console.log('DELETE Cliente - Cliente eliminado con éxito');
      
      return NextResponse.json({
        success: true,
        message: 'Cliente eliminado correctamente'
      });
    } catch (error) {
      // Verificar si el error es porque el cliente no existe (404)
      console.error('DELETE Cliente - Error al eliminar cliente:', error);
      
      if (error instanceof Error && error.toString().includes('404')) {
        console.log('DELETE Cliente - El cliente ya no existe en la base de datos');
        return NextResponse.json({
          success: true,
          message: 'Cliente no encontrado o ya eliminado'
        });
      }
      
      // Para otros tipos de errores, devolvemos un error normal
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      return NextResponse.json(
        { success: false, error: `Error al eliminar cliente: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('DELETE Cliente - Error general:', error);
    return NextResponse.json(
      { success: false, error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
} 