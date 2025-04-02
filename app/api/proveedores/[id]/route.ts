import { NextResponse } from "next/server"
import PocketBase from "pocketbase"

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)

// Obtener un proveedor específico por ID
export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    console.log(`GET Proveedor - Obteniendo proveedor con ID: ${context.params.id}`);
    
    // Autenticar con el token de admin
    try {
      const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
      if (!adminToken) {
        throw new Error('Token de administrador no configurado');
      }
      pb.authStore.save(adminToken, null);
      console.log('GET Proveedor - Autenticación con token exitosa');
    } catch (authError) {
      console.error('GET Proveedor - Error de autenticación:', authError);
      throw new Error('Error de autenticación con el administrador');
    }
    
    const id = context.params.id;
    
    try {
      const record = await pb.collection("proveedores").getOne(id);
      console.log(`GET Proveedor - Proveedor con ID ${id} obtenido correctamente`);
      
      return NextResponse.json({ success: true, data: record });
    } catch (getError: any) {
      console.error(`GET Proveedor - Error al obtener el proveedor ${id}:`, getError);
      
      if (getError.status === 404) {
        return NextResponse.json(
          { success: false, error: "Proveedor no encontrado" },
          { status: 404 }
        );
      }
      
      throw getError;
    }
  } catch (error) {
    console.error("GET Proveedor - Error general:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener el proveedor" },
      { status: 500 }
    );
  }
}

// Actualizar un proveedor específico por ID
export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    console.log(`PATCH Proveedor - Actualizando proveedor con ID: ${context.params.id}`);
    
    // Autenticar con el token de admin
    try {
      const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
      if (!adminToken) {
        throw new Error('Token de administrador no configurado');
      }
      pb.authStore.save(adminToken, null);
      console.log('PATCH Proveedor - Autenticación con token exitosa');
    } catch (authError) {
      console.error('PATCH Proveedor - Error de autenticación:', authError);
      throw new Error('Error de autenticación con el administrador');
    }
    
    const id = context.params.id;
    const data = await request.json();
    console.log(`PATCH Proveedor - Datos para actualizar el proveedor ${id}:`, JSON.stringify(data, null, 2));
    
    // Eliminar el ID si está presente en los datos
    if (data.id) {
      delete data.id;
    }
    
    try {
      const record = await pb.collection("proveedores").update(id, data);
      console.log(`PATCH Proveedor - Proveedor con ID ${id} actualizado correctamente`);
      
      return NextResponse.json({ success: true, data: record });
    } catch (updateError: any) {
      console.error(`PATCH Proveedor - Error al actualizar el proveedor ${id}:`, updateError);
      
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
      
      throw updateError;
    }
  } catch (error) {
    console.error("PATCH Proveedor - Error general:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar el proveedor" },
      { status: 500 }
    );
  }
}

// Eliminar un proveedor específico por ID
export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    console.log(`DELETE Proveedor - Eliminando proveedor con ID: ${context.params.id}`);
    
    // Autenticar con el token de admin
    try {
      const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
      if (!adminToken) {
        throw new Error('Token de administrador no configurado');
      }
      pb.authStore.save(adminToken, null);
      console.log('DELETE Proveedor - Autenticación con token exitosa');
    } catch (authError) {
      console.error('DELETE Proveedor - Error de autenticación:', authError);
      throw new Error('Error de autenticación con el administrador');
    }
    
    const id = context.params.id;
    
    // Opcional: verificar si el proveedor tiene registros relacionados antes de eliminar
    
    try {
      await pb.collection("proveedores").delete(id);
      console.log(`DELETE Proveedor - Proveedor con ID ${id} eliminado correctamente`);
      
      return NextResponse.json({ 
        success: true, 
        message: "Proveedor eliminado correctamente" 
      });
    } catch (deleteError: any) {
      console.error(`DELETE Proveedor - Error al eliminar el proveedor ${id}:`, deleteError);
      
      if (deleteError.status === 404) {
        return NextResponse.json(
          { success: false, error: "Proveedor no encontrado" },
          { status: 404 }
        );
      }
      
      // Si hay detalles de error, los mostramos
      if (deleteError.response && deleteError.response.data) {
        console.error('DELETE Proveedor - Datos del error:', JSON.stringify(deleteError.response.data, null, 2));
      }
      
      throw deleteError;
    }
  } catch (error) {
    console.error("DELETE Proveedor - Error general:", error);
    return NextResponse.json(
      { success: false, error: "Error al eliminar el proveedor" },
      { status: 500 }
    );
  }
}