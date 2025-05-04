import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

export async function POST(request: Request) {
  try {
    // Obtener los datos del formulario
    const data = await request.json();
    
    console.log('Datos recibidos en API:', data);

    // Validar datos mínimos requeridos
    if (!data.nombre || !data.apellido || !data.telefono || !data.email) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Faltan campos obligatorios' 
        },
        { status: 400 }
      );
    }

    // Validar que se incluya el ID del cliente
    if (!data.cliente_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID de cliente no proporcionado' 
        },
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
      console.warn('API Formulario Persona - POCKETBASE_ADMIN_TOKEN no configurado');
    }

    // Preparar los datos a guardar (asegurarse que cumpla con el esquema)
    const record = {
      nombre: data.nombre.trim(),
      apellido: data.apellido.trim(),
      telefono: parseInt(data.telefono.toString().replace(/\D/g, '')),
      email: data.email.trim(),
      cumpleanio: data.cumpleanio || null,
      pais: data.pais || '',
      ciudad: data.ciudad || '',
      instagram: data.instagram ? `https://instagram.com/${data.instagram.replace(/^@/, '')}` : '',
      direccion: data.direccion || '',
      comentario: data.comentario || '',
      cliente_id: data.cliente_id
    };

    console.log('Datos a enviar a PocketBase:', record);

    try {
      // Crear el registro en la colección "personas"
      const persona = await pb.collection('personas').create(record);
      console.log('Persona creada:', persona);

      try {
        // Obtener el cliente actual para verificar sus personas relacionadas
        const cliente = await pb.collection('cliente').getOne(data.cliente_id);
        
        // Comprobar si el cliente ya tiene personas_id definido
        let personasIds = cliente.persona_id || [];
        
        // Asegurarnos de que personasIds sea un array
        if (!Array.isArray(personasIds)) {
          personasIds = [];
        }
        
        // Añadir el ID de la nueva persona al array, evitando duplicados
        if (!personasIds.includes(persona.id)) {
          personasIds.push(persona.id);
        }
        
        // Actualizar el cliente con la nueva relación
        await pb.collection('cliente').update(data.cliente_id, {
          persona_id: personasIds
        });
        
        console.log(`Relación actualizada: Cliente ${data.cliente_id} ahora tiene ${personasIds.length} personas asociadas`);
      } catch (error) {
        console.error('Error al actualizar la relación con el cliente:', error);
        // No fallaremos el proceso completo si solo falla la actualización de la relación
      }

      // Responder con éxito
      return NextResponse.json({
        success: true,
        mensaje: 'Información guardada correctamente',
        persona: {
          id: persona.id
        }
      });
    } catch (pocketbaseError: any) {
      console.error('Error específico de PocketBase:', pocketbaseError);
      
      // Intentar extraer el mensaje de error detallado
      const errorMessage = pocketbaseError.response?.data?.message || 
                         pocketbaseError.message || 
                         'Error al crear el registro';
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          details: pocketbaseError.response?.data
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error al guardar datos de persona:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error al guardar la información',
        details: error.response?.data
      },
      { status: 500 }
    );
  }
} 