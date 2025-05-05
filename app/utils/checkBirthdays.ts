import { prisma } from '../lib/prisma';
import { BirthdayEmailService } from '../services/birthday-email.service';

export async function checkBirthdays() {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  try {
    // Buscar clientes que cumplen años hoy
    const birthdayClients = await prisma.client.findMany({
      where: {
        AND: [
          { birthDate: { not: null } },
          {
            birthDate: {
              endsWith: `-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
            }
          }
        ]
      },
      include: {
        planner: true
      }
    });

    const results = [];

    // Enviar recordatorios para cada cliente
    for (const client of birthdayClients) {
      if (client.planner?.email) {
        const result = await BirthdayEmailService.sendBirthdayReminder(
          client.planner.email,
          {
            name: client.name,
            birthDate: client.birthDate!
          }
        );

        results.push({
          clientName: client.name,
          plannerEmail: client.planner.email,
          success: result.success
        });
      }
    }

    return {
      success: true,
      totalProcessed: birthdayClients.length,
      results
    };

  } catch (error) {
    console.error('Error checking birthdays:', error);
    return {
      success: false,
      error: 'Failed to process birthday notifications'
    };
  }
} 