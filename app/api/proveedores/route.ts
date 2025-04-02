import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

// Handler para POST (crear proveedor)
export async function POST(request: NextRequest) {
  try {
    // Inicialización de PocketBase usando la variable de entorno
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
    console.log('POST Proveedor - Inicializando PocketBase con URL:', process.env.NEXT_PUBLIC_POCKETBASE_URL);
    
    // Autenticar como administrador usando el token
    try {
      console.log('POST Proveedor - Intentando autenticar como administrador');
      const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
      if (!adminToken) {
        throw new Error('Token de administrador no configurado');
      }
      pb.authStore.save(adminToken, null);
      console.log('POST Proveedor - Autenticación con token exitosa');
    } catch (authError) {
      console.error('POST Proveedor - Error de autenticación:', authError);
      throw new Error('Error de autenticación con el administrador');
    }
    
    const data = await request.json();
    console.log('POST Proveedor - Datos recibidos:', JSON.stringify(data, null, 2));
    
    // Validar los campos requeridos mínimos
    if (!data.nombre) {
      console.log('POST Proveedor - Falta nombre del proveedor');
      return NextResponse.json(
        { success: false, error: 'Se requiere al menos el nombre del proveedor' },
        { status: 400 }
      );
    }
    
    // Crear el proveedor en PocketBase
    console.log('POST Proveedor - Intentando crear proveedor:', data.nombre);
    try {
      const record = await pb.collection('proveedores').create(data);
      console.log('POST Proveedor - Proveedor creado con éxito:', record.id);
      
      return NextResponse.json({ 
        success: true, 
        data: record,
        id: record.id
      });
    } catch (createError: any) {
      console.error('POST Proveedor - Error detallado al crear:', createError);
      // Si hay detalles de validación en el error, los devolvemos
      if (createError.response && createError.response.data) {
        console.error('POST Proveedor - Datos del error:', JSON.stringify(createError.response.data, null, 2));
        return NextResponse.json(
          { 
            success: false, 
            error: 'Error al crear proveedor', 
            details: createError.response.data 
          },
          { status: 400 }
        );
      }
      throw createError;
    }
  } catch (error) {
    console.error('POST Proveedor - Error general:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear proveedor' },
      { status: 500 }
    );
  }
}

// Handler para GET (obtener proveedores)
export async function GET() {
  try {
    // Inicialización de PocketBase usando la variable de entorno
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
    
    // Autenticar como administrador usando el token
    try {
      const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
      if (!adminToken) {
        throw new Error('Token de administrador no configurado');
      }
      pb.authStore.save(adminToken, null);
    } catch (authError) {
      console.error('GET Proveedores - Error de autenticación:', authError);
      throw new Error('Error de autenticación con el administrador');
    }
    
    const proveedores = await pb.collection('proveedores').getList(1, 100, {
      sort: '-created',
    });
    
    // Transformar los datos para manejar valores undefined
    const proveedoresFormateados = proveedores.items.map(proveedor => {
      return {
        id: proveedor.id,
        nombre: proveedor.nombre || '',
        alias: proveedor.alias || '',
        contacto: proveedor.contacto || null,
        telefono: proveedor.telefono || null, 
        email: proveedor.email || null,
        pais: proveedor.pais || null,
        web: proveedor.web || null,
        instagram: proveedor.instagram || null,
        direccion: proveedor.direccion || null,
        comision: proveedor.comision || null,
        categoria: proveedor.categoria || null,
        created: proveedor.created,
        updated: proveedor.updated
      };
    });
    
    return NextResponse.json({ 
      success: true, 
      data: proveedoresFormateados
    });
  } catch (error) {
    console.error('GET Proveedores - Error general:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener proveedores' },
      { status: 500 }
    );
  }
}

