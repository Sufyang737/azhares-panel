import { NextResponse } from "next/server"
import PocketBase from "pocketbase"

// Categorías por defecto para usar si hay errores al obtener las reales
const CATEGORIAS_POR_DEFECTO = ["Mercería", "Telas", "Accesorios", "Botones", "Herrajes", "Cierres", "Hilos"];

// Handler para GET (obtener categorías únicas)
export async function GET() {
  try {
    // Inicialización de PocketBase usando la variable de entorno
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
    console.log("Obteniendo categorías desde:", process.env.NEXT_PUBLIC_POCKETBASE_URL);
    
    // Autenticar como administrador usando el token
    let autenticado = false;
    try {
      const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
      if (!adminToken) {
        console.warn('Token de administrador no configurado, usando categorías por defecto');
        return NextResponse.json({ 
          success: true, 
          data: CATEGORIAS_POR_DEFECTO
        });
      } else {
        pb.authStore.save(adminToken, null);
        console.log('Autenticación con token exitosa');
        autenticado = true;
      }
    } catch (authError) {
      console.error('GET Categorías - Error de autenticación:', authError);
      console.warn('Usando categorías por defecto');
      return NextResponse.json({ 
        success: true, 
        data: CATEGORIAS_POR_DEFECTO
      });
    }
    
    // Si no estamos autenticados, devolver categorías por defecto
    if (!autenticado) {
      return NextResponse.json({ 
        success: true, 
        data: CATEGORIAS_POR_DEFECTO
      });
    }
    
    // Obtener todos los proveedores y extraer sus categorías
    let proveedores;
    try {
      // Intentamos obtener la lista si estamos autenticados
      proveedores = await pb.collection('proveedores').getList(1, 100, {
        sort: '-created',
      });
      console.log(`Obtenidos ${proveedores.items.length} proveedores para extraer categorías`);
    } catch (fetchError) {
      console.error('Error al obtener proveedores:', fetchError);
      // Si no podemos obtener la lista, devolvemos categorías por defecto
      return NextResponse.json({ 
        success: true, 
        data: CATEGORIAS_POR_DEFECTO
      });
    }
    
    // Extraer las categorías únicas y validar que no sean valores vacíos
    const categoriasSet = new Set<string>();
    
    // Añadir las categorías por defecto para asegurar que siempre haya opciones
    CATEGORIAS_POR_DEFECTO.forEach(cat => categoriasSet.add(cat));
    
    // Añadir las categorías existentes en la base de datos
    proveedores.items.forEach(proveedor => {
      if (proveedor.categoria && typeof proveedor.categoria === 'string' && proveedor.categoria.trim() !== '') {
        categoriasSet.add(proveedor.categoria.trim());
      }
    });
    
    // Convertir el Set a un array y ordenar alfabéticamente
    const categorias = Array.from(categoriasSet).sort();
    console.log(`Categorías encontradas: ${categorias.length}`, categorias);
    
    return NextResponse.json({ 
      success: true, 
      data: categorias
    });
  } catch (error) {
    console.error('GET Categorías - Error general:', error);
    // En caso de error, devolvemos categorías por defecto
    return NextResponse.json(
      { success: true, error: 'Error al obtener las categorías, usando lista por defecto', data: CATEGORIAS_POR_DEFECTO },
      { status: 200 }
    );
  }
} 