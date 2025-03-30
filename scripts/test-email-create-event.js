// Este es un script para probar la funcionalidad de creación de eventos y envío de emails
// Para ejecutarlo, copia y pega en la consola del navegador después de iniciar sesión en la aplicación

(async function() {
  // Obtener el token de autenticación de las cookies
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('pb_auth='))
    ?.split('=')[1];
  
  if (!token) {
    console.error('No se encontró el token de autenticación. Debes iniciar sesión primero.');
    return;
  }
  
  console.log('Token de autenticación encontrado. Procediendo a crear un evento de prueba...');
  
  try {
    // Datos para la creación del evento
    const eventoData = {
      nombre: "Evento de Prueba desde Script",
      tipo: "boda",
      fecha: new Date().toISOString(),
      estado: "pendiente",
      cliente_nuevo: true,
      cliente_nombre: "Cliente de Prueba",
      cliente_email: "administracion@azaresweb.com.ar"
    };
    
    console.log('Datos del evento:', eventoData);
    
    // Enviar la solicitud para crear el evento
    const response = await fetch('/api/eventos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `pb_auth=${token}`
      },
      body: JSON.stringify(eventoData),
      credentials: 'include'
    });
    
    // Verificar la respuesta
    if (response.ok) {
      const result = await response.json();
      console.log('Evento creado exitosamente:', result);
      
      // Comprobar si el cliente recibió el email (esto es solo para fines de prueba)
      console.log('El email debería haber sido enviado a:', eventoData.cliente_email);
    } else {
      const error = await response.json();
      console.error('Error al crear el evento:', error);
    }
  } catch (error) {
    console.error('Error en la ejecución del script:', error);
  }
})(); 