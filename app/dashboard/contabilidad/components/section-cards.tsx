import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { ContabilidadRecord } from "@/app/services/contabilidad";
import { startOfMonth, endOfMonth, subMonths, parseISO } from "date-fns";

interface AccountingSectionCardsProps {
  records: ContabilidadRecord[];
}

interface MonthlyMetrics {
  totalIngresos: { ars: number; usd: number };
  totalEgresos: { ars: number; usd: number };
  eventosActivos: number;
  facturacionPendiente: { ars: number; usd: number };
}

const calculateMonthlyMetrics = (records: ContabilidadRecord[], date: Date): MonthlyMetrics => {
  const startDate = startOfMonth(date);
  const endDate = endOfMonth(date);

  const monthlyRecords = records.filter(record => {
    const recordDate = parseISO(record.created);
    return recordDate >= startDate && recordDate <= endDate;
  });

  return monthlyRecords.reduce(
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

      if (record.evento_id && !record.fechaEfectuado) {
        acc.eventosActivos = new Set([...acc.eventosActivos, record.evento_id.id]).size;
      }

      return acc;
    },
    {
      totalIngresos: { ars: 0, usd: 0 },
      totalEgresos: { ars: 0, usd: 0 },
      eventosActivos: 0,
      facturacionPendiente: { ars: 0, usd: 0 }
    }
  );
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

  // Convertir montos en ARS a USD usando una tasa aproximada (ajustar según necesidad)
  const arsToUsdRate = 0.0012; // Aproximadamente 1 USD = 850 ARS
  const currentTotalUsd = currentMetrics.totalIngresos.usd + (currentMetrics.totalIngresos.ars * arsToUsdRate);
  const previousTotalUsd = previousMetrics.totalIngresos.usd + (previousMetrics.totalIngresos.ars * arsToUsdRate);
  const ingresosTrendPercentage = calculatePercentageChange(currentTotalUsd, previousTotalUsd);

  const currentEventos = currentMetrics.eventosActivos;
  const previousEventos = previousMetrics.eventosActivos;
  const eventosTrendPercentage = calculatePercentageChange(currentEventos, previousEventos);

  const currentPendienteUsd = currentMetrics.facturacionPendiente.usd + 
    (currentMetrics.facturacionPendiente.ars * arsToUsdRate);
  const previousPendienteUsd = previousMetrics.facturacionPendiente.usd + 
    (previousMetrics.facturacionPendiente.ars * arsToUsdRate);
  const pendienteTrendPercentage = calculatePercentageChange(currentPendienteUsd, previousPendienteUsd);

  // Calcular margen de ganancia
  const currentMargin = ((currentTotalUsd - (currentMetrics.totalEgresos.usd + 
    (currentMetrics.totalEgresos.ars * arsToUsdRate))) / currentTotalUsd) * 100;
  const previousMargin = ((previousTotalUsd - (previousMetrics.totalEgresos.usd + 
    (previousMetrics.totalEgresos.ars * arsToUsdRate))) / previousTotalUsd) * 100;
  const marginTrendPercentage = calculatePercentageChange(currentMargin, previousMargin);

  return (
    <div className="grid gap-4 px-4 md:grid-cols-2 lg:grid-cols-4 lg:px-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(currentTotalUsd)}
          </div>
          <p className="text-xs text-muted-foreground">
            <span className={ingresosTrendPercentage >= 0 ? "text-green-600" : "text-red-600"}>
              {ingresosTrendPercentage >= 0 ? "+" : ""}{ingresosTrendPercentage.toFixed(1)}%
            </span>
            {" "}vs mes anterior
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Eventos Activos</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentEventos}</div>
          <p className="text-xs text-muted-foreground">
            <span className={eventosTrendPercentage >= 0 ? "text-green-600" : "text-red-600"}>
              {eventosTrendPercentage >= 0 ? "+" : ""}{eventosTrendPercentage.toFixed(1)}%
            </span>
            {" "}vs mes anterior
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Facturación Pendiente</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(currentPendienteUsd)}
          </div>
          <p className="text-xs text-muted-foreground">
            <span className={pendienteTrendPercentage >= 0 ? "text-green-600" : "text-red-600"}>
              {pendienteTrendPercentage >= 0 ? "+" : ""}{pendienteTrendPercentage.toFixed(1)}%
            </span>
            {" "}vs mes anterior
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Margen de Ganancia</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentMargin.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            <span className={marginTrendPercentage >= 0 ? "text-green-600" : "text-red-600"}>
              {marginTrendPercentage >= 0 ? "+" : ""}{marginTrendPercentage.toFixed(1)}%
            </span>
            {" "}vs mes anterior
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 