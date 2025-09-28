import { pb } from '@/app/lib/pocketbase';

export interface ExpandedRecord {
  id: string;
  nombre: string;
}

const DETALLE_ALIASES: Record<string, string> = {
  'ingresos_brutos': 'ingresos-brutos',
  'ingresos brutos': 'ingresos-brutos',
  'formulario_931': 'formulado-931',
  'formulado_931': 'formulado-931',
  'formulario 931': 'formulado-931',
  'ofceca': 'OFCECA',
  'noe': 'Noe',
  'loli': 'Loli',
};

function normalizeDetalle(detalle?: string | null): string | null {
  if (!detalle) return null;
  const trimmed = detalle.trim();
  if (!trimmed) return null;

  const normalizedKey = trimmed.toLowerCase();
  if (DETALLE_ALIASES[normalizedKey]) {
    return DETALLE_ALIASES[normalizedKey];
  }

  return trimmed;
}

export type ContabilidadRecord = {
  id: string;
  created: string;
  updated: string;
  type: 'cobro' | 'pago';
  // Acepta ambas variantes por compatibilidad, usar 'transferencia' como estándar
  especie: 'efectivo' | 'transferencia' | 'trasferencia';
  moneda: 'ars' | 'usd';
  categoria: 'evento' | 'oficina';
  subcargo: 'clientes' | 'otros' | 'proveedores' | 'sueldos' | 'mensajeria' | 
    'cambio-divisas' | 'ajuste-caja' | 'obra-social-empleada' | 
    'mantencion-cuenta-corriente' | 'seguro-galicia' | 'tarjeta-credito' | 
    'deriva' | 'expensas' | 'alquiler' | 'prepaga' | 'contador' | 
    'mantenimiento-pc' | 'impuestos' | 'servicios' | 'regaleria' | 'compras' | 'caja-chica';
  detalle?: 'compra-usd' | 'comision' | 'handy' | 'honorarios' | 'maquillaje' |
    'planner' | 'staff' | 'viandas' | 'venta-usd' | 'maquilllaje' | 'viatico' | 'seguro' |
    'Noe' | 'Loli' | 'otros' | 'iva' | 'ingresos-brutos' | 'formulado-931' |
    'OFCECA' | 'abl' | 'internet' | 'agua' | 'luz' | 'autonomo' | 'telefono' |
    'prosegur' | 'mayorista' | 'coto' | 'libreria' | 'cerrajeria' | 'cafe' | null;
  montoEspera: number;
  dolarEsperado: number;
  fechaEspera: string;
  fechaEfectuado?: string;
  comentario: string;
  cliente_id?: string | ExpandedRecord;
  proveedor_id?: string | ExpandedRecord;
  evento_id?: string | ExpandedRecord;
  equipo_id?: string | ExpandedRecord;
  esEsperado: boolean;
  expand?: {
    cliente_id?: ExpandedRecord;
    proveedor_id?: ExpandedRecord;
    evento_id?: ExpandedRecord;
    equipo_id?: ExpandedRecord;
  };
};

export async function createContabilidadRecord(data: Omit<ContabilidadRecord, 'id' | 'created' | 'updated'>) {
  console.log('=== INICIO createContabilidadRecord ===');
  console.log('Datos recibidos:', data);
  
  try {
    // Validar datos antes de enviar
    console.log('Validando campos requeridos...');
    if (!data.type || !data.especie || !data.moneda || !data.categoria || !data.subcargo) {
      console.error('Faltan campos requeridos:', {
        type: !data.type,
        especie: !data.especie,
        moneda: !data.moneda,
        categoria: !data.categoria,
        subcargo: !data.subcargo,
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
    const detalle = normalizeDetalle(data.detalle ?? null);
    const recordData = {
      comentario: data.comentario || "",
      type: data.type,
      especie: data.especie === 'transferencia' ? 'trasferencia' : data.especie,
      moneda: data.moneda,
      categoria: data.categoria,
      subcargo: data.subcargo,
      detalle,
      montoEspera: Number(data.montoEspera),
      fechaEspera: data.fechaEspera || new Date().toISOString(),
      dolarEsperado: Number(data.dolarEsperado ?? 0),
      cliente_id: data.cliente_id || null,
      proveedor_id: data.proveedor_id || null,
      evento_id: data.evento_id || null,
      equipo_id: data.equipo_id || null,
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

export async function getContabilidadRecords(options: { 
  sort?: string; 
  expand?: string;
  page?: number;
  perPage?: number;
  filter?: string;
} = {}) {
  console.log('=== INICIO getContabilidadRecords ===');
  
  try {
    const token = pb.authStore.token;
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    const page = options.page || 1;
    const perPage = options.perPage || 20;

    const response = await fetch('/api/contabilidad?' + new URLSearchParams({
      sort: options.sort || '-created',
      expand: options.expand || 'cliente_id,evento_id',
      fields: '*,evento_id.id,evento_id.nombre,cliente_id.id,cliente_id.nombre,proveedor_id.id,proveedor_id.nombre',
      page: page.toString(),
      perPage: perPage.toString(),
      ...(options.filter ? { filter: options.filter } : {})
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

export async function updateContabilidadRecord(
  id: string,
  data: Partial<ContabilidadRecord>
): Promise<ContabilidadRecord> {
  console.log('=== INICIO updateContabilidadRecord ===');
  console.log('ID:', id);
  console.log('Datos a actualizar:', data);

  // Obtener el token de autenticación de PocketBase
  const token = pb.authStore.token;
  if (!token) {
    throw new Error('No hay sesión activa');
  }

  try {
    const payload: Partial<ContabilidadRecord> = { ...data };

    if (payload.especie === 'transferencia') {
      payload.especie = 'trasferencia';
    }

    if (payload.detalle !== undefined) {
      payload.detalle = normalizeDetalle(
        typeof payload.detalle === 'string' ? payload.detalle : null
      ) as ContabilidadRecord['detalle'];
    }

    if (payload.montoEspera !== undefined) {
      payload.montoEspera = Number(payload.montoEspera);
    }

    if (payload.dolarEsperado !== undefined) {
      payload.dolarEsperado = Number(payload.dolarEsperado ?? 0);
    }

    if (payload.cliente_id === '') payload.cliente_id = null;
    if (payload.proveedor_id === '') payload.proveedor_id = null;
    if (payload.evento_id === '') payload.evento_id = null;
    if (payload.equipo_id === '') payload.equipo_id = null;

    const response = await fetch(`/api/contabilidad?id=${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error en updateContabilidadRecord:', errorData);
      throw new Error(errorData.error || 'Error al actualizar el registro');
    }

    const updatedRecord = await response.json();
    console.log('Registro actualizado exitosamente:', updatedRecord);
    return updatedRecord;
  } catch (error) {
    console.error('Error en updateContabilidadRecord:', error);
    throw error;
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
  return createContabilidadRecord({
    type: "cobro",
    especie: "efectivo",
    moneda: "ars",
    categoria: "oficina",
    subcargo: "sueldos",
    detalle: "honorarios",
    montoEspera: 1000,
    dolarEsperado: 0,
    fechaEspera: new Date().toISOString(),
    comentario: "",
    esEsperado: true
  });
} 
