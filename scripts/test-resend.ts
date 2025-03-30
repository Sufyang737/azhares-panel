// Script para probar directamente la API de Resend
// Para ejecutar: npx ts-node scripts/test-resend.ts

import { Resend } from 'resend';

async function main() {
  try {
    console.log('Iniciando prueba de Resend...');
    
    // Reemplazar con tu API key o usar una variable de entorno
    const resendApiKey = process.env.RESEND_API_KEY || 're_Gjm5Q6tu_42h8gQejgFW8NLtiM2ZW232k';
    
    const resend = new Resend(resendApiKey);
    
    console.log('Enviando email de prueba...');
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'administracion@azaresweb.com.ar',  // Reemplazar con tu email de prueba
      subject: 'Test desde script - Azhares Panel',
      html: '<p>Este es un email de prueba enviado directamente desde un script usando <strong>Resend</strong>.</p>'
    });
    
    if (error) {
      console.error('Error al enviar email:', error);
    } else {
      console.log('Email enviado con éxito:', data);
    }
  } catch (error) {
    console.error('Error general:', error);
  }
}

main().then(() => console.log('Proceso completado')); 