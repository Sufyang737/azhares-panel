import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import WelcomeEmail from '@/components/emails/welcome-template';

// Inicializar Resend con la API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Email verificado para redireccionar durante desarrollo/pruebas
const VERIFIED_EMAIL = 'administracion@azaresweb.com.ar';
const FROM_EMAIL = 'administracion@azaresweb.com.ar'; // Email verificado para envíos

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
    console.log('Email API - URL base:', appUrl);
    console.log('Email API - Cliente ID:', body.clienteId);
    
    const formUrl = body.formUrl || (body.clienteId ? `${appUrl}/formulario/${encodeURIComponent(body.clienteId)}` : '');
    console.log('Email API - URL del formulario construida:', formUrl);

    // Crear el email usando Resend y el componente React
    console.log('Email API - Preparando email para:', body.to);
    
    try {
      // En producción, enviar al destinatario real
      const actualRecipient = isDevelopment ? VERIFIED_EMAIL : body.to;
      
      if (isDevelopment && actualRecipient !== body.to) {
        console.log(`Email API - MODO DESARROLLO: Redirigiendo email de ${body.to} a ${actualRecipient}`);
      }
      
      // Verificar contenido de datos de entrada para debug
      console.log('Email API - Preparando email con datos:', JSON.stringify({
        to: actualRecipient,
        from: FROM_EMAIL,
        originalTo: body.to,
        clientName: body.clientName || 'Cliente',
        eventName: body.eventName || 'Evento',
        eventDate: formattedDate || 'Fecha por confirmar',
        plannerName: body.plannerName || 'Sin asignar',
        clienteId: body.clienteId || '',
        formUrl: formUrl || '',
        isDevelopment: isDevelopment
      }, null, 2));

      const { data, error } = await resend.emails.send({
        from: `Azares Eventos <${FROM_EMAIL}>`,
        replyTo: FROM_EMAIL,
        to: [actualRecipient],
        subject: body.subject || `¡Bienvenido a Azares Eventos!${isDevelopment ? ' [TEST]' : ''}`,
        react: WelcomeEmail({
          clientName: body.clientName || 'Cliente',
          eventName: body.eventName || 'Evento',
          eventDate: formattedDate || 'Fecha por confirmar',
          plannerName: body.plannerName || 'Sin asignar',
          clienteId: body.clienteId || '',
          formUrl: formUrl || '',
        }) as any, // Temporal fix para el error de tipos
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