"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

const chartConfig = {
  income: {
    label: "Ingresos",
    color: "var(--success)",
  },
  expenses: {
    label: "Gastos",
    color: "var(--destructive)",
  },
} satisfies ChartConfig

interface ChartAreaInteractiveProps {
  records: any[];
}

export function ChartAreaInteractive({ records }: ChartAreaInteractiveProps) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  // Procesar los datos para el gráfico
  const processedData = React.useMemo(() => {
    // Crear un mapa para agrupar registros por fecha
    const dailyData = new Map()

    records.forEach(record => {
      try {
        const recordDate = new Date(record.created)
        if (isNaN(recordDate.getTime())) {
          console.warn('Fecha inválida:', record.created)
          return
        }
        
        const date = format(recordDate, 'yyyy-MM-dd')
        
        if (!dailyData.has(date)) {
          dailyData.set(date, {
            date,
            income: 0,
            expenses: 0
          })
        }

        const amount = Number(record.montoEspera) || 0
        const entry = dailyData.get(date)

        if (record.type === 'cobro') {
          entry.income += amount
        } else if (record.type === 'pago') {
          entry.expenses += amount
        }
      } catch (error) {
        console.warn('Error procesando registro:', error)
      }
    })

    // Convertir el mapa a un array y ordenar por fecha
    return Array.from(dailyData.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [records])

  const filteredData = React.useMemo(() => {
    const referenceDate = new Date()
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)

    return processedData.filter(item => {
      const date = new Date(item.date)
      return date >= startDate
    })
  }, [processedData, timeRange])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Movimientos Diarios</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Total de ingresos y gastos diarios
          </span>
          <span className="@[540px]/card:hidden">Ingresos y gastos</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Últimos 3 meses</ToggleGroupItem>
            <ToggleGroupItem value="30d">Últimos 30 días</ToggleGroupItem>
            <ToggleGroupItem value="7d">Últimos 7 días</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden text-sm"
              aria-label="Seleccionar rango"
            >
              <SelectValue placeholder="Últimos 3 meses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Últimos 3 meses
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Últimos 30 días
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Últimos 7 días
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            data={filteredData}
            margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
            height={300}
          >
            <defs>
              <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--success)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--destructive)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--destructive)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              fontSize={12}
              tickFormatter={(value) => {
                return format(new Date(value), 'dd MMM', { locale: es })
              }}
            />
            <YAxis
              tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickCount={5}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="var(--success)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#income)"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="var(--destructive)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#expenses)"
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload) return null

                const date = payload[0]?.payload?.date
                if (!date) return null

                const formattedDate = format(new Date(date + 'T00:00:00'), 'dd MMM yyyy', { locale: es })
                const incomeValue = payload[0]?.value ?? 0
                const expensesValue = payload[1]?.value ?? 0

                return (
                  <ChartTooltipContent>
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-muted-foreground">
                        {formattedDate}
                      </p>
                      <div className="flex items-center gap-1">
                        <div className="h-1 w-4 rounded-full bg-success" />
                        <span className="text-sm font-medium">
                          Ingresos: ${incomeValue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-1 w-4 rounded-full bg-destructive" />
                        <span className="text-sm font-medium">
                          Gastos: ${expensesValue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </ChartTooltipContent>
                )
              }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
