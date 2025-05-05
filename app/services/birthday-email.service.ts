import { Resend } from 'resend';

// Inicializar Resend con la API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Email verificado para desarrollo
const VERIFIED_EMAIL = 'administracion@azaresweb.com.ar';

// Determinar si estamos en desarrollo
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

interface BirthdayPerson {
  nombre: string;
  apellido: string;
  email?: string;
  cumpleanio: string;
  telefono?: string;
}

interface EmailResult {
  success: boolean;
  error?: string;
  emailId?: string;
}

export const BirthdayEmailService = {
  async sendBirthdayNotification(person: BirthdayPerson): Promise<EmailResult> {
    try {
      if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY no está configurada');
      }

      // En desarrollo, redirigir todos los emails al email verificado
      const recipientEmail = isDevelopment ? VERIFIED_EMAIL : 'administracion@azaresweb.com.ar';
      
      // Formatear la fecha de cumpleaños
      const birthDate = new Date(person.cumpleanio);
      const formattedDate = birthDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Construir el HTML del email
      const htmlContent = `
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
                  Te recordamos que hoy es el cumpleaños de <strong style="color: #e91e63;">${person.nombre} ${person.apellido}</strong>.
                </p>
                ${person.telefono ? `
                <p style="font-size: 16px;">
                  Teléfono de contacto: <strong>${person.telefono}</strong>
                </p>
                ` : ''}
                ${person.email ? `
                <p style="font-size: 16px;">
                  Email: <strong>${person.email}</strong>
                </p>
                ` : ''}
                <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin-top: 20px;">
                  <p style="margin: 0; color: #666;">
                    Fecha: <strong>${formattedDate}</strong>
                  </p>
                </div>
              </div>
              <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
                <p>Este es un mensaje automático del sistema de Azares Panel</p>
                ${isDevelopment ? '<p><strong>ESTO ES UN EMAIL DE PRUEBA</strong></p>' : ''}
              </div>
            </div>
          </body>
        </html>
      `;

      // Enviar el email
      const { data, error } = await resend.emails.send({
        from: 'Azares Panel <onboarding@resend.dev>',
        to: [recipientEmail],
        subject: `🎂 Recordatorio de Cumpleaños: ${person.nombre} ${person.apellido}${isDevelopment ? ' [TEST]' : ''}`,
        html: htmlContent
      });

      if (error) {
        console.error('Error al enviar email de cumpleaños:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('Email de cumpleaños enviado con éxito. ID:', data?.id);
      return {
        success: true,
        emailId: data?.id
      };

    } catch (error) {
      console.error('Error en servicio de email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}; 