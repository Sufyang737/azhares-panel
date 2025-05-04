"use client";

import { useState, useEffect } from "react";
import { 
  IconPlus, 
  IconFilter, 
  IconDownload, 
  IconCoins, 
  IconCash, 
  IconTrendingUp, 
  IconEdit 
} from "@tabler/icons-react";

import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContabilidadDataTable } from "@/components/contabilidad/contabilidad-data-table";
import { NewContabilidadDialog } from "@/components/contabilidad/new-contabilidad-dialog";
import { EditContabilidadDialog, type FormValues as EditFormValues } from "@/components/contabilidad/edit-contabilidad-dialog";
import { ViewContabilidadDialog } from "@/components/contabilidad/view-contabilidad-dialog";
import { DeleteContabilidadDialog } from "@/components/contabilidad/delete-contabilidad-dialog";
import { toast } from "sonner";

// Tipos de datos para contabilidad
export type Contabilidad = {
  id: string;
  comentario: string | null;
  type: string;
  especie: string;
  moneda: string;
  categoria: string;
  subcargo: string;
  detalle: string;
  fechaEspera: string;
  cliente_id: string | null;
  proveedor_id: string | null;
  evento_id: string | null;
  equipo_id: string | null;
  dolarEsperado: number | null;
  fechaEfectuado: string | null;
  montoEspera: number | null;
  created: string;
  updated: string;
};

// Tipo extendido para incluir dolarEsperado si no está en FormValues
type FormValues = EditFormValues & {
  dolarEsperado?: number | null;
};

