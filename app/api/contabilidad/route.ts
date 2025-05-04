import { NextResponse } from "next/server"
import PocketBase from "pocketbase"

// Constantes para colecciones
const COLLECTION_NAME = "contabilidad"

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)

async function initPocketBase() {
  const adminToken = process.env.POCKETBASE_ADMIN_TOKEN
  if (!adminToken) {
    throw new Error("Token de administrador no configurado")
  }
  pb.authStore.save(adminToken, null)
}

export async function GET(req: Request) {
  try {
    await initPocketBase()
    
    const url = new URL(req.url)
    const tipo = url.searchParams.get("tipo")
    const desde = url.searchParams.get("desde")
    const hasta = url.searchParams.get("hasta")
    
    let filter = ""
    if (tipo) filter += `type = "${tipo}"`
    if (desde && hasta) {
      if (filter) filter += " && "
      filter += `(fechaEspera >= "${desde}" && fechaEspera <= "${hasta}")`
    }
    
    // Obtener todos los registros con paginación automática
    const records = await pb.collection(COLLECTION_NAME).getFullList({
      sort: "-created",
      filter: filter || undefined,
      expand: "cliente_id,proveedor_id,evento_id,equipo_id"
    })

    // Asegurarse de que todos los campos necesarios estén presentes
    const processedRecords = records.map(record => ({
      id: record.id,
      comentario: record.comentario || null,
      type: record.type || "",
      especie: record.especie || "",
      moneda: record.moneda || "",
      categoria: record.categoria || "",
      subcargo: record.subcargo || "",
      detalle: record.detalle || "",
      fechaEspera: record.fechaEspera || "",
      cliente_id: record.cliente_id || null,
      proveedor_id: record.proveedor_id || null,
      evento_id: record.evento_id || null,
      equipo_id: record.equipo_id || null,
      dolarEsperado: record.dolarEsperado || null,
      fechaEfectuado: record.fechaEfectuado || null,
      montoEspera: record.montoEspera || null,
      created: record.created,
      updated: record.updated,
      expand: record.expand || {}
    }))
    
    return NextResponse.json(processedRecords)
  } catch (error) {
    console.error("Error al obtener registros:", error)
    return NextResponse.json({ error: "Error al obtener registros" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await initPocketBase()
    
    const formData = await req.formData()
    const rawData: Record<string, any> = {}
    
    // Procesar cada campo del FormData
    for (const [key, value] of formData.entries()) {
      if (value === null || value === undefined || value === "") {
        continue
      }
      
      // Convertir campos numéricos
      if (key === "montoEspera" || key === "dolarEsperado") {
        rawData[key] = Number(value)
        continue
      }
      
      // Convertir fechas
      if (key === "fechaEspera" || key === "fechaEfectuado") {
        rawData[key] = new Date(value.toString()).toISOString()
        continue
      }
      
      // Procesar campos booleanos
      if (key === "efectuado") {
        rawData[key] = value === "true"
        continue
      }
      
      // Procesar IDs
      if (["cliente_id", "proveedor_id", "evento_id", "equipo_id"].includes(key)) {
        rawData[key] = value === "ninguno" ? null : value
        continue
      }
      
      // Otros campos se mantienen como string
      rawData[key] = value.toString()
    }
    
    // Crear el registro
    const record = await pb.collection(COLLECTION_NAME).create(rawData)
    
    // Obtener el registro recién creado con todos sus campos
    const createdRecord = await pb.collection(COLLECTION_NAME).getOne(record.id)
    
    return NextResponse.json(createdRecord)
  } catch (error) {
    console.error("Error al crear registro:", error)
    return NextResponse.json(
      { error: "Error al crear registro", details: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    await initPocketBase()
    
    const formData = await req.formData()
    const rawData = Object.fromEntries(formData.entries())
    const id = rawData.id?.toString()
    
    if (!id) {
      return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 })
    }
    
    delete rawData.id
    
    // Convert dates to ISO strings
    if (rawData.fechaEspera) {
      rawData.fechaEspera = new Date(rawData.fechaEspera.toString()).toISOString()
    }
    if (rawData.fechaEfectuado) {
      rawData.fechaEfectuado = new Date(rawData.fechaEfectuado.toString()).toISOString()
    }
    
    // Convert numbers to strings
    if (rawData.montoEspera) {
      rawData.montoEspera = Number(rawData.montoEspera).toString()
    }
    if (rawData.dolarEsperado) {
      rawData.dolarEsperado = Number(rawData.dolarEsperado).toString()
    }
    
    // Process boolean
    if (rawData.efectuado) {
      rawData.efectuado = (rawData.efectuado === "true").toString()
    }
    
    // Process IDs
    const idFields = ["cliente_id", "proveedor_id", "evento_id", "equipo_id"]
    idFields.forEach(field => {
      if (rawData[field] === "ninguno") rawData[field] = null
    })
    
    const record = await pb.collection(COLLECTION_NAME).update(id, rawData)
    return NextResponse.json(record)
  } catch {
    return NextResponse.json({ error: "Error al actualizar registro" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    await initPocketBase()
    
    const url = new URL(req.url)
    const id = url.searchParams.get("id")
    
    if (!id) {
      return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 })
    }
    
    await pb.collection(COLLECTION_NAME).delete(id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Error al eliminar registro" }, { status: 500 })
  }
}
