import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import { Resend } from 'resend';

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
          
          // Preparar los datos para el email
          const emailData = {
            to: data.cliente_email,
            clientName: data.cliente_nombre,
            eventName: data.nombre,
            eventDate: fechaFormateada,
            plannerName: 'Sin asignar',
            clienteId: clienteRecord.id
          };
          
          // Obtener el nombre del planner si está asignado
          if (data.planner_id) {
            try {
              const planner = await pb.collection('usuarios').getOne(data.planner_id);
              emailData.plannerName = planner.username || 'Sin asignar';
            } catch (e) {
              console.warn('POST Evento - Error al obtener datos del planner para el email:', e);
            }
          }
          
          console.log('POST Evento - Datos para el email:', JSON.stringify(emailData, null, 2));
          
          // Primera opción: Usar Resend directamente aquí en lugar de hacer una llamada a otro endpoint
          try {
            const resend = new Resend(process.env.RESEND_API_KEY);
            
            // Determinar si estamos en entorno de desarrollo
            const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
            
            // Email verificado para redireccionar durante desarrollo/pruebas
            const VERIFIED_EMAIL = 'administracion@azaresweb.com.ar';
            
            // Destino real en base al entorno
            const actualRecipient = isDevelopment ? VERIFIED_EMAIL : data.cliente_email;
            
            if (isDevelopment) {
              console.log(`POST Evento - MODO DESARROLLO: Redirigiendo email de ${data.cliente_email} a ${actualRecipient}`);
            }
            
            // Construir URL del formulario
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            const formUrl = `${appUrl}/formulario/${encodeURIComponent(clienteRecord.id)}`;
            
            // Crear texto con el enlace al formulario
            const emailText = `Hola ${data.cliente_nombre}, gracias por registrarte. Tu evento "${data.nombre}" ha sido programado para ${fechaFormateada}.

Para completar tus datos personales y ayudarnos a brindarte un mejor servicio, por favor accede al siguiente enlace:
${formUrl}

Muchas gracias por confiar en Azhares Panel.
`;
            
            // Crear HTML con el enlace al formulario
            const emailHtml = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #5e17eb;">¡Bienvenido a Azhares Panel!</h1>
  <p>Hola ${data.cliente_nombre},</p>
  <p>Gracias por registrarte. Tu evento "${data.nombre}" ha sido programado para ${fechaFormateada}.</p>
  <div style="background-color: #f7f7f7; border-radius: 4px; padding: 16px; margin: 24px 0;">
    <p><strong>Detalles del evento:</strong></p>
    <p>• Nombre del evento: ${data.nombre}<br>
    • Fecha: ${fechaFormateada}<br>
    • Planificador asignado: ${emailData.plannerName}</p>
  </div>
  <p>Para completar tus datos personales y ayudarnos a brindarte un mejor servicio, por favor haz clic en el siguiente botón:</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="${formUrl}" style="background-color: #5e17eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold;">Completar mis datos</a>
  </div>
  <p>Si el botón no funciona, puedes copiar y pegar este enlace en tu navegador:</p>
  <p>${formUrl}</p>
  <p>Nuestro equipo está comprometido a hacer de tu evento una experiencia inolvidable.</p>
  <p>Saludos cordiales,<br>El equipo de Azhares</p>
</div>
`;
            
            const response = await resend.emails.send({
              from: 'Azhares Panel <onboarding@resend.dev>',
              to: [actualRecipient],
              subject: `¡Bienvenido a Azhares Panel!${isDevelopment ? ' [TEST]' : ''}`,
              html: emailHtml,
              text: emailText
            });
            
            console.log('POST Evento - Email enviado directamente con Resend:', response);
          } catch (directEmailError) {
            console.error('POST Evento - Error al enviar email directamente con Resend:', directEmailError);
          }
          
          // Como respaldo, intentar también con el endpoint
          try {
            // Llamar al endpoint para enviar el email
            const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/send`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(emailData)
            });
            
            if (!emailResponse.ok) {
              const errorText = await emailResponse.text();
              console.error('POST Evento - Error al enviar email. Status:', emailResponse.status, 'Respuesta:', errorText);
            } else {
              console.log('POST Evento - Email enviado correctamente a través del endpoint');
            }
          } catch (endpointError) {
            console.error('POST Evento - Error al comunicarse con el endpoint de email:', endpointError);
          }
        } catch (emailError) {
          console.error('POST Evento - Error general al enviar email:', emailError);
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
      console.log('POST Evento - Datos para crear evento:', JSON.stringify(data, null, 2));
      
      // Asegurar que los campos requeridos estén presentes y con formato correcto
      const eventoData = {
        nombre: data.nombre,
        tipo: normalizarTipo(data.tipo),
        fecha: data.fecha,
        estado: normalizarEstado(data.estado || 'en-curso'),
        cliente_id: data.cliente_id,
        planner_id: data.planner_id || ""
      };
      
      console.log('POST Evento - Datos formateados:', JSON.stringify(eventoData, null, 2));
      
      try {
        const record = await pb.collection('evento').create(eventoData);
        console.log('POST Evento - Evento creado con ID:', record.id);
        
        return NextResponse.json({
          success: true,
          data: record,
          id: record.id
        });
      } catch (createError: unknown) {
        // Capturar y mostrar los detalles específicos del error de PocketBase
        const error = createError as { 
          response?: { 
            data?: Record<string, unknown>; 
            status?: number;
          };
          message?: string;
          status?: number;
        };
        
        console.error('POST Evento - Error al crear evento. Status:', error.response?.status || error.status);
        
        if (error.response && error.response.data) {
          console.error('POST Evento - Detalles del error:', JSON.stringify(error.response.data, null, 2));
          
          // Mostrar cada campo con error
          Object.entries(error.response.data).forEach(([field, errorDetails]) => {
            console.error(`Campo '${field}' error:`, JSON.stringify(errorDetails, null, 2));
          });
        }
        
        return NextResponse.json(
          { 
            success: false, 
            error: 'Error al crear evento', 
            details: error.response?.data || error.message,
            status: error.response?.status || error.status || 500
          },
          { status: error.response?.status || error.status || 500 }
        );
      }
    } catch (error: unknown) {
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

// Función para normalizar el tipo de evento (eliminar acentos, espacios, etc.)
function normalizarTipo(tipo: string): string {
  // Valores aceptados por PocketBase para el campo tipo
  const tiposValidos = [
    "aniversario", "bat-bar", "bautismo", "casamiento", 
    "civil", "comunion", "corporativo", "cumpleanos", 
    "egresados", "en-casa", "festejo", "fiesta15"
  ];
  
  // Normalizar: eliminar acentos, convertir a minúsculas y quitar espacios
  const tipoNormalizado = tipo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // Eliminar acentos
    .replace(/\s+/g, "");             // Eliminar espacios
  
  console.log(`POST Evento - Tipo original: "${tipo}", normalizado: "${tipoNormalizado}"`);
  
  // Verificar si el tipo normalizado está en la lista de tipos válidos
  if (tiposValidos.includes(tipoNormalizado)) {
    return tipoNormalizado;
  }
  
  // Mapeo de valores comunes que podrían no coincidir exactamente
  const mapeoTipos: Record<string, string> = {
    "cumpleanos": "cumpleanos",
    "cumpleaños": "cumpleanos",
    "boda": "casamiento",
    "otro": "festejo"
  };
  
  if (mapeoTipos[tipoNormalizado]) {
    return mapeoTipos[tipoNormalizado];
  }
  
  // Si no es un tipo válido, usar "festejo" como valor por defecto
  console.log(`POST Evento - Tipo "${tipoNormalizado}" no válido, usando "festejo" por defecto`);
  return "festejo";
}

// Función para normalizar el estado del evento
function normalizarEstado(estado: string): string {
  // Valores aceptados por PocketBase para el campo estado
  const estadosValidos = ["en-curso", "finalizado", "cancelado"];
  
  // Normalizar: eliminar acentos, convertir a minúsculas y quitar espacios
  const estadoNormalizado = estado
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // Eliminar acentos
    .replace(/\s+/g, "-");            // Reemplazar espacios por guiones
  
  console.log(`POST Evento - Estado original: "${estado}", normalizado: "${estadoNormalizado}"`);
  
  // Verificar si el estado normalizado está en la lista de estados válidos
  if (estadosValidos.includes(estadoNormalizado)) {
    return estadoNormalizado;
  }
  
  // Mapeo de valores comunes que podrían no coincidir exactamente
  const mapeoEstados: Record<string, string> = {
    "pendiente": "en-curso",
    "encurso": "en-curso",
    "completado": "finalizado",
    "terminado": "finalizado"
  };
  
  if (mapeoEstados[estadoNormalizado]) {
    return mapeoEstados[estadoNormalizado];
  }
  
  // Si no es un estado válido, usar "en-curso" como valor por defecto
  console.log(`POST Evento - Estado "${estadoNormalizado}" no válido, usando "en-curso" por defecto`);
  return "en-curso";
} 