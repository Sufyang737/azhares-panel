"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { IconLoader2, IconPlus } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

import { proveedorSchema } from "./proveedores-data-table"

type Proveedor = z.infer<typeof proveedorSchema>

// Enum de países permitidos
const PAISES_PERMITIDOS = ["colombia", "espana", "uruguay", "usa", "brasil", "argentina"] as const;

// Schema para el formulario (solo los campos editables)
const formSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  alias: z.string().optional().nullable(),
  contacto: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.string().email("Introduzca un email válido").optional().nullable(),
  pais: z.enum(PAISES_PERMITIDOS).optional().nullable(),
  web: z.string().optional().nullable().transform(value => {
    if (!value) return null;
    if (value.startsWith('http://') || value.startsWith('https://')) return value;
    return `https://${value}`;
  }),
  instagram: z.string().optional().nullable().transform(value => {
    if (!value) return null;
    if (value.startsWith('http://') || value.startsWith('https://')) return value;
    return `https://instagram.com/${value.startsWith('@') ? value.substring(1) : value}`;
  }),
  direccion: z.string().optional().nullable(),
  comision: z.string().optional().nullable(),
  categoria: z.string().optional().nullable(),
})

interface EditProveedorDialogProps {
  proveedor: Proveedor | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onProveedorUpdated?: (updatedProveedor: Proveedor) => void
  categoriasDisponibles: string[]
}

