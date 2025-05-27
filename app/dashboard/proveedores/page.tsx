"use client"

import { useState, useEffect, useCallback } from "react"
// import { useRouter } from "next/navigation" // Comentado ya que router no se usa
import { toast } from "sonner"
import { IconPlus, IconTags, IconTrash } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProveedoresDataTable } from "@/components/proveedores/proveedores-data-table"
import { NewProveedorDialog } from "@/components/proveedores/new-proveedor-dialog"
import { EditProveedorDialog } from "@/components/proveedores/edit-proveedor-dialog"
import { ViewProveedorDialog } from "@/components/proveedores/view-proveedor-dialog"
import { DeleteProveedorDialog } from "@/components/proveedores/delete-proveedor-dialog"
import { type Proveedor } from "@/components/proveedores/proveedores-data-table"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function ProveedoresPage() {
  // const router = useRouter() // Comentado ya que no se usa
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null)
  
  // Estados para la gestión de categorías
  const [categoriasGlobales, setCategoriasGlobales] = useState<string[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [isManageCategoriasDialogOpen, setIsManageCategoriasDialogOpen] = useState(false);
  const [nuevaCategoriaInput, setNuevaCategoriaInput] = useState("");

  // Cargar categorías globales
  const fetchCategoriasGlobales = useCallback(async () => {
    setLoadingCategorias(true);
    try {
      const response = await fetch('/api/proveedores/categorias');
      const result = await response.json();
      if (result.success && result.data) {
        setCategoriasGlobales(result.data.sort((a: string, b: string) => a.localeCompare(b)));
      } else {
        toast.error(result.error || "Error al cargar categorías globales");
        setCategoriasGlobales([]); // Usar lista vacía o las por defecto del endpoint
      }
    } catch (error) {
      console.error("Error al obtener categorías globales:", error);
      toast.error("Error al conectar con el servidor para categorías");
      setCategoriasGlobales([]);
    } finally {
      setLoadingCategorias(false);
    }
  }, []);

  useEffect(() => {
    fetchCategoriasGlobales();
  }, [fetchCategoriasGlobales]);
  
  // Cargar proveedores al montar el componente
  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        const response = await fetch('/api/proveedores')
        const result = await response.json()
        
        if (result.success) {
          setProveedores(result.data)
        } else {
          toast.error(result.error || "Error al cargar proveedores")
        }
      } catch (error) {
        console.error("Error al obtener proveedores:", error)
        toast.error("Error al conectar con el servidor")
      } finally {
        setLoading(false)
      }
    }
    
    fetchProveedores()
  }, [])
  
  // Manejar la eliminación de un proveedor
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/proveedores?id=${id}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success(result.message || "Proveedor eliminado correctamente")
        // Actualizar la lista de proveedores
        setProveedores(prevProveedores => 
          prevProveedores.filter(proveedor => proveedor.id !== id)
        )
      } else {
        toast.error(result.error || "Error al eliminar el proveedor")
      }
    } catch (error) {
      console.error("Error al eliminar proveedor:", error)
      toast.error("Error al comunicarse con el servidor")
    }
  }
  
  // Manejar la edición de un proveedor
  const handleEdit = (proveedor: Proveedor) => {
    console.log("Seleccionando proveedor para editar:", proveedor);
    setSelectedProveedor(proveedor);
    setIsEditDialogOpen(true);
  }
  
  // Manejar el cierre del diálogo de edición
  const handleEditDialogChange = (open: boolean) => {
    if (!open) {
      // Solo después de cerrar el diálogo, limpiamos el proveedor seleccionado
      setTimeout(() => {
        setSelectedProveedor(null);
      }, 300); // Pequeño retardo para evitar problemas de UI
    }
    setIsEditDialogOpen(open);
  }
  
  // Manejar la visualización de un proveedor
  const handleView = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor)
    setIsViewDialogOpen(true)
  }
  
  // Actualizar la lista cuando se crea un nuevo proveedor
  const handleProveedorCreated = (newProveedor: Proveedor) => {
    setProveedores(prevProveedores => [newProveedor, ...prevProveedores])
  }
  
  // Actualizar la lista cuando se actualiza un proveedor
  const handleProveedorUpdated = (updatedProveedor: Proveedor) => {
    setProveedores(prevProveedores => 
      prevProveedores.map(proveedor => 
        proveedor.id === updatedProveedor.id ? updatedProveedor : proveedor
      )
    )
  }
  
  // Manejar la eliminación de un proveedor
  const handleDeleteClick = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor)
    setIsDeleteDialogOpen(true)
  }
  
  const handleAddCategoriaGlobal = () => {
    const trimmedName = nuevaCategoriaInput.trim();
    if (trimmedName) {
      if (!categoriasGlobales.find(cat => cat.toLowerCase() === trimmedName.toLowerCase())) {
        const updatedCategorias = [...categoriasGlobales, trimmedName].sort((a, b) => a.localeCompare(b));
        setCategoriasGlobales(updatedCategorias);
        // TODO (Opcional): Llamar a una API para persistir esta lista global si fuera necesario
        // Por ahora, solo se actualiza en el estado de esta página.
        toast.success(`Categoría "${trimmedName}" añadida a la lista global.`);
      } else {
        toast.info(`La categoría "${trimmedName}" ya existe.`);
      }
      setNuevaCategoriaInput("");
    } else {
      toast.error("El nombre de la categoría no puede estar vacío.");
    }
  };

  const handleRemoveCategoriaGlobal = (categoriaToRemove: string) => {
    setCategoriasGlobales(prev => prev.filter(cat => cat !== categoriaToRemove));
    // TODO (Opcional): API call si es necesario
    toast.success(`Categoría "${categoriaToRemove}" eliminada de la lista global.`);
    // Nota: Esto no afecta a los proveedores que ya usan esta categoría.
    // Se limpiará la selección en NewProveedorDialog/EditProveedorDialog si la categoría activa se elimina.
  };
  
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                  <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={() => setIsManageCategoriasDialogOpen(true)} className="w-full sm:w-auto">
                      <IconTags className="mr-2 h-4 w-4" />
                      Gestionar Categorías
                    </Button>
                    <Button onClick={() => setIsNewDialogOpen(true)} className="w-full sm:w-auto">
                    <IconPlus className="mr-2 h-4 w-4" />
                    Nuevo Proveedor
                  </Button>
                  </div>
                </div>
                
                <Tabs defaultValue="todos" className="w-full mt-6">
                  <TabsList>
                    <TabsTrigger value="todos">Todos los Proveedores</TabsTrigger>
                  </TabsList>
                  <TabsContent value="todos" className="mt-6">
                    <ProveedoresDataTable 
                      data={proveedores} 
                      loading={loading} 
                      onDelete={handleDeleteClick}
                      onEdit={handleEdit}
                      onView={handleView}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
      
      {/* Diálogo para crear un nuevo proveedor */}
      <NewProveedorDialog 
        open={isNewDialogOpen} 
        onOpenChange={setIsNewDialogOpen}
        onProveedorCreated={handleProveedorCreated}
        categoriasDisponibles={categoriasGlobales}
      />
      
      {/* Diálogo para editar un proveedor */}
      <EditProveedorDialog 
        proveedor={selectedProveedor}
        open={isEditDialogOpen} 
        onOpenChange={handleEditDialogChange}
        onProveedorUpdated={handleProveedorUpdated}
        categoriasDisponibles={categoriasGlobales}
      />
      
      {/* Diálogo para ver detalles de un proveedor */}
      <ViewProveedorDialog 
        proveedor={selectedProveedor}
        open={isViewDialogOpen} 
        onOpenChange={setIsViewDialogOpen}
      />
      
      {/* Diálogo para eliminar un proveedor */}
      <DeleteProveedorDialog 
        proveedor={selectedProveedor}
        open={isDeleteDialogOpen} 
        onOpenChange={setIsDeleteDialogOpen}
        onProveedorDeleted={handleDelete}
      />

      {/* Diálogo de Gestión de Categorías */}
      <Dialog open={isManageCategoriasDialogOpen} onOpenChange={setIsManageCategoriasDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gestionar Categorías Globales</DialogTitle>
            <DialogDescription>
              Añada o elimine categorías de la lista global disponible para proveedores.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="new-categoria-global-input">Añadir nueva categoría</Label>
              <div className="flex gap-2 mt-1">
                <Input 
                  id="new-categoria-global-input"
                  value={nuevaCategoriaInput}
                  onChange={(e) => setNuevaCategoriaInput(e.target.value)}
                  placeholder="Nombre de la categoría"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategoriaGlobal(); } }}
                />
                <Button onClick={handleAddCategoriaGlobal}><IconPlus className="h-4 w-4" /></Button>
              </div>
            </div>
            
            {loadingCategorias ? (
              <p>Cargando categorías...</p>
            ) : categoriasGlobales.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                <Label>Categorías existentes</Label>
                {categoriasGlobales.map((cat) => (
                  <div key={cat} className="flex items-center justify-between gap-2 p-2 border rounded-md">
                    <span>{cat}</span>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveCategoriaGlobal(cat)}>
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay categorías definidas.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManageCategoriasDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
} 