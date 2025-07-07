import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

if (!process.env.NEXT_PUBLIC_POCKETBASE_URL) {
  throw new Error('NEXT_PUBLIC_POCKETBASE_URL is not defined');
}

if (!process.env.POCKETBASE_ADMIN_TOKEN) {
  throw new Error('POCKETBASE_ADMIN_TOKEN is not defined');
}

export async function GET() {
  try {
    console.log('=== INICIANDO CÁLCULO DE BALANCE DE USD EN EFECTIVO ===');
    
    // Crear una nueva instancia de PocketBase para esta petición
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
    
    // Autenticar como admin
    pb.authStore.save(process.env.POCKETBASE_ADMIN_TOKEN, null);
    
    if (!pb.authStore.isValid) {
      throw new Error('No se pudo autenticar como administrador');
    }

    console.log('Obteniendo registros...');
    
    // Obtener registros con el mismo filtro que el script Python
    const records = await pb.collection('contabilidad').getList(1, 1000, {
      sort: '-created',
      filter: 'moneda="usd" && especie="efectivo" && (type="cobro" || type="pago")'
    });

    console.log(`Pág 1/${records.totalPages} → ${records.totalItems} registros filtrados`);

    // Separar cobros y pagos
    const cobros = records.items.filter(record => record.type === 'cobro');
    const pagos = records.items.filter(record => record.type === 'pago');

    // Calcular totales usando la misma lógica que el script Python
    const totalCobros = cobros.reduce((sum, record) => 
      sum + (record.montoEspera || record.dolarEsperado || 0), 0
    );
    
    const totalPagos = pagos.reduce((sum, record) => 
      sum + (record.montoEspera || record.dolarEsperado || 0), 0
    );

    const balance = totalCobros - totalPagos;

    // Imprimir resultados en el mismo formato que el script Python
    console.log(`\n✅ Total ingresos (cobros): ${cobros.length}`);
    console.log(`✅ Total egresos (pagos): ${pagos.length}`);
    console.log(`\n💵 Total ingresos en USD: ${totalCobros.toFixed(2)}`);
    console.log(`💵 Total egresos en USD: ${totalPagos.toFixed(2)}`);

    // Imprimir detalles para debugging
    console.log('\n=== DETALLES DE COBROS ===');
    cobros.forEach(cobro => {
      console.log(`ID: ${cobro.id}`);
      console.log(`Fecha: ${new Date(cobro.fechaEfectuado || cobro.fechaEspera).toLocaleDateString()}`);
      console.log(`Monto: $${cobro.montoEspera || cobro.dolarEsperado}`);
      console.log(`Comentario: ${cobro.comentario || 'Sin comentario'}`);
      console.log('-------------------------');
    });

    console.log('\n=== DETALLES DE PAGOS ===');
    pagos.forEach(pago => {
      console.log(`ID: ${pago.id}`);
      console.log(`Fecha: ${new Date(pago.fechaEfectuado || pago.fechaEspera).toLocaleDateString()}`);
      console.log(`Monto: $${pago.montoEspera || pago.dolarEsperado}`);
      console.log(`Comentario: ${pago.comentario || 'Sin comentario'}`);
      console.log('-------------------------');
    });

    // Limpiar la autenticación después de usarla
    pb.authStore.clear();

    // Devolver los resultados
    return NextResponse.json({
      totalRegistros: records.totalItems,
      cantidadCobros: cobros.length,
      cantidadPagos: pagos.length,
      totalCobros,
      totalPagos,
      balance,
      detalles: {
        cobros: cobros.map(c => ({
          id: c.id,
          fecha: c.fechaEfectuado || c.fechaEspera,
          monto: c.montoEspera || c.dolarEsperado,
          comentario: c.comentario || 'Sin comentario'
        })),
        pagos: pagos.map(p => ({
          id: p.id,
          fecha: p.fechaEfectuado || p.fechaEspera,
          monto: p.montoEspera || p.dolarEsperado,
          comentario: p.comentario || 'Sin comentario'
        }))
      }
    });

  } catch (error) {
    console.error('Error calculando balance:', error);
    
    let statusCode = 500;
    let errorMessage = 'Error al calcular el balance';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      if ('status' in error) {
        statusCode = error.status as number;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
} 