export function EditProveedorDialog({
  proveedor,
  open,
  onOpenChange,
  onProveedorUpdated,
  categoriasDisponibles,
}: EditProveedorDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categoriasInternas, setCategoriasInternas] = useState<string[]>([])
  const [isCreateCategoriaDialogOpen, setIsCreateCategoriaDialogOpen] = useState(false)
  const [newCategoriaName, setNewCategoriaName] = useState("")
  
  // Debuggear los datos del proveedor
  useEffect(() => {
    if (open && proveedor) {
      console.log("Proveedor seleccionado para editar:", proveedor);
    }
  }, [open, proveedor]);
  
  // Sincronizar categoriasInternas con categoriasDisponibles y la categoría actual del proveedor
  useEffect(() => {
    if (open) {
      let initialCategorias = [...categoriasDisponibles];
      // Asegurarse que la categoría actual del proveedor (si existe) esté en la lista de opciones
      if (proveedor?.categoria && !initialCategorias.includes(proveedor.categoria)) {
        initialCategorias.push(proveedor.categoria);
            }
      setCategoriasInternas(initialCategorias.sort((a, b) => a.localeCompare(b)));
    }
  }, [open, proveedor, categoriasDisponibles]);
  
  // Inicializar el formulario con los valores del proveedor
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      alias: null,
      contacto: null,
      telefono: null,
      email: null,
      pais: null,
      web: null,
      instagram: null,
      direccion: null,
      comision: null,
      categoria: null,
    },
  })

  // Actualizar los valores del formulario cuando cambia el proveedor
  useEffect(() => {
    if (proveedor && open) {
      console.log("Actualizando valores del formulario con:", proveedor);
      form.reset({
        nombre: proveedor.nombre || "",
        alias: proveedor.alias || null,
        contacto: proveedor.contacto || null,
        telefono: proveedor.telefono?.toString() || null,
        email: proveedor.email || null,
        pais: (proveedor.pais && PAISES_PERMITIDOS.includes(proveedor.pais as any)) ? proveedor.pais as any : null,
        web: proveedor.web || null,
        instagram: proveedor.instagram || null,
        direccion: proveedor.direccion || null,
        comision: proveedor.comision?.toString() || null,
        categoria: proveedor.categoria || null,
      });
    }
  }, [proveedor, open, form]);
  
  const handleCreateNuevaCategoriaInterna = () => {
    const trimmedName = newCategoriaName.trim();
    if (trimmedName) {
      if (!categoriasInternas.find(cat => cat.toLowerCase() === trimmedName.toLowerCase())) {
        setCategoriasInternas(prev => [...prev, trimmedName].sort((a, b) => a.localeCompare(b)));
      }
      form.setValue('categoria', trimmedName);
      setIsCreateCategoriaDialogOpen(false);
      setNewCategoriaName("");
      toast.success(`Categoría "${trimmedName}" lista para usarse en este proveedor.`);
    } else {
      toast.error("El nombre de la categoría no puede estar vacío.");
    }
  };
  
  // Manejar el envío del formulario
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!proveedor) return;
    
    setIsSubmitting(true);
    
    // Convertir string a número donde sea necesario
    const formattedData = {
      ...data,
      id: proveedor.id,
      telefono: data.telefono ? Number(data.telefono) : null,
      comision: data.comision ? Number(data.comision) : null,
    };
    
    try {
      const response = await fetch(`/api/proveedores/${proveedor.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success("Proveedor actualizado correctamente");
        // Notificar a los componentes padres sobre la actualización
        if (onProveedorUpdated && result.data) {
          onProveedorUpdated(result.data);
        }
        // Cerrar el diálogo
        onOpenChange(false);
      } else {
        toast.error(result.error || "Error al actualizar el proveedor");
      }
    } catch (error) {
      console.error("Error al actualizar proveedor:", error);
      toast.error("Error al comunicarse con el servidor");
    } finally {
      setIsSubmitting(false);
    }
  }
  
  if (!proveedor && open) {
    // Podría ser útil un estado de carga o simplemente no renderizar si no hay proveedor
    return null;
  }
  
  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
            <DialogTitle>Editar Proveedor: {proveedor?.nombre}</DialogTitle>
          <DialogDescription>
              Modifique los detalles del proveedor y guárdelos cuando haya terminado.
          </DialogDescription>
        </DialogHeader>
        
          {proveedor && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del proveedor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="alias"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alias</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Alias del proveedor" 
                        {...field} 
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contacto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contacto</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nombre del contacto" 
                        {...field} 
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Teléfono" 
                        type="tel"
                        {...field} 
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="correo@ejemplo.com" 
                        type="email"
                        {...field} 
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="pais"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value || null)}
                          value={form.watch('pais') || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un país" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="argentina">Argentina</SelectItem>
                        <SelectItem value="brasil">Brasil</SelectItem>
                        <SelectItem value="colombia">Colombia</SelectItem>
                        <SelectItem value="espana">España</SelectItem>
                        <SelectItem value="uruguay">Uruguay</SelectItem>
                        <SelectItem value="usa">USA</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Seleccione uno de los países disponibles
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="web"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sitio Web</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="ejemplo.com" 
                        {...field} 
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormDescription>Ingrese solo el dominio, se añadirá https:// automáticamente</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="usuario" 
                        {...field} 
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormDescription>Ingrese solo el usuario, se añadirá https://instagram.com/ automáticamente</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="direccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Dirección" 
                        {...field} 
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="comision"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comisión (%)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Porcentaje de comisión" 
                        type="number"
                        step="0.01"
                        {...field} 
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
                <div className="grid grid-cols-1 gap-4 items-end md:grid-cols-[3fr_1fr]">
              <FormField
                control={form.control}
                name="categoria"
                    render={() => (
                      <FormItem>
                    <FormLabel>Categoría</FormLabel>
                        <Select
                          onValueChange={(value) => form.setValue('categoria', value || null)}
                          value={form.watch('categoria') || ""}
                        >
                        <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione una categoría" />
                            </SelectTrigger>
                        </FormControl>
                          <SelectContent>
                            {categoriasInternas.length === 0 && (
                              <div className="p-2 text-sm text-muted-foreground">
                                No hay categorías. Puede crear una nueva.
                              </div>
                            )}
                            {categoriasInternas.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateCategoriaDialogOpen(true)} 
                    className="mb-2 md:mb-[calc(var(--form-message-height,1rem)+0.5rem)]"
                  >
                    <IconPlus className="mr-2 h-4 w-4" /> Nueva
                  </Button>
            </div>
                <FormDescription className="-mt-3 text-xs text-muted-foreground px-1 md:col-start-1 md:col-span-1">
                  Seleccione o cree una categoría para el proveedor.
                </FormDescription>
            
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo para crear nueva categoría (INTERNA a este proveedor) */}
      <Dialog open={isCreateCategoriaDialogOpen} onOpenChange={setIsCreateCategoriaDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Añadir Opción de Categoría</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-[1fr_3fr] items-center gap-4">
              <Label htmlFor="edit-new-categoria-name-interna" className="text-right">
                Nombre:
              </Label>
              <Input
                id="edit-new-categoria-name-interna"
                value={newCategoriaName}
                onChange={(e) => setNewCategoriaName(e.target.value)}
                className="col-span-2"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateNuevaCategoriaInterna(); } }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateCategoriaDialogOpen(false); setNewCategoriaName(""); }}>Cancelar</Button>
            <Button onClick={handleCreateNuevaCategoriaInterna}>Añadir y Seleccionar</Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
} 