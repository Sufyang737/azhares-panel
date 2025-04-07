import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconCake } from "@tabler/icons-react"
import { format, isFuture, addYears, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Spinner } from '../ui/spinner'

interface Birthday {
  id: string
  nombre: string
  apellido: string
  cumpleanio: string
  nextBirthday: Date
}

interface Client {
  id: string
  nombre: string
  apellido: string
  cumpleanio: string
}

export function UpcomingBirthdays() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBirthdays = async () => {
      try {
        const response = await fetch('/api/clients?filter=cumpleanio!=""&sort=cumpleanio')
        
        if (!response.ok) {
          throw new Error('Error al obtener los cumpleaños')
        }

        const data = await response.json()
        
        if (data.success && data.clients) {
          // Procesar los cumpleaños
          const today = new Date()
          const processedBirthdays = data.clients
            .filter((person: Client) => person.cumpleanio)
            .map((person: Client) => {
              const birthDate = parseISO(person.cumpleanio)
              let nextBirthday = new Date(
                today.getFullYear(),
                birthDate.getMonth(),
                birthDate.getDate()
              )

              // Si el cumpleaños ya pasó este año, calcular para el próximo año
              if (!isFuture(nextBirthday)) {
                nextBirthday = addYears(nextBirthday, 1)
              }

              return {
                id: person.id,
                nombre: person.nombre,
                apellido: person.apellido,
                cumpleanio: person.cumpleanio,
                nextBirthday
              }
            })
            .sort((a: Birthday, b: Birthday) => a.nextBirthday.getTime() - b.nextBirthday.getTime())
            .slice(0, 5) // Mostrar solo los próximos 5 cumpleaños

          setBirthdays(processedBirthdays)
        } else {
          setError('No se pudieron cargar los cumpleaños')
        }
      } catch (error) {
        console.error('Error fetching birthdays:', error)
        setError('Error al cargar los cumpleaños')
      } finally {
        setLoading(false)
      }
    }

    fetchBirthdays()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Próximos Cumpleaños</CardTitle>
          <IconCake className="h-4 w-4 text-muted-foreground" />
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
          <CardTitle className="text-sm font-medium">Próximos Cumpleaños</CardTitle>
          <IconCake className="h-4 w-4 text-muted-foreground" />
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
        <CardTitle className="text-sm font-medium">Próximos Cumpleaños</CardTitle>
        <IconCake className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {birthdays.length > 0 ? (
          <div className="space-y-2">
            {birthdays.map(birthday => (
              <div key={birthday.id} className="flex justify-between items-center text-sm">
                <span>{birthday.nombre} {birthday.apellido}</span>
                <span className="text-muted-foreground">
                  {format(birthday.nextBirthday, "d 'de' MMMM", { locale: es })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No hay cumpleaños próximos</p>
        )}
      </CardContent>
    </Card>
  )
} 