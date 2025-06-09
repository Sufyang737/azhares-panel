'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format, isValid, parseISO, startOfDay, endOfDay, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { Wallet, Calendar as CalendarIcon } from "lucide-react";
import { ContabilidadRecord } from "@/app/services/contabilidad";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

interface DailyCashDialogProps {
  records: ContabilidadRecord[];
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return 'Fecha inválida';
    return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return 'Error en fecha';
  }
};

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
}

export function DailyCashDialog({ records }: DailyCashDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Función para manejar el cambio de fecha
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(event.target.value);
    if (isValid(newDate)) {
      setSelectedDate(newDate);
    }
  };

  // Filtrar registros según la fecha seleccionada
  const filteredRecords = records.filter(record => {
    if (!record.fechaEfectuado) return false;
    
    const startOfSelectedDay = startOfDay(selectedDate);
    const endOfSelectedDay = endOfDay(selectedDate);
    const effectiveDate = new Date(record.fechaEfectuado);
    
    return effectiveDate >= startOfSelectedDay && effectiveDate <= endOfSelectedDay;
  });

  console.log('Registros encontrados para la fecha:', filteredRecords.length);
  console.log('Registros del día:', filteredRecords);

  // Calcular totales
  const totals = filteredRecords.reduce((acc: CashTotals, record) => {
    try {
      const amount = record.montoEspera || 0;
      const especie = record.especie?.toLowerCase();
      const moneda = record.moneda?.toLowerCase();
      const type = record.type === 'cobro' ? 'ingresos' : 'egresos';

      // Validar que los valores sean correctos
      if (especie !== 'efectivo' && especie !== 'transferencia') {
        console.warn('Especie inválida:', especie, record);
        return acc;
      }

      if (moneda !== 'ars' && moneda !== 'usd') {
        console.warn('Moneda inválida:', moneda, record);
        return acc;
      }

      // Asegurarnos de que la estructura existe
      if (!acc[especie]) {
        acc[especie] = {
          ars: { ingresos: 0, egresos: 0 },
          usd: { ingresos: 0, egresos: 0 }
        };
      }

      if (!acc[especie][moneda]) {
        acc[especie][moneda] = { ingresos: 0, egresos: 0 };
      }

      if (!acc[especie][moneda][type]) {
        acc[especie][moneda][type] = 0;
      }

      // Sumar el monto
      acc[especie][moneda][type] += amount;
      console.log(`Sumando ${amount} a ${especie} ${moneda} ${type}`);
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
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Wallet className="h-4 w-4" />
          Caja del Día
          {filteredRecords.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {filteredRecords.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw]">
        <DialogHeader>
          <DialogTitle>Resumen de Efectivo Diario</DialogTitle>
          <div className="flex items-center gap-4">
            <DialogDescription className="flex items-center gap-2">
              Fecha:
              <Input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={handleDateChange}
                className="w-auto"
              />
            </DialogDescription>
          </div>
        </DialogHeader>
        
        {/* Resumen Total */}
        <div className="rounded-lg border-2 border-primary p-4 mb-4 bg-primary/5">
          <h3 className="font-semibold text-lg mb-3">Balance Total del Día</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">ARS</h4>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  (totals.efectivo.ars.ingresos + totals.transferencia.ars.ingresos) -
                  (totals.efectivo.ars.egresos + totals.transferencia.ars.egresos),
                  'ars'
                )}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">USD</h4>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  (totals.efectivo.usd.ingresos + totals.transferencia.usd.ingresos) -
                  (totals.efectivo.usd.egresos + totals.transferencia.usd.egresos),
                  'usd'
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
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
            
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-3">Transferencias</h3>
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

          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-3">Total del Día</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">ARS</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-green-600">Ingresos:</span>
                      <span className="font-medium">{formatCurrency(totals.efectivo.ars.ingresos + totals.transferencia.ars.ingresos, 'ARS')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-red-600">Egresos:</span>
                      <span className="font-medium">{formatCurrency(totals.efectivo.ars.egresos + totals.transferencia.ars.egresos, 'ARS')}</span>
                    </div>
                    <div className="col-span-2 flex justify-between items-center border-t pt-1">
                      <span>Balance:</span>
                      <span className="font-medium">{formatCurrency(
                        (totals.efectivo.ars.ingresos + totals.transferencia.ars.ingresos) - 
                        (totals.efectivo.ars.egresos + totals.transferencia.ars.egresos), 
                        'ARS'
                      )}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">USD</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-green-600">Ingresos:</span>
                      <span className="font-medium">{formatCurrency(totals.efectivo.usd.ingresos + totals.transferencia.usd.ingresos, 'USD')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-red-600">Egresos:</span>
                      <span className="font-medium">{formatCurrency(totals.efectivo.usd.egresos + totals.transferencia.usd.egresos, 'USD')}</span>
                    </div>
                    <div className="col-span-2 flex justify-between items-center border-t pt-1">
                      <span>Balance:</span>
                      <span className="font-medium">{formatCurrency(
                        (totals.efectivo.usd.ingresos + totals.transferencia.usd.ingresos) - 
                        (totals.efectivo.usd.egresos + totals.transferencia.usd.egresos), 
                        'USD'
                      )}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 