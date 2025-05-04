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
  email?: string;
}

export interface ApiError extends Error {
  status?: number;
  data?: Record<string, unknown>;
}

async function authenticateAdmin() {
  const adminToken = process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_TOKEN;

  if (!adminToken) {
    throw new Error('Admin token not configured');
  }

  await pb.admins.authWithToken(adminToken);
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

export async function getEquipo(): Promise<Equipo[]> {
  try {
    const response = await fetch('/api/relations?collection=equipo');
    if (!response.ok) {
      throw new Error('Failed to fetch team members');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching team members:', error);
    return [];
  }
} 