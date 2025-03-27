import PocketBase from 'pocketbase';

// Inicializa PocketBase con la URL del servidor desde la variable de entorno
const pocketbaseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase-ykw4ks40gswowocosk80k440.srv.clostech.tech';
export const pb = new PocketBase(pocketbaseUrl);

// Configurar el token de administrador si existe
const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
if (adminToken) {
  // Establecer el token de administrador directamente
  pb.authStore.save(adminToken, null);
}

// Definición de tipos para usuarios
export type Usuario = {
  id: string;
  email: string;
  emailVisibility: boolean;
  verified: boolean;
  username: string;
  rol: string;
  created: string;
  updated: string;
};

// Función para autenticar un usuario
export async function loginUser(usernameOrEmail: string, password: string) {
  try {
    const authData = await pb.collection('usuarios').authWithPassword(usernameOrEmail, password);
    return { success: true, data: authData };
  } catch (error) {
    console.error('Error al autenticar usuario:', error);
    return { success: false, error };
  }
}

// Función para obtener el usuario actual
export function getCurrentUser() {
  if (pb.authStore.isValid) {
    return pb.authStore.model;
  }
  return null;
}

// Función para cerrar sesión
export function logoutUser() {
  pb.authStore.clear();
}

// Función para verificar si el usuario está autenticado
export function isAuthenticated() {
  return pb.authStore.isValid;
}

// Función para obtener todos los usuarios
export async function getUsuarios() {
  try {
    const records = await pb.collection('usuarios').getList(1, 50, {
      sort: '-created',
    });
    return { success: true, data: records };
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return { success: false, error };
  }
}

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

// Definición de tipos para personas
export type PersonaData = {
  nombre: string;
  apellido?: string;
  telefono?: number;
  email: string;
  cumpleanio?: string;
  pais?: string;
  ciudad?: string;
  instagram?: string;
  direccion?: string;
  comentario?: string;
};

// Definición de tipos para clientes
export type ClienteData = {
  nombre: string;
  contacto: string;
  pais?: string;
  ciudad?: string;
  instagram?: string;
  persona_id?: string[];
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

// Función para crear una persona
export async function createPersona(data: PersonaData) {
  try {
    const record = await pb.collection('personas').create(data);
    return { success: true, data: record };
  } catch (error) {
    console.error('Error al crear persona:', error);
    return { success: false, error };
  }
}

// Función para obtener todas las personas
export async function getPersonas() {
  try {
    const records = await pb.collection('personas').getList(1, 50, {
      sort: '-created',
    });
    return { success: true, data: records };
  } catch (error) {
    console.error('Error al obtener personas:', error);
    return { success: false, error };
  }
}

// Función para crear un cliente
export async function createCliente(data: ClienteData) {
  try {
    const record = await pb.collection('cliente').create(data);
    return { success: true, data: record };
  } catch (error) {
    console.error('Error al crear cliente:', error);
    return { success: false, error };
  }
}

// Función para obtener todos los clientes
export async function getClientes() {
  try {
    const records = await pb.collection('cliente').getList(1, 50, {
      sort: '-created',
    });
    return { success: true, data: records };
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return { success: false, error };
  }
} 