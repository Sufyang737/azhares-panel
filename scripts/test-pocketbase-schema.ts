// Script para verificar el esquema de PocketBase
import PocketBase from 'pocketbase';

async function main() {
  try {
    console.log('Iniciando verificación de esquema de PocketBase...');
    
    // Usar la misma URL de PocketBase que en la aplicación
    const pocketbaseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 
      '';
    
    console.log(`Conectando a PocketBase en: ${pocketbaseUrl}`);
    const pb = new PocketBase(pocketbaseUrl);
    
    // Autenticar con el token de admin
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
    if (!adminToken) {
      console.error('Error: POCKETBASE_ADMIN_TOKEN no está configurado');
      return;
    }
    
    pb.authStore.save(adminToken, null);
    console.log('Autenticado como administrador');
    
    // Obtener información sobre la colección 'evento'
    console.log('\nConsultando estructura de la colección "evento"...');
    const collections = await pb.collections.getList(1, 50, {
      filter: 'name = "evento"'
    });
    
    if (collections.items.length === 0) {
      console.error('Error: No se encontró la colección "evento"');
      return;
    }
    
    const eventCollection = collections.items[0];
    
    // Extraer los campos
    const fields = eventCollection.fields;
    console.log('\nCampos de la colección "evento":');
    fields.forEach((field, index) => {
      console.log(`${index + 1}. Campo: ${field.name}`);
      console.log(`   - Tipo: ${field.type}`);
      console.log(`   - Requerido: ${field.required}`);
      if (field.type === 'select' && field.values) {
        console.log(`   - Valores posibles: ${JSON.stringify(field.values)}`);
      }
    });
    
    // Probar valores para tipos enumerados
    console.log('\nAnalizando campos específicos:');
    
    // Campo tipo
    const tipoField = fields.find(f => f.name === 'tipo');
    if (tipoField) {
      console.log('Campo "tipo":');
      console.log('- Tipo:', tipoField.type);
      console.log('- Requerido:', tipoField.required);
      if (tipoField.type === 'select' && tipoField.values) {
        console.log('- Valores permitidos:', tipoField.values);
      }
    } else {
      console.log('No se encontró el campo "tipo"');
    }
    
    // Campo estado
    const estadoField = fields.find(f => f.name === 'estado');
    if (estadoField) {
      console.log('\nCampo "estado":');
      console.log('- Tipo:', estadoField.type);
      console.log('- Requerido:', estadoField.required);
      if (estadoField.type === 'select' && estadoField.values) {
        console.log('- Valores permitidos:', estadoField.values);
      }
    } else {
      console.log('No se encontró el campo "estado"');
    }
    
    // Probar una creación de evento de prueba
    console.log('\nIntentando crear un evento de prueba...');
    try {
      // Usamos valores que sabemos que son aceptados según los campos
      const testData = {
        nombre: 'Evento de Prueba Script',
        tipo: tipoField?.values?.[0] || 'cumpleanos', // Usar el primer valor permitido
        fecha: new Date().toISOString(),
        estado: estadoField?.values?.[0] || 'en-curso', // Usar el primer valor permitido
        cliente_id: '', // Campo relacional, debe ser un ID válido
        planner_id: ''  // Campo relacional, debe ser un ID válido
      };
      
      console.log('Datos de prueba:', testData);
      const result = await pb.collection('evento').create(testData);
      console.log('Evento creado con éxito. ID:', result.id);
      
      // Eliminar el evento de prueba
      await pb.collection('evento').delete(result.id);
      console.log('Evento de prueba eliminado');
    } catch (error) {
      console.error('Error al crear evento de prueba:', error);
      if (error.response?.data) {
        console.error('Detalles del error:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
  } catch (error) {
    console.error('Error en la ejecución del script:', error);
  }
}

main()
  .then(() => console.log('Verificación completada'))
  .catch(error => console.error('Error:', error)); 