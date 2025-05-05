import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import { BirthdayEmailService } from '@/app/services/birthday-email.service';

const ARGENTINA_TZ = 'America/Argentina/Buenos_Aires';

// Handler para GET (ejecutado por el cron job)
export async function GET(request: Request) {
  try {
    // Verificar el token de autorización
    const authHeader = request.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que sea la hora correcta (8 AM Argentina ± 5 minutos)
    const now = new Date();
    const argentinaTime = new Date(now.toLocaleString('en-US', { timeZone: ARGENTINA_TZ }));
    const hour = argentinaTime.getHours();
    const minute = argentinaTime.getMinutes();

    console.log('Hora actual en Argentina:', argentinaTime.toISOString());
    console.log('Hora:', hour, 'Minutos:', minute);
    
    if (hour !== 8 || minute > 5) {
      return NextResponse.json({
        success: false,
        error: 'Este endpoint solo debe ejecutarse a las 8:00 AM (Argentina)',
        debug: {
          currentTime: argentinaTime.toISOString(),
          hour,
          minute
        }
      });
    }

    // Inicializar PocketBase con autenticación de admin
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
    
    if (!adminToken) {
      throw new Error('POCKETBASE_ADMIN_TOKEN no está configurado');
    }

    // Autenticar como admin
    pb.authStore.save(adminToken, null);
    
    // Obtener la fecha actual en Argentina
    const month = (argentinaTime.getMonth() + 1).toString().padStart(2, '0');
    const day = argentinaTime.getDate().toString().padStart(2, '0');
    
    console.log('Buscando cumpleaños para:', month, day);

    // Construir el filtro para buscar cumpleaños del día actual
    const datePattern = `-${month}-${day}`;
    
    // Obtener solo los registros que coinciden con el patrón de fecha
    const birthdayPeople = await pb.collection('personas').getList(1, 50, {
      sort: 'cumpleanio',
      filter: `cumpleanio != "" && cumpleanio ~ "${datePattern}"`,
      fields: 'id,nombre,apellido,cumpleanio,email,telefono'
    });

    console.log(`Encontrados ${birthdayPeople.items.length} cumpleaños para hoy`);

    // Enviar notificaciones por email
    const emailResults = [];
    for (const person of birthdayPeople.items) {
      console.log(`\nEnviando notificación para: ${person.nombre} ${person.apellido}`);
      const result = await BirthdayEmailService.sendBirthdayNotification({
        nombre: person.nombre,
        apellido: person.apellido,
        email: person.email,
        cumpleanio: person.cumpleanio,
        telefono: person.telefono
      });
      
      emailResults.push({
        person: `${person.nombre} ${person.apellido}`,
        success: result.success,
        error: result.error,
        emailId: result.emailId
      });
    }

    return NextResponse.json({ 
      success: true,
      data: birthdayPeople.items,
      emailResults,
      debug: {
        executionTime: argentinaTime.toISOString(),
        month,
        day,
        datePattern,
        totalFound: birthdayPeople.totalItems,
        emailsSent: emailResults.filter(r => r.success).length,
        emailErrors: emailResults.filter(r => !r.success).length
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error al procesar cumpleaños',
      errorDetails: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Configurar la ruta como dinámica para que Next.js no la cachee
export const dynamic = 'force-dynamic';
// Prevenir llamadas muy frecuentes
export const revalidate = 3600; // 1 hora 