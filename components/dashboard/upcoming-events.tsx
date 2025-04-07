import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconCalendarEvent } from "@tabler/icons-react"
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Spinner } from '../ui/spinner'
import { Badge } from '../ui/badge'
import Link from 'next/link'

interface Event {
  id: string
  nombre: string
  fecha: string
  tipo: string
  estado: string
  cliente_id: string
  expand?: {
    cliente_id?: {
      id: string
      nombre: string
    }
  }
}

export function UpcomingEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        const response = await fetch(`/api/events?limit=5&sort=fecha&filter=fecha>="${today}"&expand=cliente_id`)
        
        if (!response.ok) {
          throw new Error('Error al obtener los eventos')
        }

        const data = await response.json()
        
        if (data.success && data.events) {
          setEvents(data.events)
        } else {
          setError('No se pudieron cargar los eventos')
        }
      } catch (error) {
        console.error('Error fetching events:', error)
        setError('Error al cargar los eventos')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const getEventTypeColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'boda':
        return 'bg-rose-500'
      case 'corporativo':
        return 'bg-sky-500'
      case 'social':
        return 'bg-violet-500'
      default:
        return 'bg-emerald-500'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Próximos Eventos</CardTitle>
          <IconCalendarEvent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex justify-center py-4">
          <Spinner />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Próximos Eventos</CardTitle>
          <IconCalendarEvent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Próximos Eventos</CardTitle>
        <IconCalendarEvent className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {events.length > 0 ? (
          <div className="space-y-4">
            {events.map(event => (
              <div key={event.id} className="flex items-center justify-between">
                <div className="space-y-1">
                  <Link href={`/dashboard/events/${event.id}`} className="font-medium hover:underline">
                    {event.nombre}
                  </Link>
                  {event.expand?.cliente_id && (
                    <p className="text-sm text-muted-foreground">
                      {event.expand.cliente_id.nombre}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <Badge className={getEventTypeColor(event.tipo)}>
                    {event.tipo}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(event.fecha), "d 'de' MMMM", { locale: es })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No hay eventos próximos</p>
        )}
      </CardContent>
    </Card>
  )
} 