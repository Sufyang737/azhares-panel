import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import { BirthdayEmailService } from '@/app/services/birthday-email.service';

// Handler para GET (obtener cumpleaños del día)
export async function GET() {
  try {
    // Inicializar PocketBase con autenticación de admin
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
    
    if (!adminToken) {
      console.error('Error: POCKETBASE_ADMIN_TOKEN no está configurado');
      return NextResponse.json({ 
        success: false, 
        error: 'Token de administrador no configurado'
      }, { status: 500 });
    }

    // Autenticar como admin
    pb.authStore.save(adminToken, null);
    
    // Obtener la fecha actual
    const today = new Date();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    
    console.log('Fecha actual:', today.toISOString());
    console.log('Buscando mes:', month, 'día:', day);

    // Construir el filtro para buscar cumpleaños del día actual
    // Usamos una expresión regular para matchear el mes y día en cualquier año
    const datePattern = `-${month}-${day}`;
    
    // Obtener solo los registros que coinciden con el patrón de fecha
    const birthdayPeople = await pb.collection('personas').getList(1, 50, {
      sort: 'cumpleanio',
      filter: `cumpleanio != "" && cumpleanio ~ "${datePattern}"`,
      fields: 'id,nombre,apellido,cumpleanio,email,telefono'
    });

    console.log(`\nEncontrados ${birthdayPeople.items.length} cumpleaños para hoy (${month}-${day})`);

    // Enviar notificaciones por email
    const emailResults = [];
    for (const person of birthdayPeople.items) {
      console.log(`\nEnviando notificación para: ${person.nombre} ${person.apellido}`);
      const result = await BirthdayEmailService.sendBirthdayNotification(person);
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
        date: today.toISOString(),
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
      error: 'Error al obtener cumpleaños',
      errorDetails: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 