// Custom hook para obtener cotización del dólar blue
const useDolarBlue = () => {
  const [dolarBlue, setDolarBlue] = useState<{ compra: number, venta: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDolarBlue = async () => {
      setLoading(true)
      try {
        const response = await fetch('https://dolarapi.com/v1/dolares/blue')
        if (!response.ok) {
          throw new Error(`Error al obtener cotización: ${response.status}`)
        }
        const data = await response.json()
        setDolarBlue({
          compra: data.compra,
          venta: data.venta
        })
      } catch (err) {
        console.error('Error fetching dolar blue:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchDolarBlue()
  }, [])

  return { dolarBlue, loading, error }
}

// Cards para el resumen financiero
const FinancialSummaryCards = ({ registros }: { registros: Contabilidad[] }) => {
  const { dolarBlue, loading: dolarLoading } = useDolarBlue()
  
  // Añadir el cálculo de ingresos/egresos en ARS y USD
  const calcularResumenFinanciero = (registrosData: Contabilidad[]) => {
    let ingresosPesos = 0
    let egresosPesos = 0
    let ingresosDolares = 0
    let egresosDolares = 0
    let pendientes = 0
    let montoPendiente = 0

    registrosData.forEach(registro => {
      const monto = registro.montoEspera || 0
      
      // Contar pendientes
      if (!registro.fechaEfectuado) {
        pendientes++
        montoPendiente += registro.moneda === 'usd' 
          ? monto * (dolarBlue?.venta || 1) 
          : monto
      }
      
      // Sumar por tipo y moneda
      if (registro.type === 'cobro') {
        if (registro.moneda === 'ars') {
          ingresosPesos += monto
        } else if (registro.moneda === 'usd') {
          ingresosDolares += monto
        }
      } else if (registro.type === 'pago') {
        if (registro.moneda === 'ars') {
          egresosPesos += monto
        } else if (registro.moneda === 'usd') {
          egresosDolares += monto
        }
      }
    })

    // Convertir todo a pesos para el total
    const ingresosTotalPesos = ingresosPesos + (ingresosDolares * (dolarBlue?.venta || 1))
    const egresosTotalPesos = egresosPesos + (egresosDolares * (dolarBlue?.venta || 1))
    const balancePesos = ingresosTotalPesos - egresosTotalPesos

    return {
      ingresosPesos,
      egresosPesos,
      ingresosDolares,
      egresosDolares, 
      ingresosTotalPesos,
      egresosTotalPesos,
      balancePesos,
      pendientes,
      montoPendiente
    }
  }
  
  // Usar los datos calculados
  const resumen = calcularResumenFinanciero(registros)
  
  // Función auxiliar para formatear montos
  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(monto)
  }
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
          <IconCoins className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${formatMonto(resumen.ingresosTotalPesos)} ARS
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            ${formatMonto(resumen.ingresosDolares)} USD · ${formatMonto(resumen.ingresosPesos)} ARS
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
          <IconCash className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${formatMonto(resumen.egresosTotalPesos)} ARS</div>
          <p className="text-xs text-muted-foreground mt-1">
            ${formatMonto(resumen.egresosDolares)} USD · ${formatMonto(resumen.egresosPesos)} ARS
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Balance</CardTitle>
          <IconTrendingUp className={`h-4 w-4 ${resumen.balancePesos >= 0 ? 'text-green-500' : 'text-red-500'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${resumen.balancePesos >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${formatMonto(resumen.balancePesos)} ARS
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {dolarBlue ? (
              <>Dólar Blue: ${dolarBlue.compra}/${dolarBlue.venta} ARS</>
            ) : dolarLoading ? (
              <>Cargando cotización...</>
            ) : (
              <>Cotización no disponible</>
            )}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-yellow-500"
          >
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{resumen.pendientes} transacciones</div>
          <p className="text-xs text-muted-foreground mt-1">
            ${formatMonto(resumen.montoPendiente)} ARS en espera
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default function ContabilidadPage() {
  const [registros, setRegistros] = useState<Contabilidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRegistro, setSelectedRegistro] = useState<Contabilidad | null>(null);
  
  // Función para cargar registros
  const fetchRegistros = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/contabilidad');
      
      if (!response.ok) {
        throw new Error(`Error al obtener registros: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const processedData = data.map(registro => ({
          ...registro,
          montoEspera: registro.montoEspera ? Number(registro.montoEspera) : null,
          dolarEsperado: registro.dolarEsperado ? Number(registro.dolarEsperado) : null,
          fechaEspera: registro.fechaEspera || new Date().toISOString(),
          fechaEfectuado: registro.fechaEfectuado || null,
          created: registro.created || new Date().toISOString(),
          updated: registro.updated || new Date().toISOString()
        }));
        setRegistros(processedData);
      } else {
        console.error("Formato de datos inválido:", data);
        toast.error("Error: Los datos recibidos no tienen el formato esperado");
      }
    } catch (error) {
      console.error("Error al obtener registros:", error);
      toast.error("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };
  
  // Cargar registros al montar el componente
  useEffect(() => {
    fetchRegistros();
  }, []);
  
  // Manejar la eliminación de un registro
  const handleDelete = async (id: string) => {
    try {
      // Llamar a la API para eliminar el registro
      const response = await fetch(`/api/contabilidad?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error al eliminar: ${response.statusText}`);
      }
      
      toast.success("Registro eliminado correctamente");
      
      // Actualizar la lista de registros
      await fetchRegistros();
    } catch (error) {
      console.error("Error al eliminar registro:", error);
      toast.error("Error al comunicarse con el servidor");
    }
  };
  
  // Manejar la edición de un registro
  const handleEdit = (registro: Contabilidad) => {
    setSelectedRegistro(registro);
    setIsEditDialogOpen(true);
  };
  
  // Manejar la visualización de un registro
  const handleView = (registro: Contabilidad) => {
    setSelectedRegistro(registro);
    setIsViewDialogOpen(true);
  };
  
  // Manejar la eliminación de un registro
  const handleDeleteClick = (registro: Contabilidad) => {
    setSelectedRegistro(registro);
    setIsDeleteDialogOpen(true);
  };
  
  // Manejar la creación de un nuevo registro
  const handleRegistroCreated = async (newRegistro: Contabilidad) => {
    try {
      // Preparar los datos para enviar a la API
      const formData = new FormData();
      
      // Añadir todos los campos al FormData
      Object.entries(newRegistro).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });
      
      // Enviar a la API
      const response = await fetch('/api/contabilidad', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Error al crear registro: ${response.statusText}`);
      }
      
      // Recargar todos los registros
      await fetchRegistros();
      toast.success("Registro creado correctamente");
    } catch (error) {
      console.error("Error al crear registro:", error);
      toast.error("Error al comunicarse con el servidor");
    }
  };
  
  // Función para manejar la actualización de un registro desde el formulario
  const handleSaveEdit = async (values: FormValues) => {
    try {
      // Crear un objeto Contabilidad a partir de los valores del formulario
      const updatedRegistro: Contabilidad = {
        id: values.id,
        type: values.type,
        categoria: values.categoria,
        subcargo: values.subcargo || '',
        detalle: values.detalle || '',
        especie: values.especie,
        comentario: values.comentario || null,
        moneda: values.moneda,
        montoEspera: values.montoEspera,
        fechaEspera: values.fechaEspera instanceof Date 
          ? values.fechaEspera.toISOString() 
          : String(values.fechaEspera),
        fechaEfectuado: values.fechaEfectuado
          ? (values.fechaEfectuado instanceof Date 
            ? values.fechaEfectuado.toISOString() 
            : String(values.fechaEfectuado))
          : null,
        cliente_id: values.cliente_id || null,
        proveedor_id: values.proveedor_id || null,
        evento_id: values.evento_id || null,
        equipo_id: values.equipo_id || null,
        dolarEsperado: typeof values.dolarEsperado === 'number' ? values.dolarEsperado : null,
        created: values.created || new Date().toISOString(),
        updated: new Date().toISOString()
      };
      
      // Preparar los datos para enviar a la API
      const formData = new FormData();
      
      // Añadir todos los campos al FormData
      Object.entries(updatedRegistro).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });
      
      // Llamar a la API para actualizar el registro
      const response = await fetch(`/api/contabilidad?id=${values.id}`, {
        method: 'PUT',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Error al actualizar: ${response.statusText}`);
      }
      
      // Recargar todos los registros
      await fetchRegistros();
      toast.success("Registro actualizado correctamente");
    } catch (error) {
      console.error("Error al actualizar registro:", error);
      toast.error("Error al comunicarse con el servidor");
    }
  };
  
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="px-4 lg:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Contabilidad</h1>
              <p className="text-muted-foreground">Gestiona los ingresos y egresos de tu negocio</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button variant="outline" size="sm">
                <IconFilter className="mr-2 h-4 w-4" />
                Filtrar
              </Button>
              <Button variant="outline" size="sm">
                <IconDownload className="mr-2 h-4 w-4" />
                Exportar
              </Button>
              <Button onClick={() => setIsNewDialogOpen(true)}>
                <IconPlus className="mr-2 h-4 w-4" />
                Nuevo Registro
              </Button>
            </div>
          </div>
        </div>
        
        <div className="px-4 lg:px-6">
          <FinancialSummaryCards registros={registros} />
        </div>
        
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive registros={registros} />
        </div>
        
        <div className="px-4 lg:px-6">
          <Tabs defaultValue="todos" className="w-full">
            <TabsList>
              <TabsTrigger value="todos">Todos los Registros</TabsTrigger>
              <TabsTrigger value="cobros">Cobros</TabsTrigger>
              <TabsTrigger value="pagos">Pagos</TabsTrigger>
              <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
            </TabsList>
            <TabsContent value="todos" className="mt-6">
              <ContabilidadDataTable 
                data={registros} 
                loading={loading} 
                onDelete={handleDeleteClick}
                onEdit={handleEdit}
                onView={handleView}
              />
            </TabsContent>
            <TabsContent value="cobros" className="mt-6">
              <ContabilidadDataTable 
                data={registros.filter(r => r.type === 'cobro')} 
                loading={loading} 
                onDelete={handleDeleteClick}
                onEdit={handleEdit}
                onView={handleView}
              />
            </TabsContent>
            <TabsContent value="pagos" className="mt-6">
              <ContabilidadDataTable 
                data={registros.filter(r => r.type === 'pago')} 
                loading={loading} 
                onDelete={handleDeleteClick}
                onEdit={handleEdit}
                onView={handleView}
              />
            </TabsContent>
            <TabsContent value="pendientes" className="mt-6">
              <ContabilidadDataTable 
                data={registros.filter(r => r.fechaEfectuado === null)} 
                loading={loading} 
                onDelete={handleDeleteClick}
                onEdit={handleEdit}
                onView={handleView}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Diálogo para crear un nuevo registro */}
      <NewContabilidadDialog 
        open={isNewDialogOpen} 
        onOpenChange={setIsNewDialogOpen}
        onRegistroCreated={handleRegistroCreated}
      />
      
      {/* Diálogo para editar un registro */}
      <EditContabilidadDialog 
        registro={selectedRegistro}
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveEdit}
        onDelete={handleDelete}
      />
      
      {/* Diálogo para ver detalles de un registro */}
      <ViewContabilidadDialog 
        registro={selectedRegistro}
        open={isViewDialogOpen} 
        onOpenChange={setIsViewDialogOpen}
      />
      
      {/* Diálogo para eliminar un registro */}
      <DeleteContabilidadDialog 
        registro={selectedRegistro}
        open={isDeleteDialogOpen} 
        onOpenChange={setIsDeleteDialogOpen}
        onRegistroDeleted={handleDelete}
      />
    </div>
  );
}
