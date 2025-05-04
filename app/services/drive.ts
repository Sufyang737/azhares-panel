export async function createEventFolder(eventType: string, eventDate: string, clientName: string) {
  try {
    const baseUrl = 'https://script.google.com/macros/s/AKfycbzQO3tOjtKwzgq6lfzjB3BnQAoo_h30qeKUnyUoVocd318HKLPn-8r3nQdEnBrJ1TGB/exec';
    
    // Ensure the date is in the correct format for the Apps Script
    const dateObj = new Date(eventDate);
    const formattedDate = dateObj.toISOString();

    // Construct URL with parameters matching the Apps Script's e.parameter structure
    const url = `${baseUrl}?eventType=${encodeURIComponent(eventType)}&clientName=${encodeURIComponent(clientName)}&eventDate=${encodeURIComponent(formattedDate)}`;

    console.log('Calling Drive API with URL:', url);
    
    const response = await fetch(url, {
      redirect: 'follow', // Seguir redirecciones automáticamente
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Error response:', text);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Drive API response:', data);

    if (!data.createdFolderUrl) {
      throw new Error('No se recibió la URL de la carpeta creada');
    }

    return data.createdFolderUrl;
  } catch (error) {
    console.error('Error al crear carpeta en Drive:', error);
    throw error;
  }
} 