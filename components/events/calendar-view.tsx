import { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import { Card } from '@/components/ui/card'
import { useTheme } from 'next-themes'
import esLocale from '@fullcalendar/core/locales/es'
import { Button } from '../ui/button'
import { IconCalendarEvent, IconList } from '@tabler/icons-react'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end?: string
  allDay?: boolean
  backgroundColor?: string
  borderColor?: string
  url?: string
  extendedProps?: {
    cliente?: {
      id?: string
      nombre?: string
    }
    tipo?: string
    estado?: string
  }
}

interface CalendarViewProps {
  events: CalendarEvent[]
  isLoading?: boolean
}

export function CalendarView({ events, isLoading }: CalendarViewProps) {
  const { theme } = useTheme()
  const [view, setView] = useState<'dayGridMonth' | 'listWeek'>('dayGridMonth')

  // Función para obtener el color según el tipo de evento
  const getEventColor = (tipo: string) => {
    switch (tipo?.toLowerCase()) {
      case 'boda':
        return '#e11d48' // rose-600
      case 'corporativo':
        return '#0284c7' // sky-600
      case 'social':
        return '#7c3aed' // violet-600
      case 'otro':
        return '#059669' // emerald-600
      default:
        return '#6b7280' // gray-500
    }
  }

  // Transformar los eventos al formato que espera FullCalendar
  const calendarEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: true,
    backgroundColor: getEventColor(event.extendedProps?.tipo || ''),
    borderColor: getEventColor(event.extendedProps?.tipo || ''),
    extendedProps: event.extendedProps,
    url: `/dashboard/events/${event.id}`
  }))

  return (
    <Card className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <div className="space-x-2">
          <Button
            variant={view === 'dayGridMonth' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('dayGridMonth')}
          >
            <IconCalendarEvent className="h-4 w-4 mr-2" />
            Mes
          </Button>
          <Button
            variant={view === 'listWeek' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('listWeek')}
          >
            <IconList className="h-4 w-4 mr-2" />
            Lista
          </Button>
        </div>
      </div>
      
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView={view}
        locale={esLocale}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: ''
        }}
        events={calendarEvents}
        eventContent={(eventInfo) => {
          return (
            <div className="flex flex-col p-1">
              <div className="font-semibold">{eventInfo.event.title}</div>
              {eventInfo.event.extendedProps.cliente && (
                <div className="text-xs opacity-75">
                  {eventInfo.event.extendedProps.cliente.nombre}
                </div>
              )}
            </div>
          )
        }}
        height="auto"
        aspectRatio={1.8}
        firstDay={1}
        themeSystem={theme === 'dark' ? 'darkly' : 'standard'}
      />
    </Card>
  )
} 