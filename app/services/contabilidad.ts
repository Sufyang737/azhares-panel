import { pb } from '@/app/lib/pocketbase';

export type ContabilidadRecord = {
  id: string;
  type: 'cobro' | 'pago';
  especie: 'efectivo' | 'trasferencia';
  moneda: 'ars' | 'usd';
  categoria: 'evento' | 'oficina';
  subcargo: 'clientes' | 'otros' | 'proveedores' | 'sueldos';
  detalle: 'comision' | 'handy' | 'honorarios' | 'maquillaje' | 'planner' | 'staff' | 'viandas';
  montoEspera: number;
  dolarEsperado: number;
  fechaEspera: string;
  fechaEfectuado?: string;
  cliente_id?: string;
  proveedor_id?: string;
  evento_id?: string;
  equipo_id?: string;
  comentario?: string;
  created: string;
  updated: string;
};

export async function createContabilidadRecord(data: Omit<ContabilidadRecord, 'id' | 'created' | 'updated'>) {
  console.log('=== INICIO createContabilidadRecord ===');
  console.log('Datos recibidos:', data);
  
  try {
    // Validar datos antes de enviar
    console.log('Validando campos requeridos...');
    if (!data.type || !data.especie || !data.moneda || !data.categoria || !data.subcargo || !data.detalle) {
      console.error('Faltan campos requeridos:', {
        type: !data.type,
        especie: !data.especie,
        moneda: !data.moneda,
        categoria: !data.categoria,
        subcargo: !data.subcargo,
        detalle: !data.detalle
      });
      throw new Error('Faltan campos requeridos');
    }

    if (!data.montoEspera || data.montoEspera <= 0) {
      console.error('Monto inválido:', data.montoEspera);
      throw new Error('El monto debe ser mayor a 0');
    }

    // Obtener el token de autenticación de PocketBase
    const token = pb.authStore.token;
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    // Preparar los datos
    const recordData = {
      comentario: data.comentario || "",
      type: data.type,
      especie: data.especie,
      moneda: data.moneda,
      categoria: data.categoria,
      subcargo: data.subcargo,
      detalle: data.detalle,
      montoEspera: Number(data.montoEspera),
      fechaEspera: data.fechaEspera || new Date().toISOString(),
      dolarEsperado: data.dolarEsperado || 0,
      cliente_id: data.cliente_id || "",
      proveedor_id: data.proveedor_id || "",
      evento_id: data.evento_id || "",
      equipo_id: data.equipo_id || "",
      fechaEfectuado: data.fechaEfectuado || null,
    };

    console.log('Datos preparados:', recordData);
    
    // Enviar la solicitud a través de nuestro endpoint API
    const response = await fetch('/api/contabilidad', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify(recordData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al crear el registro');
    }

    const record = await response.json();
    console.log('Registro creado exitosamente:', record);
    return record;
  } catch (error) {
    console.error('=== ERROR EN createContabilidadRecord ===');
    console.error('Error completo:', error);
    
    if (error instanceof Error) {
      console.error('Mensaje de error:', error.message);
      throw error;
    }
    
    throw new Error('Error inesperado al crear el registro');
  }
}

interface ApiErrorResponse {
  error?: string;
  data?: Record<string, unknown>;
}

interface ApiError extends Error {
  response?: {
    data?: ApiErrorResponse;
  };
}

export async function getContabilidadRecords(options: { sort?: string; expand?: string } = {}) {
  console.log('=== INICIO getContabilidadRecords ===');
  
  try {
    const token = pb.authStore.token;
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    const response = await fetch('/api/contabilidad?' + new URLSearchParams({
      sort: options.sort || '-created',
      expand: options.expand || 'evento_id',
      fields: '*,evento_id.id,evento_id.nombre,cliente_id.nombre,proveedor_id.nombre,equipo_id.nombre'
    }), {
      headers: {
        'Authorization': token
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al obtener los registros');
    }

    const data = await response.json();
    console.log('Registros obtenidos:', data);
    return data;
  } catch (error) {
    console.error('=== ERROR EN getContabilidadRecords ===');
    console.error('Error completo:', error);
    
    if (error instanceof Error) {
      console.error('Mensaje de error:', error.message);
      throw error;
    }
    
    throw new Error('Error inesperado al obtener los registros');
  }
}

export async function getFullContabilidadList(options: {
  sort?: string;
  filter?: string;
  expand?: string;
} = {}) {
  console.log('=== INICIO getFullContabilidadList ===');
  console.log('Opciones:', options);

  try {
    // Obtener el token de autenticación
    const token = pb.authStore.token;
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    // Preparar la solicitud a la API con skipTotal=true para optimización
    const response = await fetch('/api/contabilidad?' + new URLSearchParams({
      skipTotal: 'true',
      ...(options.sort ? { sort: options.sort } : { sort: '-created' }), // Por defecto ordenar por fecha de creación descendente
      ...(options.filter ? { filter: options.filter } : {}),
      ...(options.expand ? { expand: options.expand } : {})
    }), {
      headers: {
        'Authorization': token
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al obtener los registros');
    }

    const data = await response.json();
    console.log('Registros obtenidos:', data);
    return data.items;
  } catch (error) {
    console.error('=== ERROR EN getFullContabilidadList ===');
    console.error('Error completo:', error);
    
    if (error instanceof Error) {
      console.error('Mensaje de error:', error.message);
      throw error;
    }
    
    throw new Error('Error inesperado al obtener los registros');
  }
}

export async function updateContabilidadRecord(id: string, data: Partial<ContabilidadRecord>) {
  console.log('Actualizando registro:', id, data);
  
  try {
    const token = pb.authStore.token;
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    const record = await pb.collection('contabilidad').update(id, {
      ...data,
      fechaEfectuado: data.fechaEfectuado || new Date().toISOString()
    });

    console.log('Registro actualizado:', record);
    return record;
  } catch (error) {
    console.error('Error al actualizar el registro:', error);
    if (error instanceof Error) {
      throw new Error(`Error al actualizar el registro: ${error.message}`);
    }
    throw new Error('Error inesperado al actualizar el registro');
  }
}

export async function deleteContabilidadRecord(id: string) {
  console.log('Eliminando registro:', id);
  
  try {
    // Obtener el token de autenticación de PocketBase
    const token = pb.authStore.token;
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    const response = await fetch(`/api/contabilidad?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al eliminar el registro');
    }

    console.log('Registro eliminado exitosamente');
    return true;
  } catch (error) {
    console.error('Error en deleteContabilidadRecord:', error);
    throw new Error('Error al eliminar el registro contable');
  }
}

export async function getContabilidadRecord(id: string, expand?: string) {
  console.log('Obteniendo registro específico:', id);
  
  try {
    // Obtener el token de autenticación de PocketBase
    const token = pb.authStore.token;
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    const queryParams = new URLSearchParams();
    if (expand) queryParams.append('expand', expand);
    queryParams.append('id', id);

    const url = `/api/contabilidad?${queryParams.toString()}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': token
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al obtener el registro');
    }

    const record: ContabilidadRecord = await response.json();
    console.log('Registro encontrado:', record);
    return record;
  } catch (error) {
    console.error('Error en getContabilidadRecord:', error);
    throw new Error('Error al obtener el registro contable');
  }
}

export async function createTestRecord() {
  const testData = {
    type: "cobro" as const,
    especie: "efectivo" as const,
    moneda: "ars" as const,
    categoria: "oficina" as const,
    subcargo: "sueldos" as const,
    detalle: "honorarios" as const,
    montoEspera: 1000,
    dolarEsperado: 1,
    fechaEspera: new Date().toISOString(),
    comentario: "Registro de prueba"
  };

  return createContabilidadRecord(testData);
}

async function getToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/me');
    if (!response.ok) {
      console.error('Error al obtener el token:', response.statusText);
      return null;
    }
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Error al obtener el token:', error);
    return null;
  }
} 