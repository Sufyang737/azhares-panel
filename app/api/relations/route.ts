import { NextResponse } from 'next/server';
import { pb } from '@/app/lib/pocketbase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection');

    if (!collection) {
      return NextResponse.json({ error: 'Collection parameter is required' }, { status: 400 });
    }

    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
    if (!adminToken) {
      return NextResponse.json({ error: 'Admin token not configured' }, { status: 500 });
    }

    pb.authStore.save(adminToken);

    let sort = '';
    let fields = '';

    switch (collection) {
      case 'cliente':
        sort = 'nombre';
        fields = 'id,nombre,contacto,pais,ciudad';
        break;
      case 'proveedores':
        sort = 'nombre';
        fields = 'id,nombre,alias,contacto,categoria';
        break;
      case 'evento':
        sort = '-fecha';
        fields = 'id,nombre,tipo,fecha,estado,cliente_id';
        break;
      case 'equipo':
        sort = 'apellido';
        fields = 'id,nombre,apellido,cargo,email';
        break;
      default:
        return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
    }

    const records = await pb.collection(collection).getFullList({
      sort,
      fields
    });

    return NextResponse.json(records);
  } catch (error: any) {
    console.error('Error fetching records:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 