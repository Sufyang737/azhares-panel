import { NextRequest, NextResponse } from "next/server";
import PocketBase, { ClientResponseError } from "pocketbase";

if (!process.env.NEXT_PUBLIC_POCKETBASE_URL) {
  throw new Error('NEXT_PUBLIC_POCKETBASE_URL is not defined in environment variables');
}

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

export async function POST(req: NextRequest) {
  try {
    // Autenticar como administrador
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
    if (adminToken) {
      pb.authStore.save(adminToken, null);
    } else {
      throw new Error('Token de administrador no configurado');
    }
    
    const body = await req.json();
    console.log('Datos recibidos en POST:', body);

    // Validate required fields and their values
    const requiredFields = ["type", "especie", "moneda", "categoria", "subcargo", "montoEspera"];
    for (const field of requiredFields) {
      if (!body[field] && body[field] !== 0) {
        return NextResponse.json(
          { error: `El campo ${field} es requerido` },
          { status: 400 }
        );
      }
    }

    // Validate enum values
    if (body.type && !["cobro", "pago"].includes(body.type)) {
      return NextResponse.json(
        { error: "El campo 'type' debe ser 'cobro' o 'pago'" },
        { status: 400 }
      );
    }

    if (body.especie && !["efectivo", "trasferencia"].includes(body.especie)) {
      return NextResponse.json(
        { error: "El campo 'especie' debe ser 'efectivo' o 'trasferencia'" },
        { status: 400 }
      );
    }

    if (body.moneda && !["ars", "usd"].includes(body.moneda)) {
      return NextResponse.json(
        { error: "El campo 'moneda' debe ser 'ars' o 'usd'" },
        { status: 400 }
      );
    }

    if (body.categoria && !["evento", "oficina"].includes(body.categoria)) {
      return NextResponse.json(
        { error: "El campo 'categoria' debe ser 'evento' u 'oficina'" },
        { status: 400 }
      );
    }

    const validSubcargos = [
      "clientes", "otros", "proveedores", "sueldos", "mensajeria",
      "cambio-divisas", "ajuste-caja", "obra-social-empleada",
      "mantencion-cuenta-corriente", "seguro-galicia", "tarjeta-credito",
      "deriva", "expensas", "alquiler", "prepaga", "contador",
      "mantenimiento-pc", "impuestos", "servicios", "regaleria", "compras"
    ];

    if (body.subcargo && !validSubcargos.includes(body.subcargo)) {
      return NextResponse.json(
        { error: `El campo 'subcargo' debe ser uno de los siguientes valores: ${validSubcargos.join(", ")}` },
        { status: 400 }
      );
    }

    if (body.detalle) {
      const validDetalles = [
        "compra-usd", "comision", "handy","otros", "honorarios", "maquillaje", "Loli", "Noe",
        "planner", "staff", "viandas", "venta-usd", "viatico", "seguro",
        "iva", "ganancias", "luz", "gas", "internet", "general", "telefono",
        "prosegur", "mayorista", "coto", "libreria", "cerrajeria", "cafe", "agua", "autonomo"
      ];

      if (!validDetalles.includes(body.detalle)) {
        return NextResponse.json(
          { error: `El campo 'detalle' debe ser uno de los valores permitidos: ${validDetalles.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Create the record with proper type handling
    const data = {
      type: body.type,
      especie: body.especie,
      moneda: body.moneda,
      categoria: body.categoria,
      subcargo: body.subcargo,
      detalle: body.detalle || null,
      montoEspera: Number(body.montoEspera),
      fechaEspera: body.fechaEspera || new Date().toISOString(),
      dolarEsperado: body.dolarEsperado ? Number(body.dolarEsperado) : 0,
      comentario: body.comentario || null,
      fechaEfectuado: body.fechaEfectuado || null,
      cliente_id: body.cliente_id || null,
      proveedor_id: body.proveedor_id || null,
      evento_id: body.evento_id || null,
      equipo_id: body.equipo_id || null,
    };

    console.log('Intentando crear registro con datos:', data);
    const record = await pb.collection('contabilidad').create(data);
    console.log('Registro creado:', record);

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error creating accounting record:', error);
    
    if (error instanceof ClientResponseError) {
      console.error('PocketBase error details:', error.response.data);
      return NextResponse.json(
        { 
          error: error.message,
          details: error.response.data
        },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al crear el registro contable' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Autenticar como administrador
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
    if (adminToken) {
      pb.authStore.save(adminToken, null);
    } else {
      throw new Error('Token de administrador no configurado');
    }

    const { searchParams } = new URL(req.url);
    
    // Get all query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '50');
    const sort = searchParams.get('sort') || '-created';
    const filter = searchParams.get('filter') || '';
    const expand = searchParams.get('expand') || '';
    const skipTotal = searchParams.get('skipTotal') === 'true';

    console.log('=== INICIO GET CONTABILIDAD ===');
    console.log('URL de PocketBase:', process.env.NEXT_PUBLIC_POCKETBASE_URL);
    console.log('Estado de autenticación:', {
      isValid: pb.authStore.isValid,
      token: pb.authStore.token ? 'presente' : 'ausente'
    });
    console.log('Parámetros de búsqueda:', {
      page,
      perPage,
      sort,
      filter,
      expand,
      skipTotal
    });

    try {
      // Intentar obtener todos los registros directamente
      const records = await pb.collection('contabilidad').getFullList({
        sort,
        filter,
        expand,
      });

      console.log(`API: Se encontraron ${records.length} registros`);
      
      if (records.length === 0) {
        console.log('API: No se encontraron registros. Verificando permisos de colección...');
        const collection = await pb.collections.getOne('contabilidad');
        console.log('API: Permisos de colección:', {
          listRule: collection.listRule,
          viewRule: collection.viewRule,
          createRule: collection.createRule,
          updateRule: collection.updateRule,
          deleteRule: collection.deleteRule
        });
      }

      // Si skipTotal es false y se requiere paginación, convertir a formato paginado
      if (!skipTotal) {
        const start = (page - 1) * perPage;
        const end = start + perPage;
        const paginatedRecords = records.slice(start, end);
        
        return NextResponse.json({
          items: paginatedRecords,
          page,
          perPage,
          totalItems: records.length,
          totalPages: Math.ceil(records.length / perPage)
        });
      }

      return NextResponse.json({ items: records });
    } catch (error) {
      console.error('Error al obtener registros de PocketBase:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error fetching accounting records:', error);
    
    if (error instanceof ClientResponseError) {
      return NextResponse.json(
        { 
          error: error.message,
          details: error.response.data
        },
        { status: error.status }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Error al obtener los registros contables' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Autenticar como administrador
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
    if (adminToken) {
      pb.authStore.save(adminToken, null);
    } else {
      throw new Error('Token de administrador no configurado');
    }
    
    // Obtener el ID de los parámetros de consulta
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el ID del registro' },
        { status: 400 }
      );
    }

    // Obtener los datos a actualizar del cuerpo de la solicitud
    const updateData = await req.json();
    console.log('=== INICIO PATCH CONTABILIDAD ===');
    console.log('ID:', id);
    console.log('Datos a actualizar:', updateData);

    try {
      const record = await pb.collection('contabilidad').update(id, updateData);
      console.log('Registro actualizado exitosamente:', record);
      return NextResponse.json(record);
    } catch (error) {
      console.error('Error al actualizar en PocketBase:', error);
      if (error instanceof ClientResponseError) {
        return NextResponse.json(
          { error: error.message, details: error.response.data },
          { status: error.status }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error en PATCH contabilidad:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al actualizar el registro contable' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Inicialización de PocketBase usando la variable de entorno
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
    
    // Autenticar como administrador
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
    if (adminToken) {
      pb.authStore.save(adminToken, null);
    } else {
      throw new Error('Token de administrador no configurado');
    }
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el ID del registro' },
        { status: 400 }
      );
    }

    await pb.collection('contabilidad').delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting accounting record:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Error al eliminar el registro contable' },
      { status: 500 }
    );
  }
} 