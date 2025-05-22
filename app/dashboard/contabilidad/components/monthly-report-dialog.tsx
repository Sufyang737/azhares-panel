import { useState } from "react";
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
import { CalendarIcon, TrendingUpIcon, TrendingDownIcon, ClockIcon } from "lucide-react";
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

interface MonthlyReportDialogProps {
  records: ContabilidadRecord[];
}

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
  records: ContabilidadRecord[];
  pendingRecords: ContabilidadRecord[];
}

export function MonthlyReportDialog({ records }: MonthlyReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return format(now, 'yyyy-MM');
  });

  // Generar lista de meses disponibles
  const availableMonths = Array.from(
    new Set(
      records.map(record => {
        const date = parseISO(record.created);
        return format(date, 'yyyy-MM');
      })
    )
  ).sort().reverse();

  // Filtrar y agrupar registros por mes
  const getMonthlyData = (yearMonth: string): MonthlyTotals => {
    const [year, month] = yearMonth.split('-').map(Number);
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));

    const monthlyRecords = records.filter(record => {
      const date = parseISO(record.created);
      return date >= startDate && date <= endDate;
    });

    return monthlyRecords.reduce(
      (acc: MonthlyTotals, record) => {
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
      },
      {
        ingresos: { ars: 0, usd: 0 },
        egresos: { ars: 0, usd: 0 },
        pendientes: {
          ingresos: { ars: 0, usd: 0 },
          egresos: { ars: 0, usd: 0 }
        },
        records: [],
        pendingRecords: []
      }
    );
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

              <div className="grid grid-cols-2 gap-4">
                {/* Resumen General */}
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold mb-3">Resumen General</h3>
                    
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
                          <span>Balance:</span>
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
                          <span>Balance:</span>
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
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
} 