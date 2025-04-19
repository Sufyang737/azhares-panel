import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

// Inicialización de PocketBase usando la variable de entorno
const pocketbaseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase-ykw4ks40gswowocosk80k440.srv.clostech.tech';

// Handler para GET (obtener personas)
export async function GET(request: NextRequest) {
  try {
    const pb = new PocketBase(pocketbaseUrl);
    
    // Autenticar como administrador
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
    if (adminToken) {
      pb.authStore.save(adminToken, null);
    } else {
      throw new Error('Token de administrador no configurado');
    }
    
    // Obtener parámetros de consulta para paginación, filtrado, etc.
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search') || '';
    const sort = url.searchParams.get('sort') || '-created';
    
    // Construir opciones de filtro para la consulta
    const filter = search 
      ? `nombre ~ "${search}" || apellido ~ "${search}" || email ~ "${search}" || telefono ~ "${search}"`
      : '';
    
    console.log('GET Personas - Parámetros:', { page, limit, search, sort, filter });
    
    // Obtener personas con paginación y filtros
    const personas = await pb.collection('personas').getList(page, limit, {
      sort: sort,
      filter: filter
    });
    
    // Obtener todos los clientes y sus relaciones con personas
    const clientes = await pb.collection('cliente').getFullList({
      fields: 'id,nombre,persona_id',
      sort: 'nombre'
    });

    console.log('DEBUG - Clientes y sus personas:', clientes.map(c => ({
      id: c.id,
      nombre: c.nombre,
      persona_id: c.persona_id
    })));

    // Crear un mapa de personas a clientes
    const personaToClientes = new Map();
    
    // Procesar cada cliente y sus personas asociadas
    clientes.forEach(cliente => {
      // Asegurarse de que persona_id sea un array
      const personaIds = Array.isArray(cliente.persona_id) ? cliente.persona_id : 
                        cliente.persona_id ? [cliente.persona_id] : [];
      
      // Por cada persona asociada al cliente
      personaIds.forEach(personaId => {
        if (!personaToClientes.has(personaId)) {
          personaToClientes.set(personaId, []);
        }
        personaToClientes.get(personaId).push({
          id: cliente.id,
          nombre: cliente.nombre
        });
      });
    });

    console.log('DEBUG - Mapa de personas a clientes:', 
      Object.fromEntries([...personaToClientes.entries()].map(([k, v]) => [k, v]))
    );
    
    // Transformar los datos si es necesario
    const personasFormateadas = personas.items.map(persona => {
      const clientesAsociados = personaToClientes.get(persona.id) || [];
      
      console.log('DEBUG - Formateando persona:', {
        id: persona.id,
        nombre: persona.nombre,
        clientes: clientesAsociados
      });
      
      return {
        id: persona.id,
        nombre: persona.nombre || '',
        apellido: persona.apellido || '',
        telefono: persona.telefono ? String(persona.telefono) : '',
        email: persona.email || '',
        cumpleanio: persona.cumpleanio || null,
        pais: persona.pais || '',
        ciudad: persona.ciudad || '',
        instagram: persona.instagram || '',
        direccion: persona.direccion || '',
        comentario: persona.comentario || '',
        tipo_persona: persona.tipo_persona || null,
        cliente_id: null, // Ya no usamos este campo
        cliente: null, // Ya no usamos este campo
        clientes: clientesAsociados,
        relacion: persona.relacion || null,
        created: persona.created,
        updated: persona.updated
      };
    });
    
    // Devolver respuesta con paginación
    return NextResponse.json({ 
      success: true, 
      data: personasFormateadas,
      pagination: {
        page: personas.page,
        totalPages: personas.totalPages,
        totalItems: personas.totalItems,
        perPage: personas.perPage
      }
    });
  } catch (error) {
    console.error('Error al obtener personas:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener personas' },
      { status: 500 }
    );
  }
}

