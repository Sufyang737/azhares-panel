import { useState, useEffect } from "react";

interface RelatedItem {
  id: string;
  nombre: string;
  [key: string]: any;
}

function useRelatedData(endpoint: string) {
  const [data, setData] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/${endpoint}`);
        if (!response.ok) {
          throw new Error(`Error al obtener ${endpoint}: ${response.statusText}`);
        }
        const result = await response.json();
        
        // Manejar diferentes estructuras de respuesta
        let items: RelatedItem[] = [];
        if (result.data) {
          // Para endpoints que devuelven { data: [...] }
          items = result.data;
        } else if (result.success && result.clientes) {
          // Para el endpoint de clientes que devuelve { success: true, clientes: [...] }
          items = result.clientes;
        } else if (Array.isArray(result)) {
          // Para endpoints que devuelven directamente un array
          items = result;
        }
        
        setData(items);
      } catch (err) {
        console.error(`Error fetching ${endpoint}:`, err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint]);

  return { data, loading, error };
}

export function useClientes() {
  return useRelatedData('clientes');
}

export function useProveedores() {
  return useRelatedData('proveedores');
}

export function useEventos() {
  return useRelatedData('eventos');
}

export function useEquipos() {
  return useRelatedData('equipos');
} 