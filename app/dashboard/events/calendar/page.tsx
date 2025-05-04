"use client"

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { IconArrowLeft } from "@tabler/icons-react";
import { CalendarView } from "@/components/events/calendar-view";
import { Spinner } from '@/components/ui/spinner';
import { z } from 'zod';
import Link from 'next/link';
import { eventoSchema } from '@/components/events/events-data-table';

// Schema para validar la respuesta de la API
const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(eventoSchema)
});

type Evento = z.infer<typeof eventoSchema>;

export default function EventsCalendarPage() {
  const [events, setEvents] = useState<Evento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener eventos desde la API
  const fetchEvents = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/eventos');
      
      if (!response.ok) {
        throw new Error(`Error en la petición: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Validar respuesta con Zod
      const validatedData = apiResponseSchema.parse(data);
      setEvents(validatedData.data);
      
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Transformar eventos para el calendario
  const calendarEvents = events.map(event => ({
    id: event.id,
    title: event.nombre,
    start: event.fecha,
    end: event.fecha,
    extendedProps: {
      cliente: event.cliente,
      tipo: event.tipo,
      estado: event.estado
    }
  }));

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/events">
                <IconArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <h2 className="text-3xl font-bold tracking-tight">
              Events Calendar
            </h2>
          </div>
        </div>
      </div>
      <div className="px-4 lg:px-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
            <p className="text-destructive">Error: {error}</p>
            <Button 
              variant="outline"
              className="mt-4" 
              onClick={() => fetchEvents()}
            >
              Retry
            </Button>
          </div>
        ) : (
          <CalendarView events={calendarEvents} />
        )}
      </div>
    </div>
  );
} 