import PocketBase from 'pocketbase';

// Inicializa PocketBase con la URL del servidor
export const pb = new PocketBase('https://pocketbase-ykw4ks40gswowocosk80k440.srv.clostech.tech');

// Definición de tipos para eventos
export type EventoData = {
  comentario?: string;
  nombre?: string;
  tipo?: string;
  fecha?: string;
  estado?: string;
  cliente_id?: string;
  planner_id?: string;
  // Campos para cliente nuevo
  cliente_nuevo?: boolean;
  cliente_nombre?: string;
  cliente_email?: string;
};

// Función para manejar la creación de un nuevo evento
export async function createEvento(data: EventoData) {
  try {
    const record = await pb.collection('evento').create(data);
    return { success: true, data: record };
  } catch (error) {
    console.error('Error al crear evento:', error);
    return { success: false, error };
  }
}

// Función para obtener todos los eventos
export async function getEventos() {
  try {
    const records = await pb.collection('evento').getList(1, 50, {
      sort: '-created',
    });
    return { success: true, data: records };
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    return { success: false, error };
  }
}

// Función para obtener un evento específico
export async function getEvento(id: string) {
  try {
    const record = await pb.collection('evento').getOne(id);
    return { success: true, data: record };
  } catch (error) {
    console.error(`Error al obtener evento con ID ${id}:`, error);
    return { success: false, error };
  }
}

// Función para actualizar un evento
export async function updateEvento(id: string, data: EventoData) {
  try {
    const record = await pb.collection('evento').update(id, data);
    return { success: true, data: record };
  } catch (error) {
    console.error(`Error al actualizar evento con ID ${id}:`, error);
    return { success: false, error };
  }
}

// Función para eliminar un evento
export async function deleteEvento(id: string) {
  try {
    await pb.collection('evento').delete(id);
    return { success: true };
  } catch (error) {
    console.error(`Error al eliminar evento con ID ${id}:`, error);
    return { success: false, error };
  }
} 