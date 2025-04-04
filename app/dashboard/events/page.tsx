"use client"

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconCalendarEvent, IconUsers, IconCalendarCheck, IconCalendarStats } from "@tabler/icons-react";
import { EventsDataTable, eventoSchema } from "@/components/events/events-data-table";
import { Spinner } from '@/components/ui/spinner';
import { z } from 'zod';
import Link from 'next/link';

// Schema para validar la respuesta de la API
const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(eventoSchema)
});

type Evento = z.infer<typeof eventoSchema>;

export default function EventsPage() {
  const [events, setEvents] = useState<Evento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Calcular estadísticas
  const totalEvents = events.length;
  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.fecha);
    const today = new Date();
    return eventDate > today;
  }).length;
  
  const pastEvents = events.filter(event => {
    const eventDate = new Date(event.fecha);
    const today = new Date();
    return eventDate <= today;
  }).length;
  
  // Calcular clientes únicos
  const uniqueClients = new Set(events.map(event => 
    event.cliente?.id
  ).filter(Boolean)).size;
  
  // Función para obtener eventos desde la API
  const fetchEvents = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/events');
      
      if (!response.ok) {
        throw new Error(`Error en la petición: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Datos recibidos de la API:", data);
      
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

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="grid gap-4 px-4 md:grid-cols-2 lg:grid-cols-4 lg:px-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Events
            </CardTitle>
            <IconCalendarEvent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents}</div>
            <p className="text-muted-foreground text-xs">
              {upcomingEvents} upcoming
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Clients
            </CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueClients}</div>
            <p className="text-muted-foreground text-xs">
              Across all events
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Events
            </CardTitle>
            <IconCalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents}</div>
            <p className="text-muted-foreground text-xs">
              Events scheduled in the future
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Past Events
            </CardTitle>
            <IconCalendarStats className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pastEvents}</div>
            <p className="text-muted-foreground text-xs">
              Completed events
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">
            Events Calendar
          </h2>
          <Button size="sm" className="h-8" asChild>
            <Link href="/dashboard/events/new">
              <IconCalendarEvent className="mr-2 h-4 w-4" />
              Add Event
            </Link>
          </Button>
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
          <EventsDataTable data={events} />
        )}
      </div>
    </div>
  );
} 