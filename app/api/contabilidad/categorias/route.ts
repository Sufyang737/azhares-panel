import { NextResponse } from "next/server"
import PocketBase from "pocketbase"

// Constantes para colecciones
const COLLECTION_NAME = "categorias"

export async function GET() {
  try {
    const pocketBaseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL;
    if (!pocketBaseUrl) {
      throw new Error("NEXT_PUBLIC_POCKETBASE_URL no está configurada");
    }
    
    const pb = new PocketBase(pocketBaseUrl);
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN || "";
    if (!adminToken) {
      throw new Error("Token de administrador no configurado");
    }
    pb.authStore.save(adminToken, null);
    
    const records = await pb.collection(COLLECTION_NAME).getFullList();
    return NextResponse.json(records);
  } catch (error) {
    console.error("Error en GET /api/contabilidad/categorias:", error);
    return NextResponse.json(
      { error: "Error al obtener categorías" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const pocketBaseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL;
    if (!pocketBaseUrl) {
      throw new Error("NEXT_PUBLIC_POCKETBASE_URL no está configurada");
    }
    
    const pb = new PocketBase(pocketBaseUrl);
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN || "";
    if (!adminToken) {
      throw new Error("Token de administrador no configurado");
    }
    pb.authStore.save(adminToken, null);
    
    const formData = await req.formData();
    const data = Object.fromEntries(formData.entries());
    
    // Validar los datos requeridos
    if (!data.nombre) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }
    
    // Crear la categoría
    const record = await pb.collection(COLLECTION_NAME).create(data);
    
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/contabilidad/categorias:", error);
    return NextResponse.json(
      { error: "Error al crear categoría" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const pocketBaseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL;
    if (!pocketBaseUrl) {
      throw new Error("NEXT_PUBLIC_POCKETBASE_URL no está configurada");
    }
    
    const pb = new PocketBase(pocketBaseUrl);
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN || "";
    if (!adminToken) {
      throw new Error("Token de administrador no configurado");
    }
    pb.authStore.save(adminToken, null);
    
    const formData = await req.formData();
    const data = Object.fromEntries(formData.entries());
    const id = data.id as string;
    
    if (!id) {
      return NextResponse.json(
        { error: "ID no proporcionado" },
        { status: 400 }
      );
    }
    
    // Eliminar el ID del objeto de datos antes de actualizar
    delete data.id;
    
    const record = await pb.collection(COLLECTION_NAME).update(id, data);
    
    return NextResponse.json(record);
  } catch (error) {
    console.error("Error en PUT /api/contabilidad/categorias:", error);
    return NextResponse.json(
      { error: "Error al actualizar categoría" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const pocketBaseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL;
    if (!pocketBaseUrl) {
      throw new Error("NEXT_PUBLIC_POCKETBASE_URL no está configurada");
    }
    
    const pb = new PocketBase(pocketBaseUrl);
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN || "";
    if (!adminToken) {
      throw new Error("Token de administrador no configurado");
    }
    pb.authStore.save(adminToken, null);
    
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "ID no proporcionado" },
        { status: 400 }
      );
    }
    
    await pb.collection(COLLECTION_NAME).delete(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en DELETE /api/contabilidad/categorias:", error);
    return NextResponse.json(
      { error: "Error al eliminar categoría" },
      { status: 500 }
    );
  }
}