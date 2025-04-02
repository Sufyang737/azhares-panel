import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
// No usaremos el componente de React directamente
// import { WelcomeEmail } from '@/components/emails/welcome-template';

// Inicializar Resend con la API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Email verificado para redireccionar durante desarrollo/pruebas
const VERIFIED_EMAIL = 'administracion@azaresweb.com.ar';

// Determinar si estamos en entorno de desarrollo
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

interface EmailRequest {
  to: string;
  subject?: string;
  text?: string;
  html?: string;
  clientName?: string;
  eventName?: string;
  eventDate?: string;
  plannerName?: string;
  clienteId?: string;
  formUrl?: string;
}

// Función para generar el HTML del email
function generateEmailHtml(props: {
  clientName: string;
  eventName: string;
  eventDate: string;
  plannerName: string;
  clienteId?: string;
  formUrl?: string;
}) {
  const {
    clientName,
    eventName,
    eventDate,
    plannerName,
    formUrl
  } = props;
  
  const formularioButton = formUrl 
    ? `<div style="margin: 32px 0; text-align: center;">
         <p style="color: #1a1a1a; font-size: 16px; line-height: 1.5; margin: 12px 0;">
           Para brindarle un mejor servicio, necesitamos algunos datos adicionales. Por favor, complete el siguiente formulario:
         </p>
         <a href="${formUrl}" style="background-color: #5e17eb; border-radius: 4px; color: #fff; font-size: 15px; font-weight: bold; text-decoration: none; text-align: center; display: block; padding: 12px 16px; margin: 0 auto; width: 220px;">
           Completar mis datos
         </a>
       </div>`
    : '';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Bienvenido a Azhares Panel</title>
      </head>
      <body style="background-color: #ffffff; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,'Helvetica Neue',sans-serif;">
        <div style="margin: 0 auto; padding: 20px 0 48px; max-width: 580px;">
          <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; line-height: 1.3; margin: 0 0 24px;">¡Bienvenido a Azhares Panel!</h1>
          <p style="color: #1a1a1a; font-size: 16px; line-height: 1.5; margin: 12px 0;">
            Estimado/a ${clientName},
          </p>
          <p style="color: #1a1a1a; font-size: 16px; line-height: 1.5; margin: 12px 0;">
            ¡Nos complace darle la bienvenida a Azhares Panel! Su evento ha sido registrado exitosamente en nuestro sistema.
          </p>
          <p style="color: #1a1a1a; font-size: 16px; line-height: 1.5; margin: 12px 0;">
            Detalles de su evento:
          </p>
          <div style="color: #1a1a1a; font-size: 14px; line-height: 1.5; margin: 24px 0; padding: 24px; background-color: #f7f7f7; border-radius: 4px;">
            • Nombre del evento: ${eventName}<br />
            • Fecha: ${eventDate}<br />
            • Planificador asignado: ${plannerName}
          </div>
          
          ${formularioButton}
          
          <p style="color: #1a1a1a; font-size: 16px; line-height: 1.5; margin: 12px 0;">
            Nuestro equipo está comprometido a hacer de su evento una experiencia inolvidable. Su planificador asignado se pondrá en contacto con usted próximamente para discutir los detalles.
          </p>
          <p style="color: #1a1a1a; font-size: 16px; line-height: 1.5; margin: 12px 0;">
            Si tiene alguna pregunta o inquietud inmediata, no dude en contactarnos.
          </p>
          <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 24px 0 0;">
            Saludos cordiales,<br />
            El equipo de Azhares
          </p>
        </div>
      </body>
    </html>
  `;
}

export async function POST(request: NextRequest) {
  try {
    // Verificar que la API key de Resend está configurada
    if (!process.env.RESEND_API_KEY) {
      console.error('Email API - Error: RESEND_API_KEY no está configurada en las variables de entorno');
      return NextResponse.json(
        { success: false, error: 'API key de Resend no configurada' },
        { status: 500 }
      );
    }

    // Obtener datos del cuerpo de la solicitud
    const body = await request.json() as EmailRequest;
    console.log('Email API - Datos recibidos:', JSON.stringify(body, null, 2));

    // Validar campos requeridos
    if (!body.to) {
      console.error('Email API - Falta campo obligatorio: to');
      return NextResponse.json(
        { success: false, error: 'El campo "to" es obligatorio' },
        { status: 400 }
      );
    }

    // Formatear la fecha si existe
    let formattedDate = body.eventDate;
    if (body.eventDate) {
      try {
        const date = new Date(body.eventDate);
        formattedDate = date.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch (e) {
        console.warn('Email API - Error al formatear la fecha:', e);
        // Usar la fecha original si hay un error
      }
    }

    // Construir URL del formulario si tenemos un clienteId
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const formUrl = body.formUrl || (body.clienteId ? `${appUrl}/formulario/${encodeURIComponent(body.clienteId)}` : '');

    // Crear el email usando Resend y el componente React
    console.log('Email API - Preparando email para:', body.to);
    
    try {
      // Determinar el destinatario real basado en el entorno
      const actualRecipient = isDevelopment ? VERIFIED_EMAIL : body.to;
      
      if (isDevelopment && actualRecipient !== body.to) {
        console.log(`Email API - MODO DESARROLLO: Redirigiendo email de ${body.to} a ${actualRecipient}`);
      }
      
      // Verificar contenido de datos de entrada para debug
      console.log('Email API - Preparando email con datos:', JSON.stringify({
        to: actualRecipient,
        originalTo: body.to,
        clientName: body.clientName || 'Cliente',
        eventName: body.eventName || 'Evento',
        eventDate: formattedDate || 'Fecha por confirmar',
        plannerName: body.plannerName || 'Sin asignar',
        clienteId: body.clienteId || '',
        formUrl: formUrl || '',
        isDevelopment: isDevelopment
      }, null, 2));

      // Crear los props para el email
      const emailProps = {
        clientName: body.clientName || 'Cliente',
        eventName: body.eventName || 'Evento',
        eventDate: formattedDate || 'Fecha por confirmar',
        plannerName: body.plannerName || 'Sin asignar',
        clienteId: body.clienteId,
        formUrl: formUrl,
      };

      // Generar el HTML del email
      const htmlContent = generateEmailHtml(emailProps);

      // Enviar el email
      const { data, error } = await resend.emails.send({
        from: 'Azhares Panel <onboarding@resend.dev>',
        to: [actualRecipient],
        subject: body.subject || `¡Bienvenido a Azhares Panel!${isDevelopment ? ' [TEST]' : ''}`,
        html: htmlContent
      });

      if (error) {
        console.error('Email API - Error al enviar email con Resend:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Error al enviar email' },
          { status: 400 }
        );
      }

      console.log('Email API - Email enviado con éxito. ID:', data?.id);
      return NextResponse.json({ 
        success: true, 
        data,
        message: 'Email enviado correctamente',
        notes: isDevelopment ? `En modo desarrollo, el email fue enviado a ${actualRecipient} en lugar de ${body.to}` : undefined
      });
    } catch (sendError) {
      console.error('Email API - Error durante el envío con Resend:', sendError);
      return NextResponse.json(
        { success: false, error: 'Error durante el envío del email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Email API - Error general:', error);
    return NextResponse.json(
      { success: false, error: 'Error al procesar la solicitud de email' },
      { status: 500 }
    );
  }
} 