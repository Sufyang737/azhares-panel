import { useState, useEffect } from 'react';

interface DolarBlue {
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

export function useDolarBlue() {
  const [dolarBlue, setDolarBlue] = useState<DolarBlue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDolarBlue() {
      try {
        const response = await fetch('https://dolarapi.com/v1/dolares/blue');
        if (!response.ok) {
          throw new Error('Error al obtener la cotización del dólar blue');
        }
        const data = await response.json();
        setDolarBlue(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error('Error fetching dolar blue:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDolarBlue();
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchDolarBlue, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const convertToDolar = (pesosAmount: number) => {
    if (!dolarBlue) return null;
    return pesosAmount / dolarBlue.venta;
  };

  return {
    dolarBlue,
    loading,
    error,
    convertToDolar,
  };
} 