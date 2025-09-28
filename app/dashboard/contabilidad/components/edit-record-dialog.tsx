'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";
import { Edit2 } from "lucide-react";
import { ContabilidadRecord, updateContabilidadRecord } from "@/app/services/contabilidad";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

interface EditRecordDialogProps {
  record: ContabilidadRecord;
  onRecordUpdate?: () => void;
}

type FormData = {
  type: ContabilidadRecord['type'];
  especie: Extract<ContabilidadRecord['especie'], 'efectivo' | 'transferencia'>;
  moneda: ContabilidadRecord['moneda'];
  categoria: ContabilidadRecord['categoria'];
  subcargo: ContabilidadRecord['subcargo'];
  detalle: ContabilidadRecord['detalle'] | '';
  montoEspera: number;
  fechaEspera: Date;
};

export function EditRecordDialog({ record, onRecordUpdate }: EditRecordDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    type: record.type,
    especie: (record.especie === 'trasferencia' ? 'transferencia' : record.especie) as FormData['especie'],
    moneda: record.moneda,
    montoEspera: record.montoEspera,
    categoria: record.categoria,
    subcargo: record.subcargo,
    detalle: (record.detalle ?? '') as FormData['detalle'],
    fechaEspera: record.fechaEspera ? parseISO(record.fechaEspera) : new Date(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { detalle, fechaEspera, ...rest } = formData;
      await updateContabilidadRecord(record.id, {
        ...rest,
        detalle: detalle === '' ? null : detalle,
        fechaEspera: format(fechaEspera, 'yyyy-MM-dd'),
      });

      toast({
        title: "Registro actualizado",
        description: "El registro ha sido actualizado exitosamente.",
      });

      if (onRecordUpdate) {
        onRecordUpdate();
      }

      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar el registro",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Edit2 className="h-4 w-4" />
          <span className="sr-only">Editar registro</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Registro</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tipo de registro */}
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Registro</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'cobro' | 'pago') => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cobro">Cobro</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Especie */}
              <div className="space-y-2">
                <Label htmlFor="especie">Especie</Label>
                <Select
                  value={formData.especie}
                  onValueChange={(value: 'efectivo' | 'transferencia') => setFormData({ ...formData, especie: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar especie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Moneda */}
              <div className="space-y-2">
                <Label htmlFor="moneda">Moneda</Label>
                <Select
                  value={formData.moneda}
                  onValueChange={(value: 'ars' | 'usd') => setFormData({ ...formData, moneda: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ars">ARS</SelectItem>
                    <SelectItem value="usd">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Monto */}
              <div className="space-y-2">
                <Label htmlFor="montoEspera">Monto</Label>
                <Input
                  id="montoEspera"
                  type="number"
                  value={formData.montoEspera}
                  onChange={(e) => setFormData({ ...formData, montoEspera: parseFloat(e.target.value) })}
                />
              </div>

              {/* Categoría */}
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value: 'evento' | 'oficina') => setFormData({ ...formData, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="evento">Evento</SelectItem>
                    <SelectItem value="oficina">Oficina</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Subcargo */}
              <div className="space-y-2">
                <Label htmlFor="subcargo">Subcargo</Label>
                <Select
                  value={formData.subcargo}
                  onValueChange={(value: FormData['subcargo']) => setFormData({ ...formData, subcargo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar subcargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clientes">Clientes</SelectItem>
                    <SelectItem value="otros">Otros</SelectItem>
                    <SelectItem value="proveedores">Proveedores</SelectItem>
                    <SelectItem value="sueldos">Sueldos</SelectItem>
                    <SelectItem value="mensajeria">Mensajería</SelectItem>
                    <SelectItem value="cambio-divisas">Cambio de Divisas</SelectItem>
                    <SelectItem value="ajuste-caja">Ajuste de Caja</SelectItem>
                    <SelectItem value="obra-social-empleada">Obra Social Empleada</SelectItem>
                    <SelectItem value="mantencion-cuenta-corriente">Mantención Cuenta Corriente</SelectItem>
                    <SelectItem value="seguro-galicia">Seguro Galicia</SelectItem>
                    <SelectItem value="tarjeta-credito">Tarjeta de Crédito</SelectItem>
                    <SelectItem value="deriva">Deriva</SelectItem>
                    <SelectItem value="expensas">Expensas</SelectItem>
                    <SelectItem value="alquiler">Alquiler</SelectItem>
                    <SelectItem value="prepaga">Prepaga</SelectItem>
                    <SelectItem value="contador">Contador</SelectItem>
                    <SelectItem value="mantenimiento-pc">Mantenimiento PC</SelectItem>
                    <SelectItem value="impuestos">Impuestos</SelectItem>
                    <SelectItem value="servicios">Servicios</SelectItem>
                    <SelectItem value="regaleria">Regalería</SelectItem>
                    <SelectItem value="compras">Compras</SelectItem>
                    <SelectItem value="caja-chica">Caja chica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fecha Esperada */}
              <div className="space-y-2">
                <Label>Fecha Esperada</Label>
                <DatePicker
                  date={formData.fechaEspera}
                  setDate={(date) => date && setFormData({ ...formData, fechaEspera: date })}
                />
              </div>
            </div>

            {/* Detalle */}
            <div className="space-y-2">
              <Label htmlFor="detalle">Detalle</Label>
              <Select
                value={formData.detalle}
                onValueChange={(value: FormData['detalle']) => setFormData({ ...formData, detalle: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar detalle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compra-usd">Compra USD</SelectItem>
                  <SelectItem value="comision">Comisión</SelectItem>
                  <SelectItem value="handy">Handy</SelectItem>
                  <SelectItem value="honorarios">Honorarios</SelectItem>
                  <SelectItem value="maquillaje">Maquillaje</SelectItem>
                  <SelectItem value="maquilllaje">Maquilllaje</SelectItem>
                  <SelectItem value="planner">Planner</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="viandas">Viandas</SelectItem>
                  <SelectItem value="venta-usd">Venta USD</SelectItem>
                  <SelectItem value="viatico">Viático</SelectItem>
                  <SelectItem value="seguro">Seguro</SelectItem>
                  <SelectItem value="Noe">Noe</SelectItem>
                  <SelectItem value="Loli">Loli</SelectItem>
                  <SelectItem value="otros">Otros</SelectItem>
                  <SelectItem value="iva">IVA</SelectItem>
                  <SelectItem value="ingresos-brutos">Ingresos Brutos</SelectItem>
                  <SelectItem value="formulado-931">Formulario 931</SelectItem>
                  <SelectItem value="OFCECA">OFCECA</SelectItem>
                  <SelectItem value="abl">ABL</SelectItem>
                  <SelectItem value="internet">Internet</SelectItem>
                  <SelectItem value="agua">Agua</SelectItem>
                  <SelectItem value="luz">Luz</SelectItem>
                  <SelectItem value="autonomo">Autónomo</SelectItem>
                  <SelectItem value="telefono">Teléfono</SelectItem>
                  <SelectItem value="prosegur">Prosegur</SelectItem>
                  <SelectItem value="mayorista">Mayorista</SelectItem>
                  <SelectItem value="coto">Coto</SelectItem>
                  <SelectItem value="libreria">Librería</SelectItem>
                  <SelectItem value="cerrajeria">Cerrajería</SelectItem>
                  <SelectItem value="cafe">Café</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
