'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { CalendarRange, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const formatCurrency = (amount: number, currency: string): string => {
  return amount.toLocaleString('es-AR', {
    style: 'currency',
    currency: currency === 'ars' ? 'ARS' : 'USD'
  });
};

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

interface MonthlyData {
  ingresos: { ars: number; usd: number; };
  egresos: { ars: number; usd: number; };
  acumulado: {
    efectivo: { ars: number; usd: number; };
    transferencia: { ars: number; usd: number; };
    total: { ars: number; usd: number; };
  };
  pendientes: {
    ingresos: { ars: number; usd: number; };
    egresos: { ars: number; usd: number; };
  };
}

export function MonthlyReportDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [monthlyData, setMonthlyData] = useState<MonthlyData>({
    ingresos: { ars: 0, usd: 0 },
    egresos: { ars: 0, usd: 0 },
    acumulado: {
      efectivo: { ars: 0, usd: 0 },
      transferencia: { ars: 0, usd: 0 },
      total: { ars: 0, usd: 0 }
    },
    pendientes: {
      ingresos: { ars: 0, usd: 0 },
      egresos: { ars: 0, usd: 0 }
    }
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadMonthlyData(selectedYear, selectedMonth);
    }
  }, [open, selectedYear, selectedMonth]);

  const loadMonthlyData = async (year: number, month: number) => {
    setLoading(true);
    try {
      const startDate = startOfMonth(new Date(year, month - 1));
      const endDate = endOfMonth(new Date(year, month - 1));

      // Obtener TODOS los registros hasta el fin del mes seleccionado
      const response = await fetch('/api/contabilidad?' + new URLSearchParams({
        sort: '-created',
        expand: 'cliente_id,evento_id,proveedor_id',
        perPage: '1000',
        filter: `fechaEfectuado != null && fechaEfectuado <= "${format(endDate, 'yyyy-MM-dd')} 23:59:59"`,
      }));

      if (!response.ok) {
        throw new Error('Error al cargar los registros');
      }

      const data = await response.json();
      
      // Log para debugging
      console.log('=== DEBUG: Registros Mensuales ===');
      console.log('Total registros:', data.items.length);
      
      // Contar registros USD en efectivo
      const usdCashRecords = data.items.filter(record => 
        record.moneda === 'usd' && 
        record.especie === 'efectivo'
      );
      
      const usdCashIngresos = usdCashRecords
        .filter(record => record.type === 'cobro')
        .reduce((sum, record) => sum + (record.montoEspera || 0), 0);
      
      const usdCashEgresos = usdCashRecords
        .filter(record => record.type === 'pago')
        .reduce((sum, record) => sum + (record.montoEspera || 0), 0);
      
      console.log('USD Efectivo - Ingresos:', usdCashIngresos);
      console.log('USD Efectivo - Egresos:', usdCashEgresos);
      console.log('USD Efectivo - Balance:', usdCashIngresos - usdCashEgresos);
      console.log('============================');

      // Procesar los registros
      const monthlyData = data.items.reduce((acc, record) => {
        if (!record.fechaEfectuado) return acc;

        const recordDate = new Date(record.fechaEfectuado);
        const amount = record.montoEspera || 0;
        const especie = record.especie?.toLowerCase() || 'efectivo';
        const moneda = record.moneda?.toLowerCase();
        const type = record.type === 'cobro' ? 'ingresos' : 'egresos';
        const isCurrentMonth = recordDate >= startDate && recordDate <= endDate;

        // Validar datos
        if (especie !== 'efectivo' && especie !== 'transferencia') return acc;
        if (!moneda || (moneda !== 'ars' && moneda !== 'usd')) return acc;

        // Actualizar totales del mes si corresponde
        if (isCurrentMonth) {
          if (type === 'ingresos') {
            acc[type][moneda] += amount;
          } else {
            acc.egresos[moneda] += amount;
          }
        }

        // Actualizar balance acumulado para TODOS los registros hasta la fecha
        if (recordDate <= endDate) {
          if (type === 'ingresos') {
            acc.acumulado[especie][moneda] += amount;
            acc.acumulado.total[moneda] += amount;
          } else {
            acc.acumulado[especie][moneda] -= amount;
            acc.acumulado.total[moneda] -= amount;
          }
        }

        return acc;
      }, {
        ingresos: { ars: 0, usd: 0 },
        egresos: { ars: 0, usd: 0 },
        acumulado: {
          efectivo: { ars: 0, usd: 0 },
          transferencia: { ars: 0, usd: 0 },
          total: { ars: 0, usd: 0 }
        },
        pendientes: {
          ingresos: { ars: 0, usd: 0 },
          egresos: { ars: 0, usd: 0 }
        }
      });

      setMonthlyData(monthlyData);
    } catch (error) {
      console.error('Error al cargar los datos mensuales:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del mes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CalendarRange className="h-4 w-4" />
          Reporte Mensual
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw]">
        <DialogHeader>
          <DialogTitle>Reporte Mensual</DialogTitle>
          <DialogDescription className="flex items-center gap-4 pt-2">
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => setSelectedMonth(parseInt(value))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Seleccionar mes" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, index) => (
                  <SelectItem key={index + 1} value={(index + 1).toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">{selectedYear}</span>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando datos...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Balance Acumulado */}
            <div className="rounded-lg border-2 border-primary p-4 bg-primary/5">
              <h3 className="font-semibold mb-3">Balance Acumulado</h3>
              
              {/* ARS */}
              <div className="mb-4">
                <h4 className="font-medium mb-2">ARS</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Efectivo:</span>
                    <span className={monthlyData.acumulado.efectivo.ars >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(monthlyData.acumulado.efectivo.ars, 'ars')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Transferencia:</span>
                    <span className={monthlyData.acumulado.transferencia.ars >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(monthlyData.acumulado.transferencia.ars, 'ars')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t font-bold">
                    <span>Total:</span>
                    <span className={monthlyData.acumulado.total.ars >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(monthlyData.acumulado.total.ars, 'ars')}
                    </span>
                  </div>
                </div>
              </div>

              {/* USD */}
              <div>
                <h4 className="font-medium mb-2">USD</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Efectivo:</span>
                    <span className={monthlyData.acumulado.efectivo.usd >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(monthlyData.acumulado.efectivo.usd, 'usd')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Transferencia:</span>
                    <span className={monthlyData.acumulado.transferencia.usd >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(monthlyData.acumulado.transferencia.usd, 'usd')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t font-bold">
                    <span>Total:</span>
                    <span className={monthlyData.acumulado.total.usd >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(monthlyData.acumulado.total.usd, 'usd')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Resumen del Mes */}
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-3">Resumen del Mes</h3>
              
              {/* ARS */}
              <div className="mb-4">
                <h4 className="font-medium mb-2">ARS</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Ingresos:</span>
                    <span className="text-green-600">{formatCurrency(monthlyData.ingresos.ars, 'ars')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Egresos:</span>
                    <span className="text-red-600">{formatCurrency(monthlyData.egresos.ars, 'ars')}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-1">
                    <span>Balance del Mes:</span>
                    <span className={monthlyData.ingresos.ars - monthlyData.egresos.ars >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(monthlyData.ingresos.ars - monthlyData.egresos.ars, 'ars')}
                    </span>
                  </div>
                </div>
              </div>

              {/* USD */}
              <div>
                <h4 className="font-medium mb-2">USD</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Ingresos:</span>
                    <span className="text-green-600">{formatCurrency(monthlyData.ingresos.usd, 'usd')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Egresos:</span>
                    <span className="text-red-600">{formatCurrency(monthlyData.egresos.usd, 'usd')}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-1">
                    <span>Balance del Mes:</span>
                    <span className={monthlyData.ingresos.usd - monthlyData.egresos.usd >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(monthlyData.ingresos.usd - monthlyData.egresos.usd, 'usd')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Transacciones Pendientes */}
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-3">Transacciones Pendientes</h3>
              
              {/* ARS Pendientes */}
              <div className="mb-4">
                <h4 className="font-medium mb-2">ARS</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Por Cobrar:</span>
                    <span className="text-blue-600">{formatCurrency(monthlyData.pendientes.ingresos.ars, 'ars')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Por Pagar:</span>
                    <span className="text-orange-600">{formatCurrency(monthlyData.pendientes.egresos.ars, 'ars')}</span>
                  </div>
                </div>
              </div>

              {/* USD Pendientes */}
              <div>
                <h4 className="font-medium mb-2">USD</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Por Cobrar:</span>
                    <span className="text-blue-600">{formatCurrency(monthlyData.pendientes.ingresos.usd, 'usd')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Por Pagar:</span>
                    <span className="text-orange-600">{formatCurrency(monthlyData.pendientes.egresos.usd, 'usd')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 