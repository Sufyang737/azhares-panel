import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

// Endpoint público para obtener información mínima del cliente para el formulario
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Obtener y esperar los parámetros dinámicos (Next.js 15)
    const resolvedParams = await params;
    const clienteId = resolvedParams.id;
    
    if (!clienteId) {
      return NextResponse.json(
        { error: 'ID de cliente no proporcionado' },
        { status: 400 }
      );
    }

    // Inicializar PocketBase
    const pocketbaseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase-ykw4ks40gswowocosk80k440.srv.clostech.tech';
    const pb = new PocketBase(pocketbaseUrl);
    
    // Autenticar directamente usando el token de administrador guardado en variables de entorno
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
    if (adminToken) {
      // Usar authStore.save para establecer manualmente el token de admin
      pb.authStore.save(adminToken, null);
    } else {
      console.warn('API Formulario Cliente - POCKETBASE_ADMIN_TOKEN no configurado');
    }

    // Obtener datos mínimos del cliente (solo lo necesario para el formulario)
    const cliente = await pb.collection('cliente').getOne(clienteId, {
      fields: 'id,nombre,email,contacto',
    });

    // Devolver sólo la información mínima necesaria
    return NextResponse.json({
      success: true,
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre || '',
        email: cliente.email || cliente.contacto || '',
      },
    });
  } catch (error: any) {
    console.error('Error al obtener información del cliente:', error);
    
    // Devolver un error genérico para no exponer información sensible
    return NextResponse.json(
      { 
        success: false, 
        error: 'No se pudo encontrar el cliente solicitado' 
      },
      { status: 404 }
    );
  }
} 