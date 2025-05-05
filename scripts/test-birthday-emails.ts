const PocketBase = require('pocketbase');
const { BirthdayEmailService } = require('../app/services/birthday-email.service');

async function testBirthdayEmails() {
  const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  
  try {
    console.log('🔍 Buscando clientes para prueba...');
    
    // Obtener algunos clientes de prueba (limitamos a 2 para la prueba)
    const testClients = await pb.collection('clients').getList(1, 2, {
      filter: 'birthDate != null && planner.email != null',
      expand: 'planner'
    });

    if (testClients.items.length === 0) {
      console.log('❌ No se encontraron clientes con fecha de cumpleaños y planner asignado.');
      return;
    }

    console.log(`✨ Encontrados ${testClients.items.length} clientes para prueba.`);

    // Enviar email de prueba para cada cliente
    for (const client of testClients.items) {
      const planner = client.expand?.planner;
      if (!planner?.email) continue;

      console.log(`\n📧 Enviando email de prueba para cliente: ${client.name}`);
      console.log(`   Planner: ${planner.email}`);
      
      const result = await BirthdayEmailService.sendBirthdayReminder(
        planner.email,
        {
          name: client.name,
          birthDate: client.birthDate
        }
      );

      if (result.success) {
        console.log('✅ Email enviado correctamente');
      } else {
        console.log('❌ Error al enviar email:', result.error);
      }
    }

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  }
}

// Ejecutar el script
console.log('🎂 Iniciando prueba de emails de cumpleaños...\n');
testBirthdayEmails()
  .then(() => console.log('\n✨ Prueba completada'))
  .catch(console.error); 