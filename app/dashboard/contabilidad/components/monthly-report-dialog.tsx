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
import { format, isValid, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { ContabilidadRecord } from "@/app/services/contabilidad";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return 'Fecha inválida';
    return format(date, 'dd/MM/yyyy', { locale: es });
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

interface MonthlyTotals {
  ingresos: {
    ars: number;
    usd: number;
  };
  egresos: {
    ars: number;
    usd: number;
  };
  pendientes: {
    ingresos: {
      ars: number;
      usd: number;
    };
    egresos: {
      ars: number;
      usd: number;
    };
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
  records: ContabilidadRecord[];
  pendingRecords: ContabilidadRecord[];
}

export function MonthlyReportDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allRecords, setAllRecords] = useState<ContabilidadRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return format(now, 'yyyy-MM');
  });

  // Cargar los registros cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      loadRecordsForMonth(selectedMonth);
    }
  }, [open, selectedMonth]);

  const loadRecordsForMonth = async (yearMonth: string) => {
    setLoading(true);
    try {
      const [year, month] = yearMonth.split('-').map(Number);
      const startDate = startOfMonth(new Date(year, month - 1));
      const endDate = endOfMonth(new Date(year, month - 1));

      // Obtener registros hasta el fin del mes seleccionado
      const response = await fetch('/api/contabilidad?' + new URLSearchParams({
        sort: '-created',
        expand: 'cliente_id,evento_id,proveedor_id',
        filter: `created >= "${format(startDate, 'yyyy-MM-dd')} 00:00:00" && created <= "${format(endDate, 'yyyy-MM-dd')} 23:59:59"`,
      }));

      if (!response.ok) {
        throw new Error('Error al cargar los registros');
      }

      // También necesitamos cargar los registros anteriores para el balance acumulado
      const accumulatedResponse = await fetch('/api/contabilidad?' + new URLSearchParams({
        sort: '-created',
        filter: `fechaEfectuado < "${format(startDate, 'yyyy-MM-dd')} 00:00:00"`,
      }));

      if (!accumulatedResponse.ok) {
        throw new Error('Error al cargar los registros acumulados');
      }

      const monthData = await response.json();
      const accumulatedData = await accumulatedResponse.json();
      
      // Combinar los registros del mes actual con los acumulados anteriores
      setAllRecords([...monthData.items, ...accumulatedData.items]);
    } catch (error) {
      console.error('Error al cargar los registros:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generar lista de meses disponibles (últimos 12 meses)
  const availableMonths = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return format(date, 'yyyy-MM');
  });

  // Filtrar y agrupar registros por mes
  const getMonthlyData = (yearMonth: string): MonthlyTotals => {
    const [year, month] = yearMonth.split('-').map(Number);
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));

    // Filtrar registros del mes seleccionado
    const monthlyRecords = allRecords.filter(record => {
      const date = parseISO(record.created);
      return date >= startDate && date <= endDate;
    });

    // Inicializar el acumulador
    const initialAcc: MonthlyTotals = {
      ingresos: { ars: 0, usd: 0 },
      egresos: { ars: 0, usd: 0 },
      pendientes: {
        ingresos: { ars: 0, usd: 0 },
        egresos: { ars: 0, usd: 0 }
      },
      acumulado: {
        efectivo: { ars: 0, usd: 0 },
        transferencia: { ars: 0, usd: 0 },
        total: { ars: 0, usd: 0 }
      },
      records: [],
      pendingRecords: []
    };

    // Calcular totales del mes
    const monthlyTotals = monthlyRecords.reduce((acc, record) => {
      const moneda = record.moneda.toLowerCase() as 'ars' | 'usd';
      const type = record.type === 'cobro' ? 'ingresos' : 'egresos';
      const isPending = !record.fechaEfectuado;

      if (isPending) {
        acc.pendientes[type][moneda] += record.montoEspera;
        acc.pendingRecords.push(record);
      } else {
        acc[type][moneda] += record.montoEspera;
        acc.records.push(record);
      }

      return acc;
    }, initialAcc);

    // Calcular balance acumulado (usando todos los registros hasta la fecha)
    allRecords.forEach(record => {
      if (record.fechaEfectuado) {
        const recordDate = parseISO(record.fechaEfectuado);
        if (recordDate <= endDate) {
          const moneda = record.moneda.toLowerCase() as 'ars' | 'usd';
          const amount = record.montoEspera;
          const especie = record.especie?.toLowerCase() || 'efectivo';
          const isIngreso = record.type === 'cobro';

          // Actualizar balance por especie
          if (especie === 'efectivo' || especie === 'transferencia') {
            if (isIngreso) {
              monthlyTotals.acumulado[especie][moneda] += amount;
              monthlyTotals.acumulado.total[moneda] += amount;
            } else {
              monthlyTotals.acumulado[especie][moneda] -= amount;
              monthlyTotals.acumulado.total[moneda] -= amount;
            }
          }
        }
      }
    });

    return monthlyTotals;
  };

  const monthlyData = getMonthlyData(selectedMonth);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CalendarIcon className="h-4 w-4" />
          Reporte Mensual
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw]">
        <DialogHeader>
          <DialogTitle>Reporte Mensual</DialogTitle>
          <DialogDescription asChild>
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Cargando registros...</span>
                </div>
              ) : (
                <>
                  <div className="mt-4 mb-6">
                    <Select
                      value={selectedMonth}
                      onValueChange={setSelectedMonth}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Selecciona un mes" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMonths.map((month) => (
                          <SelectItem key={month} value={month}>
                            {format(parseISO(`${month}-01`), 'MMMM yyyy', { locale: es })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

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

                    {/* Transacciones Pendientes Lista */}
                    <div className="rounded-lg border p-4">
                      <h3 className="font-semibold mb-3">Lista de Transacciones Pendientes</h3>
                      <div className="max-h-[500px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Moneda</TableHead>
                              <TableHead>Monto</TableHead>
                              <TableHead>Fecha Esperada</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {monthlyData.pendingRecords.map((record) => (
                              <TableRow key={record.id}>
                                <TableCell>
                                  <Badge variant={record.type === 'cobro' ? 'default' : 'destructive'}>
                                    {record.type}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={record.moneda === 'usd' ? 'outline' : 'secondary'}>
                                    {record.moneda.toUpperCase()}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono">
                                  {formatCurrency(record.montoEspera, record.moneda)}
                                </TableCell>
                                <TableCell>{formatDate(record.fechaEspera)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
} 