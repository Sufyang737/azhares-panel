"use client"

import { useState, useEffect } from "react";
import { IconCalendarEvent, IconCoin, IconMapPin, IconUsers } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventsDataTable } from "@/components/events/events-data-table";
import { CreateEventDialog } from "@/components/events/create-event-dialog";
import { Spinner } from "@/components/ui/spinner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SidebarInset } from "@/components/ui/sidebar";

interface Evento {
  id?: string;
  nombre?: string;
  tipo?: string;
  fecha?: string;
  estado?: string;
  comentario?: string;
  lugar?: string;
  cliente?: {
    id?: string;
    nombre?: string;
  };
  planner?: {
    id?: string;
    nombre?: string;
  };
}

export default function EventsPage() {
  const [events, setEvents] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estadísticas
  const totalEvents = events.length;
  const upcomingEvents = events.filter(event => 
    event?.fecha ? new Date(event.fecha) > new Date() : false
  ).length;
  const uniqueClients = new Set(events.map(event => event?.cliente?.id).filter(Boolean)).size;
  const locations = new Set(events.map(event => event?.lugar).filter(Boolean)).size;

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/eventos");
      if (!response.ok) {
        throw new Error("Error al cargar los eventos");
      }
      const data = await response.json();
      
      // Verificar si la respuesta tiene la estructura esperada
      if (data && data.success && Array.isArray(data.data)) {
        setEvents(data.data);
      } else {
        console.error("Estructura de respuesta inesperada:", data);
        throw new Error("Estructura de respuesta inválida");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEventCreated = () => {
    fetchEvents();
  };

  return (
    <SidebarProvider>
      <SidebarInset>
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
                  Revenue
                </CardTitle>
                <IconCoin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-muted-foreground text-xs">
                  Not implemented
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Locations
                </CardTitle>
                <IconMapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{locations}</div>
                <p className="text-muted-foreground text-xs">
                  Unique locations
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="px-4 lg:px-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold tracking-tight">
                Events
              </h2>
              <CreateEventDialog onEventCreated={handleEventCreated} />
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
      </SidebarInset>
    </SidebarProvider>
  );
} 