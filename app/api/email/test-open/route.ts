import { Resend } from 'resend';
import { NextResponse } from 'next/server';

// Inicializar Resend con la API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Este endpoint no requiere autenticación - solo para pruebas
export async function GET() {
  try {
    console.log('Email Test API - Iniciando prueba de Resend...');
    
    if (!process.env.RESEND_API_KEY) {
      console.error('Email Test API - Error: RESEND_API_KEY no está configurada');
      return NextResponse.json(
        { error: 'API key de Resend no configurada' },
        { status: 500 }
      );
    }
    
    console.log('Email Test API - Enviando email de prueba...');
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'administracion@azaresweb.com.ar',
      subject: 'Test desde API - Azhares Panel',
      html: '<p>Este es un email de prueba enviado desde el endpoint de API usando <strong>Resend</strong>.</p>'
    });
    
    if (error) {
      console.error('Email Test API - Error al enviar email:', error);
      return NextResponse.json({ error }, { status: 400 });
    }
    
    console.log('Email Test API - Email enviado con éxito:', data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Email Test API - Error general:', error);
    return NextResponse.json({ error }, { status: 500 });
  }
} 