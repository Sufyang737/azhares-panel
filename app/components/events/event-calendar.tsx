'use client';

import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventDetailsDialog } from "./event-details-dialog";
import { parseDateFromDb } from "@/lib/date";

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

interface Persona {
  id: string;
  nombre: string;
  apellido: string;
  cumpleanio: string;
}

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
}

type CalendarEventResource = Evento | {
  tipo?: string;
  estado?: string;
  persona?: Persona;
};

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: CalendarEventResource;
}

export function EventCalendar() {
  const [events, setEvents] = useState<Evento[]>([]);
  const [birthdays, setBirthdays] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);

  const fetchData = async () => {
    try {
      // Obtener eventos
      const eventResponse = await fetch('/api/eventos');
      const eventResult = await eventResponse.json();
      if (eventResult.success) {
        console.log("Datos de eventos recibidos:", eventResult.data);
        // Asegurarse de que cada evento tenga un tipo
        const eventsWithType = eventResult.data.map((eventData: Partial<Evento>) => ({
          ...eventData,
          tipo: eventData.tipo || 'evento'
        })) as Evento[];
        setEvents(eventsWithType);
      }

      // Obtener personas para cumpleaños
      const personasResponse = await fetch('/api/personas');
      const personasResult = await personasResponse.json();
      if (personasResult.success) {
        console.log("Datos de personas recibidos:", personasResult.data);
        // Filtrar solo las personas con cumpleaños
        const birthdayEvents = personasResult.data
          .filter((persona: Persona) => persona.cumpleanio)
          .map((persona: Persona) => {
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
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Convertir eventos para el calendario
  const calendarEvents: CalendarEvent[] = [
    ...events.flatMap((event) => {
      const eventDate = parseDateFromDb(event.fecha);
      if (!eventDate) return [];
      return [{
        id: event.id,
        title: event.nombre,
        start: eventDate,
        end: eventDate,
        allDay: true,
        resource: event,
      } satisfies CalendarEvent];
    }),
    ...birthdays
  ];

  // Manejador para cuando se hace clic en un evento
  const handleSelectEvent = (event: CalendarEvent) => {
    // Solo mostrar detalles si no es un cumpleaños
    if (!event.id.startsWith('birthday-')) {
      const originalEvent = events.find(e => e.id === event.id);
      if (originalEvent) {
        setSelectedEvent(originalEvent);
      }
    }
  };

  return (
    <>
      <Card className="col-span-7">
        <CardHeader>
          <CardTitle>Calendario de Eventos y Cumpleaños</CardTitle>
        </CardHeader>
        <CardContent>
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
                week: "Semana",
                date: "Fecha",
                time: "Hora",
                event: "Evento",
                noEventsInRange: "No hay eventos en este rango",
                showMore: (total) => `+ Ver ${total} más`,
                allDay: "Todo el día"
              }}
              formats={{
                dayFormat: 'dddd d',
                dayRangeHeaderFormat: ({ start, end }) =>
                  `${format(start, 'd [de] MMMM', { locale: es })} – ${format(end, 'd [de] MMMM', { locale: es })}`,
              }}
              views={['week']}
              defaultView="week"
              toolbar={true}
              popup
              onSelectEvent={handleSelectEvent}
              eventPropGetter={(event) => ({
                style: {
                  backgroundColor: event.resource?.tipo === 'cumpleaños' 
                    ? '#ec4899' // rosa para cumpleaños
                    : event.resource?.estado === 'en-curso' 
                      ? '#22c55e' 
                      : '#64748b',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  width: '100%'
                },
              })}
            />
          </div>
        </CardContent>
      </Card>
      {/* Diálogo de detalles del evento */}
      <EventDetailsDialog
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => {
          setSelectedEvent(null);
          fetchData();
        }}
      />
    </>
  );
} 
