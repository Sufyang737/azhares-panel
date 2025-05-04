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
    const limit = searchParams.get('limit') || '5'
    const sort = searchParams.get('sort') || 'fecha'
    const filter = searchParams.get('filter') || ''
    const expand = searchParams.get('expand') || ''

    // Construir opciones de consulta
    const options: any = {
      sort: sort,
      expand: expand
    }

    if (filter) {
      options.filter = filter
    }

    // Obtener eventos
    const records = await pb.collection('evento').getList(1, parseInt(limit), options)

    // Procesar los eventos
    const events = records.items.map(event => ({
      id: event.id,
      nombre: event.nombre,
      fecha: event.fecha,
      tipo: event.tipo,
      estado: event.estado,
      cliente_id: event.cliente_id,
      expand: event.expand
    }))

    return NextResponse.json({
      success: true,
      events
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { success: false, message: 'Error al obtener los eventos' },
      { status: 500 }
    )
  }
} 