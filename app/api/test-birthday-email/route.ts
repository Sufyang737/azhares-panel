import { NextResponse } from 'next/server';
import { BirthdayEmailService } from '@/app/services/birthday-email.service';

export async function GET(request: Request) {
  try {
    // Obtener el email de prueba de los query params
    const { searchParams } = new URL(request.url);
    const testEmail = searchParams.get('email');

    if (!testEmail) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Datos de prueba
    const testPerson = {
      nombre: "Cliente",
      apellido: "de Prueba",
      email: testEmail,
      cumpleanio: new Date().toISOString(),
      telefono: "1234567890"
    };

    // Enviar email de prueba
    const result = await BirthdayEmailService.sendBirthdayNotification(testPerson);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      sentTo: testEmail,
      result
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 