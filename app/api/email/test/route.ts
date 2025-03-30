import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'administracion@azaresweb.com.ar',
      subject: 'Hello World',
      html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
    });

    if (error) {
      console.error('Error al enviar email de prueba:', error);
      return NextResponse.json({ error }, { status: 400 });
    }

    console.log('Email de prueba enviado correctamente:', data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error en el endpoint de prueba:', error);
    return NextResponse.json({ error }, { status: 500 });
  }
} 