"use client"

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isWithinInterval, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Button } from "@/components/ui/button";

import { EventsDataTable } from "@/components/events/events-data-table";
import { CreateEventDialog } from "@/components/events/create-event-dialog";
import { EventDetailsDialog } from "@/components/events/event-details-dialog";
import { EventFilters } from "@/components/events/events-filters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconSearch } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Configuración del localizador para el calendario
const locales = {
  'es': es,
}

const messages = {
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
  allDay: "Todo el día",
  work_week: "Semana laboral",
  yesterday: "Ayer",
  tomorrow: "Mañana",
  noEventsInRange: "No hay eventos en este rango",
  showMore: (total: number) => `+ Ver ${total} más`,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => 1,
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

// Definir la interfaz para los eventos del calendario
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: {
    tipo?: string;
    estado?: string;
  };
}

// Interfaz para la barra de herramientas
interface ToolbarProps {
  date: Date;
  view: string;
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
  onView: (view: string) => void;
}

// Componente personalizado para la barra de herramientas
const CustomToolbar = ({ date, view, onNavigate, onView }: ToolbarProps) => {
  const goToBack = () => {
    onNavigate('PREV');
  };

  const goToNext = () => {
    onNavigate('NEXT');
  };

  const goToCurrent = () => {
    onNavigate('TODAY');
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={goToBack}>
          Anterior
        </Button>
        <Button variant="outline" size="sm" onClick={goToCurrent}>
          Hoy
        </Button>
        <Button variant="outline" size="sm" onClick={goToNext}>
          Siguiente
        </Button>
      </div>
      <h2 className="text-lg font-semibold">
        {format(date, 'MMMM yyyy', { locale: es })}
      </h2>
      <div className="flex gap-2">
        <Button
          variant={view === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onView('month')}
        >
          Mes
        </Button>
        <Button
          variant={view === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onView('week')}
        >
          Semana
        </Button>
        <Button
          variant={view === 'day' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onView('day')}
        >
          Día
        </Button>
        <Button
          variant={view === 'agenda' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onView('agenda')}
        >
          Agenda
        </Button>
      </div>
    </div>
  );
};

