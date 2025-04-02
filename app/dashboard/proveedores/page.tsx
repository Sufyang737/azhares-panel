"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { IconPlus } from "@tabler/icons-react"

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
  const router = useRouter()
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null)
  
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
                <div className="flex justify-between items-center">
                  <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
                  <Button onClick={() => setIsNewDialogOpen(true)}>
                    <IconPlus className="mr-2 h-4 w-4" />
                    Nuevo Proveedor
                  </Button>
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
      />
      
      {/* Diálogo para editar un proveedor */}
      <EditProveedorDialog 
        proveedor={selectedProveedor}
        open={isEditDialogOpen} 
        onOpenChange={handleEditDialogChange}
        onProveedorUpdated={handleProveedorUpdated}
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
    </SidebarProvider>
  )
} 