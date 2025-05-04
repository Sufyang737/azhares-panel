import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContabilidadRecord } from "@/app/services/contabilidad";
import { format, parseISO, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, isSameDay, subDays, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChartData {
  date: string;
  ingresos: number;
  egresos: number;
  balance: number;
  total: number;
}

interface ChartAreaInteractiveProps {
  records: ContabilidadRecord[];
}

type PeriodOption = '7d' | '30d' | '3m' | 'custom';

export function ChartAreaInteractive({ records }: ChartAreaInteractiveProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('30d');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return format(now, 'yyyy-MM');
  });

  // Generar lista de meses disponibles
  const availableMonths = useMemo(() => {
    return Array.from(
      new Set(
        records.map(record => {
          const date = parseISO(record.created);
          return format(date, 'yyyy-MM');
        })
      )
    ).sort().reverse();
  }, [records]);

  // Procesar datos para el gráfico según el período seleccionado
  const chartData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;
    let interval: 'day' | 'week' = 'day';

    switch (selectedPeriod) {
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
      case '3m':
        startDate = subMonths(now, 3);
        interval = 'week';
        break;
      case 'custom':
        const [year, month] = selectedMonth.split('-').map(Number);
        startDate = startOfMonth(new Date(year, month - 1));
        endDate = endOfMonth(new Date(year, month - 1));
        break;
      default:
        startDate = subDays(now, 30);
    }

    // Crear array con todos los días del período
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Agrupar por semana si el intervalo es semanal
    const dataPoints = interval === 'week' 
      ? allDays.filter((_, index) => index % 7 === 0)
      : allDays;

    // Inicializar datos para cada punto
    const data = dataPoints.map(date => ({
      date: format(date, 'yyyy-MM-dd'),
      ingresos: 0,
      egresos: 0,
      balance: 0,
      total: 0
    }));

    // Tasa de conversión ARS a USD
    const arsToUsdRate = 0.0012;

    // Procesar registros
    records.forEach(record => {
      const recordDate = parseISO(record.created);
      if (isWithinInterval(recordDate, { start: startDate, end: endDate })) {
        // Encontrar el punto de datos más cercano
        const dataIndex = data.findIndex(point => {
          const pointDate = parseISO(point.date);
          if (interval === 'week') {
            // Agrupar por semana
            const nextPoint = data[data.findIndex(p => p.date === point.date) + 1];
            const nextDate = nextPoint ? parseISO(nextPoint.date) : endDate;
            return recordDate >= pointDate && recordDate < nextDate;
          }
          return isSameDay(pointDate, recordDate);
        });

        if (dataIndex !== -1) {
          const amountUsd = record.moneda.toLowerCase() === 'usd'
            ? record.montoEspera
            : record.montoEspera * arsToUsdRate;

          if (record.type === 'cobro') {
            data[dataIndex].ingresos += amountUsd;
          } else {
            data[dataIndex].egresos += amountUsd;
          }
          
          data[dataIndex].balance = 
            data[dataIndex].ingresos - data[dataIndex].egresos;
        }
      }
    });

    // Calcular totales acumulados
    let runningTotal = 0;
    data.forEach(day => {
      runningTotal += day.balance;
      day.total = runningTotal;
    });

    return data;
  }, [records, selectedPeriod, selectedMonth]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const periodOptions = [
    { value: '7d', label: 'Últimos 7 días' },
    { value: '30d', label: 'Últimos 30 días' },
    { value: '3m', label: 'Últimos 3 meses' },
    { value: 'custom', label: 'Mes específico' }
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle>Flujo de Caja</CardTitle>
        <div className="flex gap-2">
          <Select
            value={selectedPeriod}
            onValueChange={(value: PeriodOption) => setSelectedPeriod(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecciona período" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedPeriod === 'custom' && (
            <Select
              value={selectedMonth}
              onValueChange={setSelectedMonth}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecciona mes" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((month) => (
                  <SelectItem key={month} value={month}>
                    {format(parseISO(`${month}-01`), 'MMMM yyyy', { locale: es })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 5,
                right: 5,
                left: 5,
                bottom: 5,
              }}
            >
              <defs>
                <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorEgresos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickFormatter={(date) => {
                  const formattedDate = parseISO(date);
                  return selectedPeriod === '3m' 
                    ? format(formattedDate, 'dd MMM', { locale: es })
                    : format(formattedDate, 'dd/MM');
                }}
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tickFormatter={formatCurrency}
                fontSize={12}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(date) => format(parseISO(date as string), 'dd/MM/yyyy')}
              />
              <Area
                type="monotone"
                dataKey="ingresos"
                stroke="#22c55e"
                fill="url(#colorIngresos)"
                name="Ingresos"
              />
              <Area
                type="monotone"
                dataKey="egresos"
                stroke="#ef4444"
                fill="url(#colorEgresos)"
                name="Egresos"
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#3b82f6"
                fill="url(#colorTotal)"
                name="Total Acumulado"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 