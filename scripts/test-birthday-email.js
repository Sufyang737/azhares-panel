const { Resend } = require('resend');
require('dotenv').config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testBirthdayEmail() {
  try {
    console.log('📧 Enviando email de prueba...');
    
    const result = await resend.emails.send({
      from: 'Azares Panel <onboarding@resend.dev>',
      to: 'administracion@azaresweb.com.ar',
      subject: '🎂 Prueba: Recordatorio de Cumpleaños',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Recordatorio de Cumpleaños</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #e91e63; text-align: center;">🎂 ¡Recordatorio de Cumpleaños!</h1>
              <div style="background-color: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #333; margin-bottom: 15px;">Buenos días,</h2>
                <p style="font-size: 16px;">
                  Te recordamos que hoy es el cumpleaños de <strong style="color: #e91e63;">Cliente de Prueba</strong>.
                </p>
                <p style="font-size: 16px;">
                  No olvides felicitarle en este día tan especial.
                </p>
                <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin-top: 20px;">
                  <p style="margin: 0; color: #666;">
                    Fecha: <strong>6 de mayo</strong>
                  </p>
                </div>
              </div>
              <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
                <p>Este es un mensaje automático del sistema de Azares Panel</p>
                <p><strong>ESTO ES UN EMAIL DE PRUEBA</strong></p>
              </div>
            </div>
          </body>
        </html>
      `
    });

    console.log('✅ Email enviado correctamente:', result);
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
  }
}

// Ejecutar la prueba
console.log('🎂 Iniciando prueba de email de cumpleaños...\n');
testBirthdayEmail()
  .then(() => console.log('\n✨ Prueba completada'))
  .catch(console.error); 