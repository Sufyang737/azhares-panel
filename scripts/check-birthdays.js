import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function checkBirthdays() {
  try {
    console.log('🔍 Buscando cumpleaños del día...');
    
    const response = await fetch(`${API_URL}/api/birthdays`);
    const responseText = await response.text();
    
    try {
      const { success, data, debug } = JSON.parse(responseText);
      
      if (debug) {
        console.log('\n🔧 Información de debug:');
        console.log('   Fecha:', debug.date);
        console.log('   Mes:', debug.month);
        console.log('   Día:', debug.day);
        console.log('   Filtro:', debug.filter);
      }

      if (!success) {
        throw new Error('La API retornó un error');
      }

      if (data.length === 0) {
        console.log('\nℹ️ No hay cumpleaños hoy.');
        return;
      }

      console.log(`\n✨ Encontradas ${data.length} personas que cumplen años hoy:`);
      data.forEach(person => {
        console.log(`\n👤 ${person.nombre} ${person.apellido}`);
        console.log(`   📅 Cumpleaños: ${person.cumpleanio}`);
        if (person.telefono) console.log(`   📱 Teléfono: ${person.telefono}`);
        if (person.email) console.log(`   📧 Email: ${person.email}`);
      });
    } catch (parseError) {
      console.error('❌ Error al procesar la respuesta:', responseText);
      throw parseError;
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar el script
console.log('🎂 Iniciando verificación de cumpleaños...\n');
checkBirthdays()
  .then(() => console.log('\n✨ Proceso completado'))
  .catch(console.error); 