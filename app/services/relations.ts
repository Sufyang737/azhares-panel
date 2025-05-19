import { pb } from '@/app/lib/pocketbase';

export interface Cliente {
  id: string;
  nombre: string;
  contacto: string;
  pais?: string;
  ciudad?: string;
}

export interface Proveedor {
  id: string;
  nombre: string;
  alias?: string;
  contacto: string;
  categoria: string;
}

export interface Evento {
  id: string;
  nombre: string;
  tipo: string;
  fecha: string;
  estado: string;
  cliente_id?: string;
}

export interface Equipo {
  id: string;
  nombre: string;
  apellido: string;
  cargo: string;
}

export interface ApiError extends Error {
  status?: number;
  data?: Record<string, unknown>;
}

export async function getClientes(): Promise<Cliente[]> {
  try {
    const response = await fetch('/api/relations?collection=cliente');
    if (!response.ok) {
      throw new Error('Failed to fetch clients');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
}

export async function getProveedores(): Promise<Proveedor[]> {
  try {
    const response = await fetch('/api/relations?collection=proveedores');
    if (!response.ok) {
      throw new Error('Failed to fetch providers');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching providers:', error);
    return [];
  }
}

export async function getEventos(): Promise<Evento[]> {
  try {
    const response = await fetch('/api/relations?collection=evento');
    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

async function authenticateAsAdmin() {
  try {
    console.log('🔐 Verificando autenticación admin...');
    const adminToken = process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_TOKEN;

    if (!adminToken) {
      throw new Error('Token de admin no configurado');
    }

    // Solo autenticar si no hay una sesión válida o si el token es diferente
    if (!pb.authStore.isValid || pb.authStore.token !== adminToken) {
      pb.authStore.save(adminToken);
      console.log('✅ Token de admin establecido');
    } else {
      console.log('✅ Ya autenticado con token de admin');
    }
  } catch (error) {
    console.error('❌ Error en autenticación:', error);
    throw error;
  }
}

export async function getEquipo() {
  try {
    console.log('🚀 Iniciando getEquipo...');
    await authenticateAsAdmin();

    const resultList = await pb.collection('equipo').getFullList({
      sort: '-created',
      fields: 'id,nombre,apellido,cargo'
    });
    
    console.log('📦 Datos recibidos:', {
      total: resultList?.length || 0,
      muestra: resultList?.[0] || 'sin datos'
    });

    return resultList.map(item => ({
      id: item.id,
      nombre: item.nombre,
      apellido: item.apellido,
      cargo: item.cargo
    }));
  } catch (error) {
    console.error('❌ Error en getEquipo:', error);
    throw error; // Propagar el error para mejor debugging
  }
}

export async function searchClientes(query: string): Promise<Cliente[]> {
  try {
    const response = await fetch(`/api/relations?collection=cliente&search=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Failed to search clients');
    }
    return await response.json();
  } catch (error) {
    console.error('Error searching clients:', error);
    return [];
  }
}

export async function searchProveedores(query: string): Promise<Proveedor[]> {
  try {
    const response = await fetch(`/api/relations?collection=proveedores&search=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Failed to search providers');
    }
    return await response.json();
  } catch (error) {
    console.error('Error searching providers:', error);
    return [];
  }
}

export async function searchEventos(query: string): Promise<Evento[]> {
  try {
    const response = await fetch(`/api/relations?collection=evento&search=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Failed to search events');
    }
    return await response.json();
  } catch (error) {
    console.error('Error searching events:', error);
    return [];
  }
}

export async function searchEquipo(query: string) {
  try {
    console.log('🔍 Iniciando búsqueda con query:', query);
    await authenticateAsAdmin();
    
    const filter = `nombre ~ "${query}" || apellido ~ "${query}" || cargo ~ "${query}"`;
    const resultList = await pb.collection('equipo').getList(1, 50, {
      filter: filter,
      fields: 'id,nombre,apellido,cargo'
    });

    const mappedResults = resultList.items.map(item => ({
      id: item.id,
      nombre: item.nombre,
      apellido: item.apellido,
      cargo: item.cargo
    }));
    
    console.log('✅ Resultados encontrados:', mappedResults.length);
    return mappedResults;
  } catch (error) {
    console.error('❌ Error en searchEquipo:', error);
    throw error; // Propagar el error para mejor debugging
  }
} 