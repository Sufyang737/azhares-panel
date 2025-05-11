import { NextResponse } from "next/server"
import { type NextRequest } from "next/server"
import PocketBase from "pocketbase"

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)

// Obtener un proveedor específico por ID
export async function GET(request: NextRequest) {
  const id = request.nextUrl.pathname.split('/').pop()
  
  try {
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN
    if (!adminToken) {
      throw new Error('Token de administrador no configurado')
    }
    pb.authStore.save(adminToken, null)
    
    const record = await pb.collection("proveedores").getOne(id!)
    return NextResponse.json({ success: true, data: record })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Error al obtener el proveedor" },
      { status: 500 }
    )
  }
}

// Actualizar un proveedor específico por ID
export async function PATCH(request: NextRequest) {
  const id = request.nextUrl.pathname.split('/').pop()
  
  try {
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN
    if (!adminToken) {
      throw new Error('Token de administrador no configurado')
    }
    pb.authStore.save(adminToken, null)
    
    const data = await request.json()
    if (data.id) {
      delete data.id
    }
    
    const record = await pb.collection("proveedores").update(id!, data)
    return NextResponse.json({ success: true, data: record })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Error al actualizar el proveedor" },
      { status: 500 }
    )
  }
}

// Eliminar un proveedor específico por ID
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.pathname.split('/').pop()
  
  try {
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN
    if (!adminToken) {
      throw new Error('Token de administrador no configurado')
    }
    pb.authStore.save(adminToken, null)
    
    await pb.collection("proveedores").delete(id!)
    return NextResponse.json({ 
      success: true, 
      message: "Proveedor eliminado correctamente" 
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Error al eliminar el proveedor" },
      { status: 500 }
    )
  }
}