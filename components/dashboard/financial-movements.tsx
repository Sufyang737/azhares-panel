import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconArrowUpRight, IconArrowDownRight } from "@tabler/icons-react"
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Spinner } from '../ui/spinner'
import { BarChart } from '@tremor/react'

interface Movement {
  id: string
  type: string
  moneda: string
  montoEspera: number
  fechaEspera: string
  fechaEfectuado: string | null
  categoria?: string
}

interface Totals {
  ingresosPesos: number
  egresosPesos: number
  ingresosDolares: number
  egresosDolares: number
  ingresosTotalPesos: number
  egresosTotalPesos: number
  balancePesos: number
}

// Custom hook para obtener cotización del dólar blue
const useDolarBlue = () => {
  const [dolarBlue, setDolarBlue] = useState<{ compra: number, venta: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDolarBlue = async () => {
      setLoading(true)
      try {
        const response = await fetch('https://dolarapi.com/v1/dolares/blue')
        if (!response.ok) {
          throw new Error(`Error al obtener cotización: ${response.status}`)
        }
        const data = await response.json()
        setDolarBlue({
          compra: data.compra,
          venta: data.venta
        })
      } catch (err) {
        console.error('Error fetching dolar blue:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchDolarBlue()
  }, [])

  return { dolarBlue, loading, error }
}

export function FinancialMovements() {
  const [movements, setMovements] = useState<Movement[]>([])
  const [totals, setTotals] = useState<Totals>({
    ingresosPesos: 0,
    egresosPesos: 0,
    ingresosDolares: 0,
    egresosDolares: 0,
    ingresosTotalPesos: 0,
    egresosTotalPesos: 0,
    balancePesos: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('30') // 30 días por defecto
  const { dolarBlue, loading: dolarLoading } = useDolarBlue()

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        // Calcular fecha de inicio según el período
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - parseInt(period))

        const response = await fetch(`/api/contabilidad?desde=${startDate.toISOString()}&hasta=${endDate.toISOString()}`)
        
        if (!response.ok) {
          throw new Error('Error al obtener los movimientos financieros')
        }

        const data = await response.json()
        
        if (Array.isArray(data)) {
          const processedMovements = data.map(item => ({
            id: item.id,
            type: item.type,
            moneda: item.moneda,
            montoEspera: Number(item.montoEspera || 0),
            fechaEspera: item.fechaEspera,
            fechaEfectuado: item.fechaEfectuado,
            categoria: item.categoria
          }))

          setMovements(processedMovements)

          // Calcular totales
          let ingresosPesos = 0
          let egresosPesos = 0
          let ingresosDolares = 0
          let egresosDolares = 0

          processedMovements.forEach(movement => {
            const monto = movement.montoEspera || 0
            
            if (movement.type === 'cobro') {
              if (movement.moneda === 'ars') {
                ingresosPesos += monto
              } else if (movement.moneda === 'usd') {
                ingresosDolares += monto
              }
            } else if (movement.type === 'pago') {
              if (movement.moneda === 'ars') {
                egresosPesos += monto
              } else if (movement.moneda === 'usd') {
                egresosDolares += monto
              }
            }
          })

          // Convertir todo a pesos para el total
          const ingresosTotalPesos = ingresosPesos + (ingresosDolares * (dolarBlue?.venta || 1))
          const egresosTotalPesos = egresosPesos + (egresosDolares * (dolarBlue?.venta || 1))
          const balancePesos = ingresosTotalPesos - egresosTotalPesos

          setTotals({
            ingresosPesos,
            egresosPesos,
            ingresosDolares,
            egresosDolares,
            ingresosTotalPesos,
            egresosTotalPesos,
            balancePesos
          })
        } else {
          console.error('Invalid data format:', data)
          setError('No se pudieron cargar los movimientos financieros')
        }
      } catch (error) {
        console.error('Error fetching movements:', error)
        setError('Error al cargar los movimientos financieros')
      } finally {
        setLoading(false)
      }
    }

    fetchMovements()
  }, [period, dolarBlue?.venta])

  // Procesar datos para el gráfico
  const chartData = movements.reduce((acc: any[], movement) => {
    const date = format(parseISO(movement.fechaEspera), 'dd/MM', { locale: es })
    const existingDay = acc.find(item => item.date === date)
    
    if (existingDay) {
      if (movement.type === 'cobro') {
        existingDay.ingresos += movement.moneda === 'usd' 
          ? movement.montoEspera * (dolarBlue?.venta || 1)
          : movement.montoEspera
      } else {
        existingDay.egresos += movement.moneda === 'usd'
          ? movement.montoEspera * (dolarBlue?.venta || 1)
          : movement.montoEspera
      }
    } else {
      acc.push({
        date,
        ingresos: movement.type === 'cobro' 
          ? (movement.moneda === 'usd' 
            ? movement.montoEspera * (dolarBlue?.venta || 1)
            : movement.montoEspera)
          : 0,
        egresos: movement.type === 'pago'
          ? (movement.moneda === 'usd'
            ? movement.montoEspera * (dolarBlue?.venta || 1)
            : movement.montoEspera)
          : 0
      })
    }
    
    return acc
  }, []).sort((a, b) => {
    const [dayA, monthA] = a.date.split('/')
    const [dayB, monthB] = b.date.split('/')
    return new Date(2024, parseInt(monthA) - 1, parseInt(dayA)).getTime() - 
           new Date(2024, parseInt(monthB) - 1, parseInt(dayB)).getTime()
  })

  // Función auxiliar para formatear montos
  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(monto)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Movimientos Financieros</CardTitle>
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
        <CardHeader>
          <CardTitle>Movimientos Financieros</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Movimientos Financieros</CardTitle>
            <p className="text-sm text-muted-foreground">
              Ingresos y egresos en el tiempo
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod('7')}
              className={`px-3 py-1 rounded-lg text-sm ${
                period === '7' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              Últimos 7 días
            </button>
            <button
              onClick={() => setPeriod('30')}
              className={`px-3 py-1 rounded-lg text-sm ${
                period === '30' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              Últimos 30 días
            </button>
            <button
              onClick={() => setPeriod('90')}
              className={`px-3 py-1 rounded-lg text-sm ${
                period === '90' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              Últimos 3 meses
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <IconArrowUpRight className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-sm font-medium">Ingresos</p>
              <div className="text-2xl font-bold">
                ${formatMonto(totals.ingresosTotalPesos)} ARS
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ${formatMonto(totals.ingresosDolares)} USD · ${formatMonto(totals.ingresosPesos)} ARS
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <IconArrowDownRight className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-sm font-medium">Egresos</p>
              <div className="text-2xl font-bold">
                ${formatMonto(totals.egresosTotalPesos)} ARS
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ${formatMonto(totals.egresosDolares)} USD · ${formatMonto(totals.egresosPesos)} ARS
              </p>
            </div>
          </div>
        </div>

        {chartData.length > 0 ? (
          <BarChart
            data={chartData}
            index="date"
            categories={["ingresos", "egresos"]}
            colors={["emerald", "rose"]}
            valueFormatter={(number) => 
              `$${Intl.NumberFormat('es-AR').format(number)}`
            }
            yAxisWidth={48}
          />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay datos disponibles para este periodo
          </p>
        )}
      </CardContent>
    </Card>
  )
} 