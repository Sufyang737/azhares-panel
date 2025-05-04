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
import { Wallet } from "lucide-react";
import { ContabilidadRecord } from "@/app/services/contabilidad";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

  // Filtrar registros del día actual que estén efectuados
  const todayRecords = records.filter(record => {
    if (!record.fechaEfectuado) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const effectiveDate = new Date(record.fechaEfectuado);
    
    return effectiveDate >= today && effectiveDate < tomorrow;
  });

  console.log('Registros encontrados para hoy:', todayRecords.length);
  console.log('Registros del día:', todayRecords);

  // Calcular totales
  const totals = todayRecords.reduce((acc: CashTotals, record) => {
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
          {todayRecords.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {todayRecords.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw]">
        <DialogHeader>
          <DialogTitle>Resumen de Efectivo Diario</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-3">Efectivo</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>ARS</span>
                  <span className="font-medium">{formatCurrency(totals.efectivo.ars.ingresos - totals.efectivo.ars.egresos, 'ARS')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>USD</span>
                  <span className="font-medium">{formatCurrency(totals.efectivo.usd.ingresos - totals.efectivo.usd.egresos, 'USD')}</span>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-3">Transferencias</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>ARS</span>
                  <span className="font-medium">{formatCurrency(totals.transferencia.ars.ingresos - totals.transferencia.ars.egresos, 'ARS')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>USD</span>
                  <span className="font-medium">{formatCurrency(totals.transferencia.usd.ingresos - totals.transferencia.usd.egresos, 'USD')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-3">Total</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>ARS</span>
                  <span className="font-medium">{formatCurrency(totals.efectivo.ars.ingresos - totals.efectivo.ars.egresos + totals.transferencia.ars.ingresos - totals.transferencia.ars.egresos, 'ARS')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>USD</span>
                  <span className="font-medium">{formatCurrency(totals.efectivo.usd.ingresos - totals.efectivo.usd.egresos + totals.transferencia.usd.ingresos - totals.transferencia.usd.egresos, 'USD')}</span>
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