// Handler para PATCH (actualizar proveedor)
export async function PATCH(request: NextRequest) {
  try {
    // Inicialización de PocketBase usando la variable de entorno
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
    
    // Autenticar como administrador usando el token
    try {
      const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
      if (!adminToken) {
        throw new Error('Token de administrador no configurado');
      }
      pb.authStore.save(adminToken, null);
    } catch (authError) {
      console.error('PATCH Proveedor - Error de autenticación:', authError);
      throw new Error('Error de autenticación con el administrador');
    }
    
    // Obtener datos del cuerpo de la solicitud
    const data = await request.json();
    console.log('PATCH Proveedor - Datos recibidos:', JSON.stringify(data, null, 2));
    
    // Validar que se proporcionó un ID
    if (!data.id) {
      console.log('PATCH Proveedor - Falta ID del proveedor');
      return NextResponse.json(
        { success: false, error: 'Se requiere ID del proveedor' },
        { status: 400 }
      );
    }
    
    // Extraer ID y preparar datos para actualización
    const proveedorId = data.id;
    const updateData = { ...data };
    delete updateData.id; // Eliminar ID de los datos a actualizar
    
    console.log(`PATCH Proveedor - Actualizando proveedor ${proveedorId} con:`, JSON.stringify(updateData, null, 2));
    
    // Actualizar el proveedor en PocketBase
    try {
      const updatedRecord = await pb.collection('proveedores').update(proveedorId, updateData);
      console.log('PATCH Proveedor - Proveedor actualizado con éxito:', updatedRecord.id);
      
      return NextResponse.json({
        success: true,
        data: updatedRecord
      });
    } catch (updateError: any) {
      console.error('PATCH Proveedor - Error al actualizar proveedor:', updateError);
      
      // Si hay detalles de validación en el error, los devolvemos
      if (updateError.response && updateError.response.data) {
        console.error('PATCH Proveedor - Datos del error:', JSON.stringify(updateError.response.data, null, 2));
        return NextResponse.json(
          { 
            success: false, 
            error: 'Error al actualizar proveedor', 
            details: updateError.response.data 
          },
          { status: 400 }
        );
      }
      
      // Intentar obtener detalles del error
      const errorMessage = updateError instanceof Error ? updateError.message : 'Error desconocido';
      
      return NextResponse.json(
        { success: false, error: `Error al actualizar proveedor: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('PATCH Proveedor - Error general:', error);
    return NextResponse.json(
      { success: false, error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

// Handler para DELETE (eliminar proveedor)
export async function DELETE(request: NextRequest) {
  try {
    // Inicialización de PocketBase usando la variable de entorno
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
    
    // Autenticar como administrador usando el token
    try {
      const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
      if (!adminToken) {
        throw new Error('Token de administrador no configurado');
      }
      pb.authStore.save(adminToken, null);
    } catch (authError) {
      console.error('DELETE Proveedor - Error de autenticación:', authError);
      throw new Error('Error de autenticación con el administrador');
    }
    
    // Obtener el ID del proveedor a eliminar desde la URL
    const url = new URL(request.url);
    const proveedorId = url.searchParams.get('id');
    
    if (!proveedorId) {
      console.log('DELETE Proveedor - Falta ID del proveedor');
      return NextResponse.json(
        { success: false, error: 'Se requiere ID del proveedor' },
        { status: 400 }
      );
    }
    
    console.log(`DELETE Proveedor - Intentando eliminar proveedor ${proveedorId}`);
    
    try {
      // Intentar eliminar el proveedor
      await pb.collection('proveedores').delete(proveedorId);
      console.log('DELETE Proveedor - Proveedor eliminado con éxito');
      
      return NextResponse.json({
        success: true,
        message: 'Proveedor eliminado correctamente'
      });
    } catch (deleteError: any) {
      // Verificar si el error es porque el proveedor no existe (404)
      console.error('DELETE Proveedor - Error al eliminar proveedor:', deleteError);
      
      if (deleteError.status === 404) {
        console.log('DELETE Proveedor - El proveedor ya no existe en la base de datos');
        return NextResponse.json({
          success: true,
          message: 'Proveedor no encontrado o ya fue eliminado anteriormente'
        }, { status: 200 });
      }
      
      // Si hay detalles de error, los mostramos
      if (deleteError.response && deleteError.response.data) {
        console.error('DELETE Proveedor - Datos del error:', JSON.stringify(deleteError.response.data, null, 2));
      }
      
      // Para otros tipos de errores, devolvemos un error normal
      const errorMessage = deleteError instanceof Error ? deleteError.message : 'Error desconocido';
      
      return NextResponse.json(
        { success: false, error: `Error al eliminar proveedor: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('DELETE Proveedor - Error general:', error);
    return NextResponse.json(
      { success: false, error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
} 