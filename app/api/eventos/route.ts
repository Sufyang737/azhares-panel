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
    
    // Obtener eventos con expansión de relaciones
    const eventos = await pb.collection('evento').getList(1, 50, {
      sort: '-created',
      expand: 'cliente_id,planner_id' // Expandir las relaciones
    });
    
    // Imprimir información de diagnóstico
    console.log("Número total de eventos:", eventos.items.length);
    eventos.items.forEach((evento, index) => {
      console.log(`Evento ${index + 1} (ID ${evento.id}):`);
      console.log("  - planner_id:", evento.planner_id || "no asignado");
      console.log("  - expand:", evento.expand ? Object.keys(evento.expand).join(", ") : "no hay expand");
      if (evento.expand?.planner_id) {
        console.log("  - planner expandido:", {
          id: evento.expand.planner_id.id,
          nombre: evento.expand.planner_id.nombre || evento.expand.planner_id.username
        });
      }
    });
    
    // Transformar los datos para incluir las relaciones expandidas
    const eventosFormateados = eventos.items.map(evento => {
      // Construir el objeto cliente a partir de la relación expandida
      const cliente = evento.expand?.cliente_id ? {
        id: evento.expand.cliente_id.id,
        nombre: evento.expand.cliente_id.nombre,
        contacto: evento.expand.cliente_id.contacto,
        email: evento.expand.cliente_id.email
      } : null;
      
      // Construir el objeto planner a partir de la relación expandida
      let planner = null;
      if (evento.expand?.planner_id) {
        planner = {
          id: evento.expand.planner_id.id,
          nombre: evento.expand.planner_id.nombre || evento.expand.planner_id.username || "Planner"
        };
      }
      
      // Devolver el evento con las relaciones como propiedades directas
      return {
        id: evento.id,
        nombre: evento.nombre,
        tipo: evento.tipo,
        fecha: evento.fecha,
        estado: evento.estado,
        comentario: evento.comentario,
        cliente: cliente,
        planner: planner,
        created: evento.created,
        updated: evento.updated
      };
    });
    
    return NextResponse.json({ 
      success: true, 
      data: eventosFormateados
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
    
    // Autenticar como administrador o usar token de sesión
    const authCookie = request.cookies.get('pb_auth');
    if (authCookie) {
      console.log('POST Evento - Usando cookie de autenticación');
      pb.authStore.loadFromCookie(authCookie.value);
      if (!pb.authStore.isValid) {
        console.log('POST Evento - Cookie inválida, intentando token admin');
        // Si la cookie es inválida, intentar usar el token admin
        const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
        if (adminToken) {
          pb.authStore.save(adminToken, null);
        } else {
          throw new Error('No hay autenticación válida');
        }
      }
    } else {
      console.log('POST Evento - No hay cookie, intentando token admin');
      const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
      if (adminToken) {
        pb.authStore.save(adminToken, null);
      } else {
        throw new Error('Token de administrador no configurado');
      }
    }
    
    // Obtener datos del cuerpo de la solicitud
    const data = await request.json();
    console.log('POST Evento - Datos recibidos:', JSON.stringify(data, null, 2));
    
    // Validar campos requeridos
    if (!data.nombre || !data.tipo || !data.fecha) {
      console.log('POST Evento - Faltan campos requeridos');
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos (nombre, tipo, fecha)' },
        { status: 400 }
      );
    }
    
    // Verificar qué tipo de cliente es (nuevo o existente)
    if (data.cliente_nuevo) {
      console.log('POST Evento - Cliente nuevo detectado');
      // Validar campos para cliente nuevo
      if (!data.cliente_nombre || !data.cliente_email) {
        console.log('POST Evento - Faltan datos de cliente nuevo');
        return NextResponse.json(
          { success: false, error: 'Para clientes nuevos, se requiere nombre y email' },
          { status: 400 }
        );
      }
      
      // Crear cliente en PocketBase
      try {
        const clienteData = {
          nombre: data.cliente_nombre,
          contacto: data.cliente_email,
          email: data.cliente_email
        };
        
        console.log('POST Evento - Creando cliente nuevo:', clienteData);
        const clienteRecord = await pb.collection('cliente').create(clienteData);
        console.log('POST Evento - Cliente creado con ID:', clienteRecord.id);
        
        // Asignar el ID del cliente creado
        data.cliente_id = clienteRecord.id;
        
        // Enviar email de bienvenida al nuevo cliente
        try {
          console.log('POST Evento - Enviando email de bienvenida al cliente nuevo');
          
          // Formatear la fecha para mostrarla en el email
          const fechaEvento = new Date(data.fecha);
          const fechaFormateada = fechaEvento.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          
          // Llamar al endpoint para enviar el email
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const emailResponse = await fetch(`${appUrl}/api/email/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              to: data.cliente_email,
              subject: `¡Bienvenido/a! Tu evento "${data.nombre}" ha sido registrado`,
              clientName: data.cliente_nombre,
              eventName: data.nombre,
              eventDate: fechaFormateada
            })
          });
          
          const emailResult = await emailResponse.json();
          console.log('POST Evento - Resultado del envío de email:', emailResult);
          
          if (!emailResult.success) {
            // No bloqueamos la creación del evento si falla el email
            console.warn('POST Evento - No se pudo enviar el email, pero se continuará con la creación del evento');
          }
        } catch (emailError) {
          console.error('POST Evento - Error al enviar email:', emailError);
          // No bloqueamos la creación del evento si falla el email
        }
      } catch (error) {
        console.error('POST Evento - Error al crear cliente:', error);
        return NextResponse.json(
          { success: false, error: 'Error al crear el cliente' },
          { status: 500 }
        );
      }
    } else if (!data.cliente_id) {
      console.log('POST Evento - Cliente existente pero falta ID');
      return NextResponse.json(
        { success: false, error: 'Se requiere ID de cliente existente' },
        { status: 400 }
      );
    }
    
    // Si se especificó un planner, verificar que existe
    if (data.planner_id) {
      try {
        console.log('POST Evento - Verificando planner con ID:', data.planner_id);
        const planner = await pb.collection('usuarios').getOne(data.planner_id);
        console.log('POST Evento - Planner encontrado:', planner.username);
      } catch (error) {
        console.error('POST Evento - Error al verificar planner:', error);
        // No bloqueamos la creación si el planner no existe, solo lo registramos
      }
    }
    
    // Eliminar campos que no pertenecen al modelo
    delete data.cliente_nuevo;
    delete data.cliente_nombre;
    delete data.cliente_email;
    
    console.log('POST Evento - Datos a guardar:', JSON.stringify(data, null, 2));
    
    // Crear el evento en PocketBase
    try {
      const record = await pb.collection('evento').create(data);
      console.log('POST Evento - Evento creado con ID:', record.id);
      
      return NextResponse.json({
        success: true,
        data: record,
        id: record.id
      });
    } catch (error) {
      console.error('POST Evento - Error al crear evento:', error);
      return NextResponse.json(
        { success: false, error: 'Error al crear evento' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('POST Evento - Error general:', error);
    return NextResponse.json(
      { success: false, error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

// Handler para PATCH (actualizar evento)
export async function PATCH(request: NextRequest) {
  try {
    const pb = new PocketBase(pocketbaseUrl);
    
    // Autenticar como administrador
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
    if (adminToken) {
      pb.authStore.save(adminToken, null);
    } else {
      throw new Error('Token de administrador no configurado');
    }
    
    // Obtener datos del cuerpo de la solicitud
    const data = await request.json();
    console.log('PATCH Evento - Datos recibidos:', JSON.stringify(data, null, 2));
    
    // Validar que se proporcionó un ID
    if (!data.id) {
      console.log('PATCH Evento - Falta ID del evento');
      return NextResponse.json(
        { success: false, error: 'Se requiere ID del evento' },
        { status: 400 }
      );
    }
    
    // Extraer ID y preparar datos para actualización
    const eventId = data.id;
    const updateData = { ...data };
    delete updateData.id; // Eliminar ID de los datos a actualizar
    
    console.log(`PATCH Evento - Actualizando evento ${eventId} con:`, JSON.stringify(updateData, null, 2));
    
    // Si se está actualizando el cliente, verificar que existe
    if (updateData.cliente_id) {
      try {
        console.log('PATCH Evento - Verificando cliente con ID:', updateData.cliente_id);
        const cliente = await pb.collection('cliente').getOne(updateData.cliente_id);
        console.log('PATCH Evento - Cliente encontrado:', cliente.nombre);
      } catch (error) {
        console.error('PATCH Evento - Error al verificar cliente:', error);
        return NextResponse.json(
          { success: false, error: 'Cliente no encontrado' },
          { status: 400 }
        );
      }
    }
    
    // Si se está actualizando el planner, verificar que existe
    if (updateData.planner_id) {
      try {
        console.log('PATCH Evento - Verificando planner con ID:', updateData.planner_id);
        const planner = await pb.collection('usuarios').getOne(updateData.planner_id);
        console.log('PATCH Evento - Planner encontrado:', planner.username);
      } catch (error) {
        console.error('PATCH Evento - Error al verificar planner:', error);
        return NextResponse.json(
          { success: false, error: 'Planner no encontrado' },
          { status: 400 }
        );
      }
    }
    
    // Actualizar el evento en PocketBase
    try {
      const updatedRecord = await pb.collection('evento').update(eventId, updateData);
      console.log('PATCH Evento - Evento actualizado con éxito:', updatedRecord.id);
      
      // Obtener el evento actualizado con sus relaciones expandidas
      const eventoCompleto = await pb.collection('evento').getOne(updatedRecord.id, {
        expand: 'cliente_id,planner_id'
      });
      
      // Formatear la respuesta
      const cliente = eventoCompleto.expand?.cliente_id ? {
        id: eventoCompleto.expand.cliente_id.id,
        nombre: eventoCompleto.expand.cliente_id.nombre,
        contacto: eventoCompleto.expand.cliente_id.contacto,
        email: eventoCompleto.expand.cliente_id.email
      } : null;
      
      let planner = null;
      if (eventoCompleto.expand?.planner_id) {
        planner = {
          id: eventoCompleto.expand.planner_id.id,
          nombre: eventoCompleto.expand.planner_id.nombre || eventoCompleto.expand.planner_id.username || "Planner"
        };
      }
      
      const respuestaFormateada = {
        id: eventoCompleto.id,
        nombre: eventoCompleto.nombre,
        tipo: eventoCompleto.tipo,
        fecha: eventoCompleto.fecha,
        estado: eventoCompleto.estado,
        comentario: eventoCompleto.comentario,
        cliente: cliente,
        planner: planner,
        created: eventoCompleto.created,
        updated: eventoCompleto.updated
      };
      
      return NextResponse.json({
        success: true,
        data: respuestaFormateada
      });
    } catch (error) {
      console.error('PATCH Evento - Error al actualizar evento:', error);
      
      // Intentar obtener detalles del error
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      return NextResponse.json(
        { success: false, error: `Error al actualizar evento: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('PATCH Evento - Error general:', error);
    return NextResponse.json(
      { success: false, error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

// Handler para DELETE (eliminar evento)
export async function DELETE(request: NextRequest) {
  try {
    const pb = new PocketBase(pocketbaseUrl);
    
    // Autenticar como administrador
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
    if (adminToken) {
      pb.authStore.save(adminToken, null);
    } else {
      throw new Error('Token de administrador no configurado');
    }
    
    // Obtener el ID del evento a eliminar desde la URL
    const url = new URL(request.url);
    const eventId = url.searchParams.get('id');
    
    if (!eventId) {
      console.log('DELETE Evento - Falta ID del evento');
      return NextResponse.json(
        { success: false, error: 'Se requiere ID del evento' },
        { status: 400 }
      );
    }
    
    console.log(`DELETE Evento - Intentando eliminar evento ${eventId}`);
    
    try {
      // Intentar eliminar el evento directamente
      await pb.collection('evento').delete(eventId);
      console.log('DELETE Evento - Evento eliminado con éxito');
      
      return NextResponse.json({
        success: true,
        message: 'Evento eliminado correctamente'
      });
    } catch (error) {
      // Verificar si el error es porque el evento no existe (404)
      console.error('DELETE Evento - Error al eliminar evento:', error);
      
      if (error instanceof Error && error.toString().includes('404')) {
        console.log('DELETE Evento - El evento ya no existe en la base de datos');
        // Si el evento no existe, consideramos que la operación fue exitosa
        // porque el objetivo final (que el evento no exista) se ha cumplido
        return NextResponse.json({
          success: true,
          message: 'Evento no encontrado o ya eliminado'
        });
      }
      
      // Para otros tipos de errores, devolvemos un error normal
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      return NextResponse.json(
        { success: false, error: `Error al eliminar evento: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('DELETE Evento - Error general:', error);
    return NextResponse.json(
      { success: false, error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
} 


//En pusa, Cencelado, En curso, finalizado

// agregar fecha 
// en el formulario enviar el template prearmado para el tipo de evento
