"use client"

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
  const [birthdays, setBirthdays] = useState<Array<{
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay: boolean;
    resource: {
      tipo: string;
      estado: string;
      persona: {
        id: string;
        nombre: string;
        apellido: string;
        cumpleanio: string;
      };
    };
  }>>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);

  // Cargar eventos desde el API
  useEffect(() => {
    async function fetchData() {
      try {
        // Obtener eventos
        const eventResponse = await fetch('/api/eventos');
        const eventResult = await eventResponse.json();
        if (eventResult.success) {
          console.log("Datos de eventos recibidos:", eventResult.data);
          setEvents(eventResult.data);
        }

        // Obtener personas para cumpleaños
        const personasResponse = await fetch('/api/personas');
        const personasResult = await personasResponse.json();
        if (personasResult.success) {
          console.log("Datos de personas recibidos:", personasResult.data);
          // Filtrar solo las personas con cumpleaños
          const birthdayEvents = personasResult.data
            .filter((persona: { cumpleanio: string | null }) => persona.cumpleanio)
            .map((persona: { 
              id: string; 
              nombre: string; 
              apellido: string; 
              cumpleanio: string 
            }) => {
              const birthDate = new Date(persona.cumpleanio);
              const currentYear = new Date().getFullYear();
              // Crear fecha del cumpleaños para este año
              const thisYearBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
              
              return {
                id: `birthday-${persona.id}`,
                title: `🎂 Cumpleaños de ${persona.nombre} ${persona.apellido}`,
                start: thisYearBirthday,
                end: thisYearBirthday,
                allDay: true,
                resource: {
                  tipo: 'cumpleaños',
                  estado: 'cumpleaños',
                  persona: persona
                }
              };
            });
          setBirthdays(birthdayEvents);
        }
      } catch (error) {
        console.error('Error al obtener datos:', error);
      }
    }
    
    fetchData();
  }, [refreshTrigger]);

  // Función para refrescar los datos
  const handleEventCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Convertir eventos para el calendario
  const calendarEvents = [
    ...events.map(event => ({
      id: event.id,
      title: event.nombre,
      start: new Date(event.fecha),
      end: new Date(event.fecha),
      allDay: true,
      resource: event,
    })),
    ...birthdays
  ];

  // Manejador para cuando se hace clic en un evento
  const handleSelectEvent = (event: { id: string; resource?: Evento }) => {
    // Solo mostrar detalles si no es un cumpleaños
    if (!event.id.startsWith('birthday-')) {
      const originalEvent = events.find(e => e.id === event.id);
      if (originalEvent) {
        setSelectedEvent(originalEvent);
      }
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <Tabs defaultValue="list" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="list">Lista</TabsTrigger>
                    <TabsTrigger value="calendar">Calendario</TabsTrigger>
                  </TabsList>
                  <TabsContent value="list" className="space-y-4">
                    <div className="flex justify-between">
                      <h2 className="text-2xl font-bold tracking-tight">Eventos</h2>
                      <CreateEventDialog onEventCreated={handleEventCreated} />
                    </div>
                    <EventsDataTable data={events} />
                  </TabsContent>
                  <TabsContent value="calendar" className="space-y-4">
                    <div className="flex justify-between">
                      <h2 className="text-2xl font-bold tracking-tight">Calendario</h2>
                      <CreateEventDialog onEventCreated={handleEventCreated} />
                    </div>
                    <div className="h-[600px]">
                      <Calendar
                        localizer={localizer}
                        events={calendarEvents}
                        startAccessor="start"
                        endAccessor="end"
                        culture="es"
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
                          noEventsInRange: "No hay eventos en este rango.",
                        }}
                        onSelectEvent={handleSelectEvent}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
      {selectedEvent && (
        <EventDetailsDialog
          event={selectedEvent}
          isOpen={true}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </SidebarProvider>
  );
} 