export default function EventsPage() {
  const [events, setEvents] = useState<Evento[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Evento[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Evento | 'cliente.nombre';
    direction: 'asc' | 'desc';
  }>({
    key: 'fecha',
    direction: 'desc'
  });
  const [filterEstado, setFilterEstado] = useState<string>('todos');
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
          console.log("Datos de eventos recibidos:", eventResult.eventos);
          setEvents(eventResult.eventos || []);
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

  // Función mejorada para manejar los filtros
  const handleFiltersChange = ({
    startDate,
    endDate,
    eventType
  }: {
    startDate: Date | undefined;
    endDate: Date | undefined;
    eventType: string;
  }) => {
    let filtered = [...events];

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(event => 
        String(event.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(event.cliente?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(event.planner?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(event.comentario || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por fechas
    if (startDate && endDate) {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.fecha);
        return isWithinInterval(eventDate, { start: startDate, end: endDate });
      });
    }

    // Filtrar por tipo de evento
    if (eventType && eventType !== "todos") {
      filtered = filtered.filter(event => event.tipo.toLowerCase() === eventType.toLowerCase());
    }

    // Filtrar por estado
    if (filterEstado !== 'todos') {
      filtered = filtered.filter(event => event.estado.toLowerCase() === filterEstado.toLowerCase());
    }

    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof Evento];
      let bValue: any = b[sortConfig.key as keyof Evento];

      // Manejar ordenamiento especial para nombre del cliente
      if (sortConfig.key === 'cliente.nombre') {
        aValue = a.cliente?.nombre || '';
        bValue = b.cliente?.nombre || '';
      }

      // Manejar ordenamiento de fechas
      if (sortConfig.key === 'fecha' || sortConfig.key === 'created' || sortConfig.key === 'updated') {
        aValue = new Date(aValue || '').getTime();
        bValue = new Date(bValue || '').getTime();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredEvents(filtered);
  };

  // Efecto para actualizar filtros cuando cambia la búsqueda o el ordenamiento
  useEffect(() => {
    handleFiltersChange({
      startDate: undefined,
      endDate: undefined,
      eventType: 'todos'
    });
  }, [searchTerm, sortConfig, filterEstado, events]);

  // Actualizar eventos filtrados cuando cambian los eventos
  useEffect(() => {
    setFilteredEvents(events);
  }, [events]);

  // Convertir eventos para el calendario
  const calendarEvents = [
    ...(events || []).map(event => ({
      id: event.id,
      title: `${event.nombre} ${event.cliente?.nombre ? `- ${event.cliente.nombre}` : ''}`,
      start: new Date(event.fecha),
      end: new Date(event.fecha),
      allDay: true,
      resource: {
        ...event,
        tipo: event.tipo,
        estado: event.estado
      },
    })),
    ...birthdays
  ];

  // Personalizar el estilo de los eventos según su tipo y estado
  const eventStyleGetter = (event: CalendarEvent) => {
    // Si es un cumpleaños
    if (event.id.startsWith('birthday-')) {
      return {
    style: {
          backgroundColor: '#FFB6C1',
          color: '#000000',
          border: 'none',
          borderRadius: '4px',
          fontSize: '0.9em'
        }
      };
    }

    // Para eventos regulares, color según estado
    let backgroundColor = '#3B82F6'; // Azul por defecto
    
    switch (event.resource?.estado?.toLowerCase()) {
      case 'pendiente':
        backgroundColor = '#FFA500'; // Naranja
        break;
      case 'confirmado':
        backgroundColor = '#10B981'; // Verde
        break;
      case 'cancelado':
        backgroundColor = '#EF4444'; // Rojo
        break;
      case 'completado':
        backgroundColor = '#8B5CF6'; // Violeta
        break;
    }

    return {
      style: {
        backgroundColor,
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '0.9em'
    }
    };
  };

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
            <div className="flex flex-col gap-4 p-3 sm:p-4 md:gap-6 md:p-6">
              <div className="px-2 sm:px-4 lg:px-6">
                <Tabs defaultValue="list" className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-4">
                    <TabsList className="w-full sm:w-auto">
                      <TabsTrigger value="list" className="flex-1 sm:flex-none">Lista</TabsTrigger>
                      <TabsTrigger value="calendar" className="flex-1 sm:flex-none">Calendario</TabsTrigger>
                  </TabsList>
                  </div>

                  <TabsContent value="list" className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                      <h2 className="text-2xl font-bold tracking-tight">Eventos</h2>
                      <CreateEventDialog onEventCreated={handleEventCreated} />
                    </div>
                    
                    {/* Barra de búsqueda y filtros */}
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <div className="relative">
                            <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Buscar eventos..."
                              className="pl-8 w-full"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                          <Select
                            value={filterEstado}
                            onValueChange={setFilterEstado}
                          >
                            <SelectTrigger className="w-full sm:w-[180px]">
                              <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todos">Todos los estados</SelectItem>
                              <SelectItem value="pendiente">Pendiente</SelectItem>
                              <SelectItem value="confirmado">Confirmado</SelectItem>
                              <SelectItem value="cancelado">Cancelado</SelectItem>
                              <SelectItem value="completado">Completado</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={`${sortConfig.key}-${sortConfig.direction}`}
                            onValueChange={(value) => {
                              const [key, direction] = value.split('-');
                              setSortConfig({
                                key: key as keyof Evento | 'cliente.nombre',
                                direction: direction as 'asc' | 'desc'
                              });
                            }}
                          >
                            <SelectTrigger className="w-full sm:w-[200px]">
                              <SelectValue placeholder="Ordenar por" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fecha-desc">Fecha (más reciente)</SelectItem>
                              <SelectItem value="fecha-asc">Fecha (más antigua)</SelectItem>
                              <SelectItem value="nombre-asc">Nombre (A-Z)</SelectItem>
                              <SelectItem value="nombre-desc">Nombre (Z-A)</SelectItem>
                              <SelectItem value="cliente.nombre-asc">Cliente (A-Z)</SelectItem>
                              <SelectItem value="cliente.nombre-desc">Cliente (Z-A)</SelectItem>
                              <SelectItem value="created-desc">Creación (más reciente)</SelectItem>
                              <SelectItem value="created-asc">Creación (más antigua)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="w-full overflow-x-auto">
                    <EventFilters onFiltersChange={handleFiltersChange} />
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                    <EventsDataTable data={filteredEvents} />
                    </div>
                  </TabsContent>

                  <TabsContent value="calendar" className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                      <h2 className="text-2xl font-bold tracking-tight">Calendario</h2>
                      <CreateEventDialog onEventCreated={handleEventCreated} />
                    </div>
                    <div className="w-full overflow-x-auto">
                    <EventFilters onFiltersChange={handleFiltersChange} />
                    </div>
                    <div className="h-[600px] bg-white rounded-lg border p-4">
                      <Calendar
                        localizer={localizer}
                        events={calendarEvents}
                        startAccessor="start"
                        endAccessor="end"
                        messages={messages}
                        culture='es'
                        onSelectEvent={handleSelectEvent}
                        style={{ 
                          height: '100%',
                          fontFamily: 'inherit',
                        }}
                        views={['month', 'week', 'day', 'agenda']}
                        defaultView="month"
                        tooltipAccessor={event => 
                          `${event.title}${event.resource?.tipo ? `\nTipo: ${event.resource.tipo}` : ''}${event.resource?.estado ? `\nEstado: ${event.resource.estado}` : ''}`
                        }
                        eventPropGetter={eventStyleGetter}
                        dayPropGetter={(date) => ({
                          style: {
                            backgroundColor: 'white',
                            padding: '0.5rem',
                          },
                        })}
                        components={{
                          toolbar: CustomToolbar,
                          month: {
                            dateHeader: ({ date, label }) => (
                              <div className="text-sm font-medium">
                                {format(date, 'd')}
                              </div>
                            )
                          }
                        }}
                        formats={{
                          monthHeaderFormat: (date: Date) => format(date, 'MMMM yyyy', { locale: es }),
                          dayHeaderFormat: (date: Date) => format(date, 'EEEE d', { locale: es }),
                          dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) => 
                            `${format(start, 'd MMM', { locale: es })} - ${format(end, 'd MMM', { locale: es })}`,
                        }}
                        className="custom-calendar"
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
          onEventUpdated={handleEventCreated}
        />
      )}
    </SidebarProvider>
  );
} 

// Agregar estos estilos globales en tu archivo CSS global
const styles = `
.custom-calendar {
  .rbc-calendar {
    min-height: 580px;
  }
  
  .rbc-header {
    padding: 8px;
    font-weight: 600;
    text-transform: capitalize;
  }
  
  .rbc-date-cell {
    padding: 4px;
    text-align: center;
    font-weight: 500;
  }
  
  .rbc-off-range-bg {
    background-color: #f9fafb;
  }
  
  .rbc-today {
    background-color: #e5edff !important;
  }
  
  .rbc-button-link {
    padding: 4px;
    font-weight: 500;
  }
  
  .rbc-show-more {
    color: #3b82f6;
    font-weight: 500;
  }
  
  .rbc-event {
    padding: 2px 4px;
    border-radius: 4px;
    font-size: 0.875rem;
  }
}
`; 


