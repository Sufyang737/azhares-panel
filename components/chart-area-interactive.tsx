"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

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
import { Contabilidad } from "@/app/dashboard/contabilidad/page"

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

<<<<<<< HEAD
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
=======
export const description = "An interactive area chart"

// Configuración del gráfico
const chartConfig = {
  ingresos: {
    label: "Ingresos",
    color: "rgb(74, 222, 128)", // Verde brillante
  },
  egresos: {
    label: "Egresos",
    color: "rgb(248, 113, 113)", // Rojo brillante
  },
} satisfies ChartConfig

// Tipado para los datos del gráfico
interface ChartDataItem {
  date: string;
  ingresos: number;
  egresos: number;
}

// Función para procesar los datos de contabilidad y transformarlos para el gráfico
const processContabilidadData = (registros: Contabilidad[], timeRange: string, dolarBlue: { compra: number, venta: number } | null): ChartDataItem[] => {
  if (!registros || registros.length === 0) {
    return [];
  }

  // Filtrar por rango de tiempo
  const referenceDate = new Date();
  let daysToSubtract = 90;
  if (timeRange === "30d") {
    daysToSubtract = 30;
  } else if (timeRange === "7d") {
    daysToSubtract = 7;
  }
  
  const startDate = new Date(referenceDate);
  startDate.setDate(startDate.getDate() - daysToSubtract);
  
  // Filtrar registros dentro del rango de tiempo
  const filteredRegistros = registros.filter(registro => {
    const fechaRegistro = new Date(registro.fechaEfectuado || registro.fechaEspera);
    return fechaRegistro >= startDate;
  });
  
  // Agrupar por fecha y tipo (cobro/pago)
  const entriesByDate: Record<string, { ingresos: number, egresos: number }> = {};
  
  // Crear entradas para cada día del rango (para asegurar continuidad en el gráfico)
  const tempDate = new Date(startDate);
  while (tempDate <= referenceDate) {
    const dateStr = tempDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    entriesByDate[dateStr] = { ingresos: 0, egresos: 0 };
    tempDate.setDate(tempDate.getDate() + 1);
  }
  
  // Agregar los datos reales
  filteredRegistros.forEach(registro => {
    const fecha = new Date(registro.fechaEfectuado || registro.fechaEspera);
    const dateStr = fecha.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    
    // Asegurarse de que existe la entrada para esa fecha
    if (!entriesByDate[dateStr]) {
      entriesByDate[dateStr] = { ingresos: 0, egresos: 0 };
    }
    
    // Convertir a pesos argentinos si es necesario
    let montoEnPesos = registro.montoEspera || 0;
    if (registro.moneda === 'usd') {
      // Usar el valor real del dólar blue
      const tasaCambio = dolarBlue?.venta || 1000; // Valor por defecto si no hay cotización
      montoEnPesos = montoEnPesos * tasaCambio;
    }
    
    // Acumular según el tipo
    if (registro.type === 'cobro') {
      entriesByDate[dateStr].ingresos += montoEnPesos;
    } else if (registro.type === 'pago') {
      entriesByDate[dateStr].egresos += montoEnPesos;
    }
  });
  
  // Convertir a array y ordenar por fecha
  const result = Object.entries(entriesByDate).map(([date, values]) => ({
    date,
    ...values
  })).sort((a, b) => a.date.localeCompare(b.date));
  
  return result;
};

export function ChartAreaInteractive({ registros = [] }: { registros?: Contabilidad[] }) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")
  const { dolarBlue, loading: dolarLoading } = useDolarBlue()
>>>>>>> 2f4eae2d6f2b11f494f7e573f7c7025b2f26268c

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

<<<<<<< HEAD
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
=======
  // Procesar datos para el gráfico
  const chartData = React.useMemo(() => {
    return processContabilidadData(registros, timeRange, dolarBlue);
  }, [registros, timeRange, dolarBlue]);

  // Calcular el dominio del eje Y basado en los datos
  const yDomain = React.useMemo(() => {
    if (!chartData.length) return [0, 100];
    const allValues = chartData.flatMap(item => [item.ingresos, item.egresos]);
    const maxValue = Math.max(...allValues);
    return [0, maxValue * 1.1]; // Añadir 10% de margen superior
  }, [chartData]);
>>>>>>> 2f4eae2d6f2b11f494f7e573f7c7025b2f26268c

  return (
    <Card className="@container/card">
      <CardHeader>
<<<<<<< HEAD
        <CardTitle>Movimientos Diarios</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Total de ingresos y gastos diarios
          </span>
          <span className="@[540px]/card:hidden">Ingresos y gastos</span>
=======
        <CardTitle>Movimientos Financieros</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Ingresos y egresos en el tiempo
          </span>
          <span className="@[540px]/card:hidden">Flujo financiero</span>
>>>>>>> 2f4eae2d6f2b11f494f7e573f7c7025b2f26268c
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
<<<<<<< HEAD
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
=======
            <SelectContent>
              <SelectItem value="90d">Últimos 3 meses</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
>>>>>>> 2f4eae2d6f2b11f494f7e573f7c7025b2f26268c
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent>
<<<<<<< HEAD
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
=======
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          {chartData.length > 0 ? (
            <AreaChart 
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillIngresos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(74, 222, 128)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="rgb(74, 222, 128)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillEgresos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(248, 113, 113)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="rgb(248, 113, 113)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={function formatXAxis(value) {
                  const date = new Date(value)
                  return date.toLocaleDateString("es-AR", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={function formatYAxis(value) {
                  return `$${new Intl.NumberFormat('es-AR', { 
                    notation: 'compact',
                    compactDisplay: 'short'
                  }).format(value)}`;
                }}
                domain={yDomain}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={function formatLabel(value) {
                      return new Date(value as string).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })
                    }}
                    formatter={function formatValue(value, name) {
                      const numericValue = Number(value);
                      const formatted = `$${new Intl.NumberFormat('es-AR').format(numericValue)}`;
                      const label = name === 'ingresos' ? 'Ingresos' : 'Egresos';
                      const color = name === 'ingresos' ? 'rgb(74, 222, 128)' : 'rgb(248, 113, 113)';
                      return [
                        <span key="value" style={{ color: color, fontWeight: 'bold' }}>{formatted}</span>,
                        <span key="name" style={{ color: color }}>{label}</span>
                      ]
                    }}
                    indicator="dot"
                    className="bg-background/80 backdrop-blur-sm border-muted-foreground/20 shadow-lg"
                  />
                }
              />
              <Area
                dataKey="ingresos"
                type="monotone"
                fill="url(#fillIngresos)"
                stroke="rgb(74, 222, 128)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 2 }}
                stackId="1"
              />
              <Area
                dataKey="egresos"
                type="monotone"
                fill="url(#fillEgresos)"
                stroke="rgb(248, 113, 113)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 2 }}
                stackId="2"
              />
            </AreaChart>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground text-sm">No hay datos disponibles para este período</p>
            </div>
          )}
>>>>>>> 2f4eae2d6f2b11f494f7e573f7c7025b2f26268c
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
