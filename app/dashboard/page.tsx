"use client";

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconArrowUpRight, IconArrowDownRight, IconUsers, IconCoin, IconChartBar, IconCalendarEvent, IconUserCircle, IconBuildingStore, IconTruck, IconCashBanknote, IconReceipt, IconClock } from "@tabler/icons-react";
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isThisMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import "react-big-calendar/lib/css/react-big-calendar.css";
import { EventDetailsDialog } from "@/components/events/event-details-dialog";
import Link from "next/link";
import { getContabilidadRecords } from "@/app/services/contabilidad";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import data from "./data.json";

// Importar los componentes necesarios de la página de contabilidad
import { AccountingSectionCards } from "@/app/dashboard/contabilidad/components/section-cards";
import { ScheduledRecordsDialog } from "@/app/dashboard/contabilidad/components/scheduled-records-dialog";
import { DailyCashDialog } from "@/app/dashboard/contabilidad/components/daily-cash-dialog";
import { EventReportDialog } from "@/app/dashboard/contabilidad/components/event-report-dialog";
import { MonthlyReportDialog } from "@/app/dashboard/contabilidad/components/monthly-report-dialog";
import { CreateRecordDialog } from "@/app/dashboard/contabilidad/components/create-record-dialog";

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

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Buenos días";
  if (hour >= 12 && hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

// Componente para las métricas de negocio
function BusinessMetrics() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Revenue
          </CardTitle>
          <IconCoin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">$1,250.00</div>
          <div className="flex items-center text-sm text-green-500">
            <IconArrowUpRight className="mr-1 h-4 w-4" />
            +12.5%
          </div>
          <p className="text-xs text-muted-foreground">
            Trending up this month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            New Customers
          </CardTitle>
          <IconUsers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">1,234</div>
          <div className="flex items-center text-sm text-red-500">
            <IconArrowDownRight className="mr-1 h-4 w-4" />
            -20%
          </div>
          <p className="text-xs text-muted-foreground">
            Acquisition needs attention
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Active Accounts
          </CardTitle>
          <IconUsers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">45,678</div>
          <div className="flex items-center text-sm text-green-500">
            <IconArrowUpRight className="mr-1 h-4 w-4" />
            +12.5%
          </div>
          <p className="text-xs text-muted-foreground">
            Strong user retention
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Growth Rate
          </CardTitle>
          <IconChartBar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">4.5%</div>
          <div className="flex items-center text-sm text-green-500">
            <IconArrowUpRight className="mr-1 h-4 w-4" />
            +4.5%
          </div>
          <p className="text-xs text-muted-foreground">
            Meets growth projections
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Interfaces para tipado
interface Persona {
  id: string;
  nombre: string;
  apellido: string;
  cumpleanio: string;
}

interface Evento {
  id: string;
  nombre: string;
  fecha: string;
  estado: string;
  tipo: string;
  comentario?: string;
  cliente?: {
    id: string;
    nombre: string;
    contacto?: string;
    email?: string;
  };
  planner?: {
    id: string;
    nombre: string;
  };
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: {
    tipo?: string;
    estado?: string;
    persona?: Persona;
  };
}

// Componente para el calendario de eventos
function EventCalendar() {
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
        onClose={() => setSelectedEvent(null)}
        onEventUpdated={() => {
          setSelectedEvent(null);
          fetchData();
        }}
      />
    </>
  );
}

// Definir la interfaz para los registros contables
interface RegistroContable {
  id: string;
  type: 'cobro' | 'pago';
  montoEspera: number;
  fechaEspera: string;
  comentario?: string;
  esEsperado: boolean;
  created: string;
  updated: string;
  especie: string;
  moneda: string;
  categoria: string;
  cliente_id?: string;
  proveedor_id?: string;
  evento_id?: string;
  equipo_id?: string;
  monto?: number;
  fecha?: string;
  estado?: string;
  expand?: {
    cliente_id?: {
      id: string;
      nombre: string;
    };
    proveedor_id?: {
      id: string;
      nombre: string;
    };
    evento_id?: {
      id: string;
      nombre: string;
    };
    equipo_id?: {
      id: string;
      nombre: string;
    };
  };
}

// Componente para el panel de contabilidad
function ContabilidadPanel() {
  const [records, setRecords] = useState<RegistroContable[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await getContabilidadRecords({
        sort: '-created',
        expand: 'cliente_id,proveedor_id,evento_id,equipo_id'
      });
      setRecords(data?.items || []);
    } catch (error) {
      console.error("Error loading records:", error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  return (
    <>
      {/* Métricas principales */}
      <div className="col-span-7">
        <AccountingSectionCards records={records} />
      </div>

      {/* Gráfico de área */}
      <Card className="col-span-7">
        <CardHeader>
          <CardTitle>Movimientos del Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartAreaInteractive records={records} />
        </CardContent>
      </Card>
    </>
  );
}

// Componente para el panel de desarrollador
function DevPanel() {
  return (
    <Card className="col-span-7">
      <CardHeader>
        <CardTitle>Panel de Desarrollo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Estado del Sistema</h3>
            <DataTable data={data} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para los accesos directos
function QuickAccess({ rol }: { rol: string }) {
  if (rol === 'contabilidad') {
    return null; // No mostrar accesos rápidos para contabilidad
  }

  // Para el rol de planner y otros roles
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Link href="/dashboard/events">
        <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Eventos
            </CardTitle>
            <IconCalendarEvent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Gestionar</div>
            <p className="text-xs text-muted-foreground">
              Gestionar eventos
            </p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/dashboard/people">
        <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Personas
            </CardTitle>
            <IconUserCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Gestionar</div>
            <p className="text-xs text-muted-foreground">
              Gestionar personas
            </p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/dashboard/clients">
        <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clientes
            </CardTitle>
            <IconBuildingStore className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Gestionar</div>
            <p className="text-xs text-muted-foreground">
              Gestionar clientes
            </p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/dashboard/providers">
        <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Proveedores
            </CardTitle>
            <IconTruck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Gestionar</div>
            <p className="text-xs text-muted-foreground">
              Gestionar proveedores
            </p>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

export default function Page() {
  const { user } = useAuth();
  const rol = user?.rol || 'planner';

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
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold">
                  Bienvenido, {user?.username || 'Usuario'}
                </h1>
                <p className="text-muted-foreground">
                  Aquí tienes un resumen de tu actividad
                </p>
              </div>

              <QuickAccess rol={rol} />

              {rol === 'contabilidad' ? (
                <ContabilidadPanel />
              ) : rol === 'planner' ? (
                <EventCalendar />
              ) : null}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
