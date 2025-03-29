import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

// Definir interfaz para Planner
interface Planner {
  id: string;
  username: string;
  email: string;
  rol: string;
  rolField?: string;
}

// Definir interfaz para User de PocketBase
interface PocketBaseUser {
  id: string;
  username: string;
  email: string;
  rol?: string;
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  try {
    // Usar directamente la URL proporcionada en la documentación
    const pocketbaseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase-ykw4ks40gswowocosk80k440.srv.clostech.tech';
    console.log('PocketBase URL a usar:', pocketbaseUrl);
    
    const pb = new PocketBase(pocketbaseUrl);
    
    // Obtener cookie de autenticación
    const authCookie = request.cookies.get('pb_auth');
    console.log('Cookie de autenticación presente:', !!authCookie);
    
    // Primero, intentemos autenticar con el token de administrador si está disponible
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
    if (adminToken) {
      console.log('Usando token de administrador');
      pb.authStore.save(adminToken, null);
    } else if (authCookie) {
      try {
        // Si no hay token admin, usar la cookie de autenticación
        console.log('Usando cookie de autenticación');
        pb.authStore.loadFromCookie(`pb_auth=${authCookie.value}`);
        
        // Verificar si la autenticación es válida
        console.log('Autenticación válida:', pb.authStore.isValid);
        if (!pb.authStore.isValid) {
          console.log('Sesión expirada o inválida');
          return NextResponse.json(
            { success: false, message: 'Sesión expirada o inválida' },
            { status: 401 }
          );
        }
      } catch (error) {
        console.error('Error al cargar autenticación desde cookie:', error);
        return NextResponse.json(
          { success: false, message: 'Error de autenticación' },
          { status: 401 }
        );
      }
    } else {
      // No hay autenticación disponible, intentar sin autenticación
      console.log('No hay autenticación disponible, intentando sin autenticación');
    }
    
    try {
      // Intentar obtener la lista completa de usuarios en lugar de usar paginación
      console.log('Obteniendo la lista completa de usuarios...');
      
      // Usar getFullList para obtener todos los registros
      const allUsers = await pb.collection('usuarios').getFullList({
        sort: 'username',
      });
      
      console.log(`Encontrados ${allUsers.length} usuarios en total`);
      
      if (allUsers.length === 0) {
        // Si no se encontraron usuarios, hay un problema con la conexión o permisos
        console.log('No se encontraron usuarios. Intentando con método alternativo...');
        
        // Intentar con un método más directo y sin filtros
        try {
          const response = await fetch(`${pocketbaseUrl}/api/collections/usuarios/records?perPage=100`, {
            headers: {
              'Authorization': pb.authStore.token ? `Bearer ${pb.authStore.token}` : '',
            }
          });
          
          if (!response.ok) {
            throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`);
          }
          
          const responseData = await response.json();
          console.log('Respuesta directa del API:', responseData);
          
          if (responseData.items && responseData.items.length > 0) {
            // Usar los datos de esta respuesta
            return NextResponse.json({
              success: true,
              planners: responseData.items.map((user: PocketBaseUser) => ({
                id: user.id,
                username: user.username,
                email: user.email,
                rol: user.rol || 'desconocido'
              })),
              message: "Usuarios obtenidos con método alternativo"
            });
          }
        } catch (fetchError) {
          console.error('Error al intentar método alternativo:', fetchError);
        }
        
        return NextResponse.json({
          success: false,
          message: "No se pudieron obtener los usuarios. Verifique los permisos y la conexión a PocketBase."
        }, { status: 500 });
      }
      
      // Analizar cada usuario y sus campos
      console.log('Analizando usuarios:');
      allUsers.forEach((user, index) => {
        console.log(`Usuario ${index + 1} (${user.id}):`);
        console.log('- username:', user.username);
        console.log('- email:', user.email);
        console.log('- rol:', user.rol);
        
        // Listar todas las propiedades del usuario para depuración
        console.log('- Todas las propiedades:');
        for (const key in user) {
          console.log(`  - ${key}: ${typeof user[key] === 'object' ? JSON.stringify(user[key]) : user[key]}`);
        }
      });
      
      // Intentar filtrar usuarios con rol "planner" (usando exactamente este valor)
      const planners: Planner[] = allUsers
        .filter(user => user.rol === 'planner')
        .map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          rol: user.rol,
          rolField: 'rol'
        }));
      
      console.log(`Encontrados ${planners.length} planners con rol exacto "planner"`);
      
      // Si no encontramos planners exactos, buscar con criterios más flexibles
      if (planners.length === 0) {
        console.log('No se encontraron planners exactos, buscando con criterios más flexibles');
        
        // Intentar obtener directamente los usuarios con rol planner usando el filtro de la API
        try {
          const plannersResponse = await pb.collection('usuarios').getFullList({
            filter: 'rol = "planner"',
          });
          
          console.log(`Filtro directo encontró ${plannersResponse.length} planners`);
          
          if (plannersResponse.length > 0) {
            return NextResponse.json({
              success: true,
              planners: plannersResponse.map(user => ({
                id: user.id,
                username: user.username,
                email: user.email,
                rol: user.rol
              }))
            });
          }
        } catch (filterError) {
          console.error('Error al usar filtro directo:', filterError);
        }
        
        // Buscar con criterios más flexibles
        const possiblePlanners: Planner[] = [];
        
        allUsers.forEach(user => {
          // Intentar diferentes variaciones del rol de "planner"
          if (
            (user.rol && typeof user.rol === 'string' && user.rol.toLowerCase().includes('planner')) ||
            (user.username && user.username.toLowerCase().includes('planner')) ||
            (user.email && user.email.toLowerCase().includes('planner'))
          ) {
            possiblePlanners.push({
              id: user.id,
              username: user.username,
              email: user.email,
              rol: user.rol || 'inferido',
            });
          }
        });
        
        if (possiblePlanners.length > 0) {
          console.log(`Encontrados ${possiblePlanners.length} posibles planners con criterios flexibles`);
          return NextResponse.json({
            success: true,
            planners: possiblePlanners,
            message: "No se encontraron planners exactos, mostrando usuarios similares"
          });
        }
        
        // Si aún no encontramos planners, devolver todos los usuarios
        console.log('No se encontraron planners, devolviendo todos los usuarios');
        return NextResponse.json({
          success: true,
          planners: allUsers.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            rol: user.rol || 'desconocido'
          })),
          message: "No se encontraron planners, mostrando todos los usuarios"
        });
      }
      
      // Si encontramos planners, devolverlos
      return NextResponse.json({
        success: true,
        planners: planners
      });
      
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      return NextResponse.json(
        { success: false, message: `Error al obtener usuarios: ${error}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error en el servidor:', error);
    return NextResponse.json(
      { success: false, message: `Error en el servidor: ${error}` },
      { status: 500 }
    );
  }
} 