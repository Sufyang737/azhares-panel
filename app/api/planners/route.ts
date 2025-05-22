import { NextResponse } from 'next/server';
import { pb } from '@/lib/pocketbase';

export async function GET() {
  try {
    // Obtener usuarios con rol de planner
    const planners = await pb.collection('usuarios').getFullList({
      sort: 'nombre',
      filter: 'rol = "planner"',
      fields: 'id,nombre,username'
    });

    return NextResponse.json({
      success: true,
      planners: planners.map(planner => ({
        id: planner.id,
        nombre: planner.nombre || planner.username // Usar username como fallback si no hay nombre
      }))
    });
  } catch (error) {
    console.error('Error al obtener planners:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener la lista de planners' },
      { status: 500 }
    );
  }
} 