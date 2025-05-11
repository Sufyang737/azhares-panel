'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { ContabilidadRecord } from "@/app/services/contabilidad";
import { startOfMonth, endOfMonth, subMonths, parseISO, isWithinInterval } from "date-fns";

interface AccountingSectionCardsProps {
  records: ContabilidadRecord[];
}

interface MonthlyMetrics {
  totalIngresos: {
    ars: number;
    usd: number;
  };
  totalEgresos: {
    ars: number;
    usd: number;
  };
  eventosActivos: Set<string>;
  facturacionPendiente: {
    ars: number;
    usd: number;
  };
}

const calculateMonthlyMetrics = (records: ContabilidadRecord[], date: Date): MonthlyMetrics => {
  const startDate = startOfMonth(date);
  const endDate = endOfMonth(date);

  const monthlyRecords = records.filter(record => {
    const recordDate = parseISO(record.created);
    return isWithinInterval(recordDate, { start: startDate, end: endDate });
  });

  const metrics = monthlyRecords.reduce(
    (acc: MonthlyMetrics, record) => {
      const moneda = record.moneda.toLowerCase() as 'ars' | 'usd';
      const amount = record.montoEspera;

      if (record.type === 'cobro') {
        acc.totalIngresos[moneda] += amount;
        if (!record.fechaEfectuado) {
          acc.facturacionPendiente[moneda] += amount;
        }
      } else {
        acc.totalEgresos[moneda] += amount;
      }

      if (typeof record.evento_id === 'object' && record.evento_id?.id && !record.fechaEfectuado) {
        acc.eventosActivos.add(record.evento_id.id);
      }

      return acc;
    },
    {
      totalIngresos: { ars: 0, usd: 0 },
      totalEgresos: { ars: 0, usd: 0 },
      eventosActivos: new Set<string>(),
      facturacionPendiente: { ars: 0, usd: 0 }
    }
  );

  return {
    ...metrics,
    eventosActivos: metrics.eventosActivos
  };
};

const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

export function AccountingSectionCards({ records }: AccountingSectionCardsProps) {
  const currentDate = new Date();
  const previousDate = subMonths(currentDate, 1);

  const currentMetrics = calculateMonthlyMetrics(records, currentDate);
  const previousMetrics = calculateMonthlyMetrics(records, previousDate);

  // Calcular margen de ganancia
  const currentMargin = currentMetrics.totalIngresos.usd > 0 
    ? ((currentMetrics.totalIngresos.usd - currentMetrics.totalEgresos.usd) / currentMetrics.totalIngresos.usd) * 100
    : 0;

  const previousMargin = previousMetrics.totalIngresos.usd > 0
    ? ((previousMetrics.totalIngresos.usd - previousMetrics.totalEgresos.usd) / previousMetrics.totalIngresos.usd) * 100
    : 0;

  // Calcular cambios porcentuales
  const ingresosChange = calculatePercentageChange(
    currentMetrics.totalIngresos.usd,
    previousMetrics.totalIngresos.usd
  );

  const eventosChange = calculatePercentageChange(
    currentMetrics.eventosActivos.size,
    previousMetrics.eventosActivos.size
  );

  const facturacionChange = calculatePercentageChange(
    currentMetrics.facturacionPendiente.usd,
    previousMetrics.facturacionPendiente.usd
  );

  const marginChange = calculatePercentageChange(currentMargin, previousMargin);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            US$ {currentMetrics.totalIngresos.usd.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {ingresosChange > 0 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : ingresosChange < 0 ? (
              <TrendingDown className="h-4 w-4 text-destructive" />
            ) : null}
            <span className={ingresosChange > 0 ? "text-success" : ingresosChange < 0 ? "text-destructive" : ""}>
              {ingresosChange.toFixed(1)}% vs mes anterior
            </span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Eventos Activos</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {currentMetrics.eventosActivos.size}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {eventosChange > 0 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : eventosChange < 0 ? (
              <TrendingDown className="h-4 w-4 text-destructive" />
            ) : null}
            <span className={eventosChange > 0 ? "text-success" : eventosChange < 0 ? "text-destructive" : ""}>
              {eventosChange.toFixed(1)}% vs mes anterior
            </span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Facturación Pendiente</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            US$ {currentMetrics.facturacionPendiente.usd.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {facturacionChange > 0 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : facturacionChange < 0 ? (
              <TrendingDown className="h-4 w-4 text-destructive" />
            ) : null}
            <span className={facturacionChange > 0 ? "text-success" : facturacionChange < 0 ? "text-destructive" : ""}>
              {facturacionChange.toFixed(1)}% vs mes anterior
            </span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Margen de Ganancia</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {currentMargin.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {marginChange > 0 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : marginChange < 0 ? (
              <TrendingDown className="h-4 w-4 text-destructive" />
            ) : null}
            <span className={marginChange > 0 ? "text-success" : marginChange < 0 ? "text-destructive" : ""}>
              {marginChange.toFixed(1)}% vs mes anterior
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 