// Handler para POST (crear persona)
export async function POST(request: NextRequest) {
  try {
    const pb = new PocketBase(pocketbaseUrl);
    
    // Autenticar como administrador
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
    if (adminToken) {
      pb.authStore.save(adminToken, null);
    } else {
      throw new Error('Token de administrador no configurado');
    }
    
    // Obtener datos del cuerpo de la solicitud
    const data = await request.json();
    console.log('POST Persona - Datos recibidos:', JSON.stringify(data, null, 2));
    
    // Validar campos requeridos
    if (!data.nombre || !data.apellido) {
      console.log('POST Persona - Faltan campos requeridos');
      return NextResponse.json(
        { success: false, error: 'Se requieren al menos nombre y apellido' },
        { status: 400 }
      );
    }
    
    // Formatear los datos según los requisitos de PocketBase
    const formattedData = {
      nombre: data.nombre,
      apellido: data.apellido,
      telefono: data.telefono ? String(data.telefono) : "", // Convertir a string si existe
      email: data.email || "",
      cumpleanio: data.cumpleanio ? new Date(data.cumpleanio).toISOString() : null,
      pais: data.pais || "",
      ciudad: data.ciudad || "",
      instagram: data.instagram || "",
      direccion: data.direccion || "",
      comentario: data.comentario || "",
      tipo_persona: data.tipo_persona || "",
      cliente_id: data.cliente_id === "none" ? null : data.cliente_id || null,
      relacion: data.relacion || null
    };

    console.log('POST Persona - Datos formateados:', JSON.stringify(formattedData, null, 2));
    
    // Crear la persona en PocketBase
    try {
      const record = await pb.collection('personas').create(formattedData);
      console.log('POST Persona - Persona creada con ID:', record.id);
      
      return NextResponse.json({
        success: true,
        data: record,
        id: record.id
      });
    } catch (error) {
      console.error('POST Persona - Error al crear persona:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      return NextResponse.json(
        { success: false, error: `Error al crear persona: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('POST Persona - Error general:', error);
    return NextResponse.json(
      { success: false, error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

// Handler para PATCH (actualizar persona)
export async function PATCH(request: NextRequest) {
  try {
    const pb = new PocketBase(pocketbaseUrl);
    
    // Autenticar como administrador
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
    if (adminToken) {
      pb.authStore.save(adminToken, null);
    } else {
      throw new Error('Token de administrador no configurado');
    }
    
    // Obtener datos del cuerpo de la solicitud
    const data = await request.json();
    console.log('PATCH Persona - Datos recibidos:', JSON.stringify(data, null, 2));
    
    // Validar que se proporcionó un ID
    if (!data.id) {
      console.log('PATCH Persona - Falta ID de la persona');
      return NextResponse.json(
        { success: false, error: 'Se requiere ID de la persona' },
        { status: 400 }
      );
    }
    
    // Procesar "none" como null para cliente_id
    if (data.cliente_id === "none") {
      data.cliente_id = null;
    }
    
    // Extraer ID y preparar datos para actualización
    const personaId = data.id;
    const updateData = { ...data };
    delete updateData.id; // Eliminar ID de los datos a actualizar
    
    console.log(`PATCH Persona - Actualizando persona ${personaId} con:`, JSON.stringify(updateData, null, 2));
    
    // Actualizar la persona en PocketBase
    try {
      const updatedRecord = await pb.collection('personas').update(personaId, updateData);
      console.log('PATCH Persona - Persona actualizada con éxito:', updatedRecord.id);
      
      return NextResponse.json({
        success: true,
        data: updatedRecord
      });
    } catch (error) {
      console.error('PATCH Persona - Error al actualizar persona:', error);
      
      // Intentar obtener detalles del error
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      return NextResponse.json(
        { success: false, error: `Error al actualizar persona: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('PATCH Persona - Error general:', error);
    return NextResponse.json(
      { success: false, error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

// Handler para DELETE (eliminar persona)
export async function DELETE(request: NextRequest) {
  try {
    const pb = new PocketBase(pocketbaseUrl);
    
    // Autenticar como administrador
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
    if (adminToken) {
      pb.authStore.save(adminToken, null);
    } else {
      throw new Error('Token de administrador no configurado');
    }
    
    // Obtener el ID de la persona a eliminar desde la URL
    const url = new URL(request.url);
    const personaId = url.searchParams.get('id');
    
    if (!personaId) {
      console.log('DELETE Persona - Falta ID de la persona');
      return NextResponse.json(
        { success: false, error: 'Se requiere ID de la persona' },
        { status: 400 }
      );
    }
    
    console.log(`DELETE Persona - Intentando eliminar persona ${personaId}`);
    
    try {
      // Intentar eliminar la persona
      await pb.collection('personas').delete(personaId);
      console.log('DELETE Persona - Persona eliminada con éxito');
      
      return NextResponse.json({
        success: true,
        message: 'Persona eliminada correctamente'
      });
    } catch (error) {
      // Verificar si el error es porque la persona no existe (404)
      console.error('DELETE Persona - Error al eliminar persona:', error);
      
      if (error instanceof Error && error.toString().includes('404')) {
        console.log('DELETE Persona - La persona ya no existe en la base de datos');
        return NextResponse.json({
          success: true,
          message: 'Persona no encontrada o ya eliminada'
        });
      }
      
      // Para otros tipos de errores, devolvemos un error normal
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      return NextResponse.json(
        { success: false, error: `Error al eliminar persona: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('DELETE Persona - Error general:', error);
    return NextResponse.json(
      { success: false, error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
} 