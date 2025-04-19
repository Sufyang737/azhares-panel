"use client"

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { IconCalendarEvent, IconUsers, IconMapPin, IconCoin } from "@tabler/icons-react";
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import "react-big-calendar/lib/css/react-big-calendar.css";

import { EventsDataTable } from "@/components/events/events-data-table";
import { CreateEventDialog } from "@/components/events/create-event-dialog";
import { EventDetailsDialog } from "../../../components/events/event-details-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Configuración del localizador para el calendario
const locales = {
  'es': es,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Interfaz para la estructura de un evento
interface Evento {
  id: string;
  nombre: string;
  tipo: string;
  fecha: string;
  estado: string;
  comentario?: string;
  cliente?: {
    id: string;
    nombre: string;
    contacto?: string;
    email?: string;
  } | null;
  planner?: {
    id: string;
    nombre: string;
  } | null;
  created: string;
  updated: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Evento[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);

  // Cargar eventos desde el API
  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/eventos');
        const result = await response.json();
        if (result.success) {
          console.log("Datos recibidos de la API:", result.data);
          setEvents(result.data);
        }
      } catch (error) {
        console.error('Error al obtener eventos:', error);
      }
    }
    
    fetchEvents();
  }, [refreshTrigger]);

  // Función para refrescar los datos
  const handleEventCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Calculate summary statistics
  const totalEvents = events.length;
  const upcomingEvents = events.filter(event => event.estado === "en-curso").length;
  const uniqueClients = new Set(events.map(event => event.cliente?.id).filter(Boolean)).size;
  const locations = 1; // Placeholder

  // Convertir eventos para el calendario
  const calendarEvents = events.map(event => ({
    id: event.id,
    title: event.nombre,
    start: new Date(event.fecha),
    end: new Date(event.fecha),
    allDay: true,
    resource: event,
  }));

  // Manejador para cuando se hace clic en un evento
  const handleSelectEvent = (event: any) => {
    // El evento viene del calendario, necesitamos obtener el evento original
    const originalEvent = events.find(e => e.id === event.id);
    if (originalEvent) {
      setSelectedEvent(originalEvent);
    }
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
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
                      Event Locations
                    </CardTitle>
                    <IconMapPin className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {locations}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Unique locations
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-muted-foreground text-lg font-semibold">
                    Events Dashboard
                  </h2>
                  <CreateEventDialog onEventCreated={handleEventCreated} />
                </div>
              </div>
              <div className="px-4 lg:px-6">
                <Tabs defaultValue="calendar" className="w-full">
                  <TabsList>
                    <TabsTrigger value="calendar">Calendario</TabsTrigger>
                    <TabsTrigger value="table">Tabla</TabsTrigger>
                  </TabsList>
                  <TabsContent value="calendar" className="mt-4">
                    <div className="rounded-lg border bg-card">
                      <Calendar
                        localizer={localizer}
                        events={calendarEvents}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: 600 }}
                        culture='es'
                        messages={{
                          next: "Siguiente",
                          previous: "Anterior",
                          today: "Hoy",
                          month: "Mes",
                          week: "Semana",
                          day: "Día",
                          agenda: "Agenda",
                          date: "Fecha",
                          time: "Hora",
                          event: "Evento",
                          noEventsInRange: "No hay eventos en este rango",
                          showMore: (total) => `+ Ver ${total} más`,
                          allDay: "Todo el día"
                        }}
                        formats={{
                          monthHeaderFormat: 'MMMM yyyy',
                          dayHeaderFormat: 'dddd d [de] MMMM',
                          dayRangeHeaderFormat: ({ start, end }) =>
                            `${format(start, 'd [de] MMMM', { locale: es })} – ${format(end, 'd [de] MMMM', { locale: es })}`,
                          agendaHeaderFormat: ({ start, end }) =>
                            `${format(start, 'd [de] MMMM', { locale: es })} – ${format(end, 'd [de] MMMM', { locale: es })}`,
                        }}
                        views={['month', 'week', 'day', 'agenda']}
                        defaultView="month"
                        popup
                        onSelectEvent={handleSelectEvent}
                        eventPropGetter={(event) => ({
                          style: {
                            backgroundColor: event.resource?.estado === 'en-curso' ? '#22c55e' : '#64748b',
                            cursor: 'pointer'
                          },
                        })}
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="table">
                    <EventsDataTable data={events} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
          {/* Diálogo de detalles del evento */}
          <EventDetailsDialog
            event={selectedEvent}
            isOpen={!!selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onEventUpdated={handleEventCreated}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 