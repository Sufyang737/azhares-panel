import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

// Agregar las opciones de relación
const RELACIONES = [
  { value: "hijo", label: "Hijo/a" },
  { value: "hermano", label: "Hermano/a" },
  { value: "esposo", label: "Esposo" },
  { value: "esposa", label: "Esposa" },
  { value: "padre", label: "Padre" },
  { value: "madre", label: "Madre" },
  { value: "primo", label: "Primo/a" },
  { value: "tio", label: "Tío/a" },
  { value: "sobrino", label: "Sobrino/a" },
  { value: "abuelo", label: "Abuelo/a" },
  { value: "nieto", label: "Nieto/a" },
  { value: "amigo", label: "Amigo/a" },
  { value: "otro", label: "Otro" }
];

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

    // Array para almacenar todos los IDs de personas creadas
    let personasIds = [];

    // Preparar los datos de la persona principal
    const mainRecord = {
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
      cliente_id: data.cliente_id,
      es_principal: true
    };

    try {
      // Crear el registro de la persona principal
      const personaPrincipal = await pb.collection('personas').create(mainRecord);
      console.log('Persona principal creada:', personaPrincipal);
      personasIds.push(personaPrincipal.id);

      // Procesar personas adicionales si existen
      if (data.personasAdicionales && Array.isArray(data.personasAdicionales)) {
        for (const persona of data.personasAdicionales) {
          if (persona.nombre && persona.apellido && persona.telefono && persona.email) {
            // Procesar la fecha de cumpleaños
            let cumpleanio = null;
            if (persona.cumpleanio?.mes && persona.cumpleanio?.dia) {
              const currentYear = new Date().getFullYear();
              cumpleanio = new Date(currentYear, parseInt(persona.cumpleanio.mes) - 1, parseInt(persona.cumpleanio.dia));
            }

            // Obtener el label de la relación
            const relacionLabel = RELACIONES.find(r => r.value === persona.relacion)?.label || persona.relacion;

            const personaRecord = {
              nombre: persona.nombre.trim(),
              apellido: persona.apellido.trim(),
              telefono: parseInt(persona.telefono.toString().replace(/\D/g, '')),
              email: persona.email.trim(),
              cumpleanio: cumpleanio ? cumpleanio.toISOString() : null,
              pais: persona.pais || '',
              ciudad: persona.ciudad || '',
              instagram: persona.instagram ? `https://instagram.com/${persona.instagram.replace(/^@/, '')}` : '',
              direccion: persona.direccion || '',
              comentario: `Relación: ${relacionLabel}`,
              cliente_id: data.cliente_id,
              es_principal: false,
              relacion: persona.relacion || ''
            };

            const personaAdicional = await pb.collection('personas').create(personaRecord);
            console.log('Persona adicional creada:', personaAdicional);
            personasIds.push(personaAdicional.id);
          }
        }
      }

      try {
        // Obtener el cliente actual para actualizar sus personas relacionadas
        const cliente = await pb.collection('cliente').getOne(data.cliente_id);
        
        // Comprobar si el cliente ya tiene personas_id definido
        let existingPersonasIds = cliente.persona_id || [];
        
        // Asegurarnos de que existingPersonasIds sea un array
        if (!Array.isArray(existingPersonasIds)) {
          existingPersonasIds = [];
        }
        
        // Combinar los IDs existentes con los nuevos, evitando duplicados
        const allPersonasIds = [...new Set([...existingPersonasIds, ...personasIds])];
        
        // Actualizar el cliente con todas las relaciones
        await pb.collection('cliente').update(data.cliente_id, {
          persona_id: allPersonasIds
        });
        
        console.log(`Relación actualizada: Cliente ${data.cliente_id} ahora tiene ${allPersonasIds.length} personas asociadas`);
      } catch (error) {
        console.error('Error al actualizar la relación con el cliente:', error);
      }

      // Responder con éxito
      return NextResponse.json({
        success: true,
        mensaje: 'Información guardada correctamente',
        personas: personasIds
      });
    } catch (pocketbaseError: any) {
      console.error('Error específico de PocketBase:', pocketbaseError);
      
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