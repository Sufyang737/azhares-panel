import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

export async function GET(request: NextRequest) {
  try {
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)
    
    // Obtener cookie de autenticación
    const authCookie = request.cookies.get('pb_auth')?.value
    if (authCookie) {
      pb.authStore.loadFromCookie(`pb_auth=${authCookie}`)
    }

    // Verificar autenticación
    if (!pb.authStore.isValid) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      )
    }
    
    // Obtener parámetros de la URL
    const searchParams = request.nextUrl.searchParams
    const filter = searchParams.get('filter') || ''
    const sort = searchParams.get('sort') || ''

    // Construir opciones de consulta
    const options: any = {
      sort: sort
    }

    if (filter) {
      options.filter = filter
    }

    // Obtener clientes
    const records = await pb.collection('cliente').getList(1, 100, options)

    // Procesar los clientes
    const clients = records.items.map(client => ({
      id: client.id,
      nombre: client.nombre,
      apellido: client.apellido,
      cumpleanio: client.cumpleanio
    }))

    return NextResponse.json({
      success: true,
      clients
    })
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { success: false, message: 'Error al obtener los clientes' },
      { status: 500 }
    )
  }
} 