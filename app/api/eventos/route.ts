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
          const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
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