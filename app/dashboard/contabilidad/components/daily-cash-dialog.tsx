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
import { Badge } from "@/components/ui/badge";
import { format, isValid, startOfDay, endOfDay } from "date-fns";
import { Wallet, Loader2 } from "lucide-react";
import { ContabilidadRecord } from "@/app/services/contabilidad";
import { Input } from "@/components/ui/input";

const formatCurrency = (amount: number, currency: string): string => {
  return amount.toLocaleString('es-AR', {
    style: 'currency',
    currency: currency === 'ars' ? 'ARS' : 'USD'
  });
};

interface CashTotals {
  efectivo: {
    ars: { ingresos: number; egresos: number };
    usd: { ingresos: number; egresos: number };
  };
  transferencia: {
    ars: { ingresos: number; egresos: number };
    usd: { ingresos: number; egresos: number };
  };
  acumulado: {
    efectivo: {
      ars: number;
      usd: number;
    };
    transferencia: {
      ars: number;
      usd: number;
    };
    total: {
      ars: number;
      usd: number;
    };
  };
}

export function DailyCashDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [allRecords, setAllRecords] = useState<ContabilidadRecord[]>([]);

  // Cargar registros cuando se abre el diálogo o cambia la fecha
  useEffect(() => {
    if (open) {
      loadRecordsForDay(selectedDate);
    }
  }, [open, selectedDate]);

  const loadRecordsForDay = async (date: Date) => {
    setLoading(true);
    try {
      // Obtener TODOS los registros hasta la fecha seleccionada
      const response = await fetch('/api/contabilidad?' + new URLSearchParams({
        sort: '-created',
        expand: 'cliente_id,evento_id,proveedor_id',
        perPage: '1000',
        filter: `fechaEfectuado != null && fechaEfectuado <= "${format(endOfDay(date), 'yyyy-MM-dd')} 23:59:59"`,
      }));

      if (!response.ok) {
        throw new Error('Error al cargar los registros');
      }

      const data = await response.json();
      
      // Log para debugging
      console.log('=== DEBUG: Registros cargados ===');
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

      setAllRecords(data.items);
    } catch (error) {
      console.error('Error al cargar los registros:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar el cambio de fecha
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(event.target.value);
    if (isValid(newDate)) {
      setSelectedDate(newDate);
    }
  };

  // Filtrar registros del día seleccionado
  const dailyRecords = allRecords.filter(record => {
    if (!record.fechaEfectuado) return false;
    const startOfSelectedDay = startOfDay(selectedDate);
    const endOfSelectedDay = endOfDay(selectedDate);
    const effectiveDate = new Date(record.fechaEfectuado);
    return effectiveDate >= startOfSelectedDay && effectiveDate <= endOfSelectedDay;
  });

  // Calcular totales
  const totals = allRecords.reduce((acc: CashTotals, record) => {
    try {
      if (!record.fechaEfectuado) return acc;

      const amount = record.montoEspera || 0;
      const especie = record.especie?.toLowerCase() || 'efectivo';
      const moneda = record.moneda?.toLowerCase();
      const type = record.type === 'cobro' ? 'ingresos' : 'egresos';
      const effectiveDate = new Date(record.fechaEfectuado);
      const isSelectedDay = effectiveDate >= startOfDay(selectedDate) && effectiveDate <= endOfDay(selectedDate);

      // Validar que los valores sean correctos
      if (especie !== 'efectivo' && especie !== 'transferencia') {
        console.warn('Especie inválida:', especie, record);
        return acc;
      }

      if (!moneda || (moneda !== 'ars' && moneda !== 'usd')) {
        console.warn('Moneda inválida:', moneda, record);
        return acc;
      }

      // Actualizar totales del día si corresponde
      if (isSelectedDay) {
        acc[especie][moneda][type] += amount;
      }

      // Actualizar balance acumulado para TODOS los registros hasta la fecha
      if (effectiveDate <= endOfDay(selectedDate)) {
        if (type === 'ingresos') {
          acc.acumulado[especie][moneda] += amount;
          acc.acumulado.total[moneda] += amount;
        } else {
          acc.acumulado[especie][moneda] -= amount;
          acc.acumulado.total[moneda] -= amount;
        }
      }

    } catch (error) {
      console.error('Error procesando registro:', record, error);
    }
    return acc;
  }, {
    efectivo: {
      ars: { ingresos: 0, egresos: 0 },
      usd: { ingresos: 0, egresos: 0 }
    },
    transferencia: {
      ars: { ingresos: 0, egresos: 0 },
      usd: { ingresos: 0, egresos: 0 }
    },
    acumulado: {
      efectivo: { ars: 0, usd: 0 },
      transferencia: { ars: 0, usd: 0 },
      total: { ars: 0, usd: 0 }
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Wallet className="h-4 w-4" />
          Caja del Día
          {dailyRecords.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {dailyRecords.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Resumen de Efectivo Diario</DialogTitle>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
            <DialogDescription className="flex items-center gap-2">
              <span>Fecha:</span>
              <Input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={handleDateChange}
                className="w-auto"
              />
            </DialogDescription>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {loading ? (
            <div className="flex items-center justify-center py-8 h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Cargando registros...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Balance Acumulado */}
              <div className="rounded-lg border-2 border-primary p-4 mb-4 bg-primary/5 min-w-[500px]">
                <h3 className="font-semibold text-lg mb-3">Balance Acumulado hasta la fecha</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">ARS</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Efectivo:</span>
                        <span className={totals.acumulado.efectivo.ars >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(totals.acumulado.efectivo.ars, 'ars')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Transferencia:</span>
                        <span className={totals.acumulado.transferencia.ars >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(totals.acumulado.transferencia.ars, 'ars')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t font-bold">
                        <span>Total:</span>
                        <span className={totals.acumulado.total.ars >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(totals.acumulado.total.ars, 'ars')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">USD</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Efectivo:</span>
                        <span className={totals.acumulado.efectivo.usd >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(totals.acumulado.efectivo.usd, 'usd')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Transferencia:</span>
                        <span className={totals.acumulado.transferencia.usd >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(totals.acumulado.transferencia.usd, 'usd')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t font-bold">
                        <span>Total:</span>
                        <span className={totals.acumulado.total.usd >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(totals.acumulado.total.usd, 'usd')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Resumen del Día */}
              <div className="rounded-lg border p-4 mb-4 min-w-[500px]">
                <h3 className="font-semibold text-lg mb-3">Movimientos del Día</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">ARS</h4>
                    <div className="text-xl font-bold">
                      {formatCurrency(
                        (totals.efectivo.ars.ingresos + totals.transferencia.ars.ingresos) -
                        (totals.efectivo.ars.egresos + totals.transferencia.ars.egresos),
                        'ars'
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">USD</h4>
                    <div className="text-xl font-bold">
                      {formatCurrency(
                        (totals.efectivo.usd.ingresos + totals.transferencia.usd.ingresos) -
                        (totals.efectivo.usd.egresos + totals.transferencia.usd.egresos),
                        'usd'
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-[500px]">
                <div className="space-y-4">
                  <div className="rounded-lg border p-4 h-full">
                    <h3 className="font-semibold mb-3">Efectivo</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">ARS</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-green-600">Ingresos:</span>
                            <span className="font-medium">{formatCurrency(totals.efectivo.ars.ingresos, 'ars')}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-red-600">Egresos:</span>
                            <span className="font-medium">{formatCurrency(totals.efectivo.ars.egresos, 'ars')}</span>
                          </div>
                          <div className="col-span-2 flex justify-between items-center border-t pt-1">
                            <span>Balance:</span>
                            <span className={`font-medium ${
                              totals.efectivo.ars.ingresos - totals.efectivo.ars.egresos >= 0 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {formatCurrency(totals.efectivo.ars.ingresos - totals.efectivo.ars.egresos, 'ars')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2">USD</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-green-600">Ingresos:</span>
                            <span className="font-medium">{formatCurrency(totals.efectivo.usd.ingresos, 'usd')}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-red-600">Egresos:</span>
                            <span className="font-medium">{formatCurrency(totals.efectivo.usd.egresos, 'usd')}</span>
                          </div>
                          <div className="col-span-2 flex justify-between items-center border-t pt-1">
                            <span>Balance:</span>
                            <span className={`font-medium ${
                              totals.efectivo.usd.ingresos - totals.efectivo.usd.egresos >= 0 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {formatCurrency(totals.efectivo.usd.ingresos - totals.efectivo.usd.egresos, 'usd')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg border p-4 h-full">
                    <h3 className="font-semibold mb-3">Transferencia</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">ARS</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-green-600">Ingresos:</span>
                            <span className="font-medium">{formatCurrency(totals.transferencia.ars.ingresos, 'ars')}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-red-600">Egresos:</span>
                            <span className="font-medium">{formatCurrency(totals.transferencia.ars.egresos, 'ars')}</span>
                          </div>
                          <div className="col-span-2 flex justify-between items-center border-t pt-1">
                            <span>Balance:</span>
                            <span className={`font-medium ${
                              totals.transferencia.ars.ingresos - totals.transferencia.ars.egresos >= 0 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {formatCurrency(totals.transferencia.ars.ingresos - totals.transferencia.ars.egresos, 'ars')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2">USD</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-green-600">Ingresos:</span>
                            <span className="font-medium">{formatCurrency(totals.transferencia.usd.ingresos, 'usd')}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-red-600">Egresos:</span>
                            <span className="font-medium">{formatCurrency(totals.transferencia.usd.egresos, 'usd')}</span>
                          </div>
                          <div className="col-span-2 flex justify-between items-center border-t pt-1">
                            <span>Balance:</span>
                            <span className={`font-medium ${
                              totals.transferencia.usd.ingresos - totals.transferencia.usd.egresos >= 0 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {formatCurrency(totals.transferencia.usd.ingresos - totals.transferencia.usd.egresos, 'usd')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 