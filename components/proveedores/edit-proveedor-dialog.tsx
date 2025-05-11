"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { IconLoader2 } from "@tabler/icons-react"

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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

import { proveedorSchema } from "./proveedores-data-table"

type Proveedor = z.infer<typeof proveedorSchema>

// Enum de países permitidos
const PAISES_PERMITIDOS = ["colombia", "espana", "uruguay", "usa", "brasil", "argentina"] as const;

// Categorías por defecto para usar si hay errores al obtener las reales
const CATEGORIAS_POR_DEFECTO = ["Mercería", "Telas", "Accesorios", "Botones", "Herrajes", "Cierres", "Hilos"];

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
}

export function EditProveedorDialog({
  proveedor,
  open,
  onOpenChange,
  onProveedorUpdated,
}: EditProveedorDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categorias, setCategorias] = useState<string[]>([])
  const [categoriaInput, setCategoriaInput] = useState("")
  const [openCategoriaPopover, setOpenCategoriaPopover] = useState(false)
  const [cargandoCategorias, setCargandoCategorias] = useState(false)
  
  // Debuggear los datos del proveedor
  useEffect(() => {
    if (open && proveedor) {
      console.log("Proveedor seleccionado para editar:", proveedor);
    }
  }, [open, proveedor]);
  
  // Cargar categorías existentes
  useEffect(() => {
    if (open) {
      const fetchCategorias = async () => {
        try {
          setCargandoCategorias(true);
          setCategorias([]); // Limpiar categorías al iniciar
          const response = await fetch('/api/proveedores/categorias', {
            // Agregar encabezados para evitar caché
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          // Comprobar si hay redirección (status 307)
          if (response.redirected || !response.ok) {
            console.warn("Redirección o respuesta fallida, usando categorías por defecto");
            setCategorias([...CATEGORIAS_POR_DEFECTO]);
            
            // Si el proveedor actual tiene una categoría que no está en la lista, añadirla
            if (proveedor?.categoria && !CATEGORIAS_POR_DEFECTO.includes(proveedor.categoria)) {
              setCategorias(prev => [...prev, proveedor.categoria]);
            }
            return;
          }
          
          const result = await response.json();
          
          if (result.success) {
            console.log("Categorías cargadas:", result.data);
            setCategorias(result.data || CATEGORIAS_POR_DEFECTO);
            
            // Si el proveedor actual tiene una categoría que no está en la lista, añadirla
            if (proveedor?.categoria && 
                Array.isArray(result.data) && 
                !result.data.includes(proveedor.categoria)) {
              setCategorias(prev => [...prev, proveedor.categoria]);
            }
          } else {
            console.warn("Error al cargar categorías:", result.error);
            // Si hay un error pero el proveedor tiene categoría, usar al menos esa
            const categoriasBase = [...CATEGORIAS_POR_DEFECTO];
            if (proveedor?.categoria && !categoriasBase.includes(proveedor.categoria)) {
              categoriasBase.push(proveedor.categoria);
            }
            setCategorias(categoriasBase);
          }
        } catch (error) {
          console.error("Error al cargar categorías:", error);
          // En caso de error, si el proveedor tiene categoría, usar al menos esa
          const categoriasBase = [...CATEGORIAS_POR_DEFECTO];
          if (proveedor?.categoria && !categoriasBase.includes(proveedor.categoria)) {
            categoriasBase.push(proveedor.categoria);
          }
          setCategorias(categoriasBase);
        } finally {
          setCargandoCategorias(false);
        }
      };
      
      fetchCategorias();
    }
  }, [open, proveedor]);
  
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
        web: formatWebUrl(proveedor.web) || null,
        instagram: formatInstagramHandle(proveedor.instagram) || null,
        direccion: proveedor.direccion || null,
        comision: proveedor.comision?.toString() || null,
        categoria: proveedor.categoria || null,
      });
    }
  }, [proveedor, open, form]);
  
  // Función para extraer solo el dominio de una URL web
  function formatWebUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname;
    } catch {
      return url;
    }
  }
  
  // Función para extraer solo el usuario de una URL de Instagram
  function formatInstagramHandle(url: string | null | undefined): string | null {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      // Obtener la parte del path sin la barra inicial y eliminar cualquier slash final
      const path = urlObj.pathname.replace(/^\//, '').replace(/\/$/, '');
      return path;
    } catch {
      return url;
    }
  }
  
  // Manejar el envío del formulario
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!proveedor) return;
    
    setIsSubmitting(true);
    
    // Convertir string a número donde sea necesario
    const formattedData = {
      ...data,
      telefono: data.telefono ? Number(data.telefono) : null,
      comision: data.comision ? Number(data.comision) : null,
    };
    
    try {
      const response = await fetch('/api/proveedores', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: proveedor.id,
          ...formattedData,
        }),
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
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Proveedor</DialogTitle>
          <DialogDescription>
            Modifica los detalles del proveedor y guarda los cambios cuando hayas terminado.
          </DialogDescription>
        </DialogHeader>
        
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
                      defaultValue={field.value || undefined}
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
            
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Categoría</FormLabel>
                    <Popover open={openCategoriaPopover} onOpenChange={setOpenCategoriaPopover}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOpenCategoriaPopover(!openCategoriaPopover);
                            }}
                          >
                            {field.value || "Seleccione o cree una categoría"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <div className="flex flex-col">
                          <div className="p-2 border-b">
                            <Input
                              placeholder="Buscar o crear nueva categoría..."
                              value={categoriaInput}
                              onChange={(e) => setCategoriaInput(e.target.value)}
                              className="h-9"
                            />
                          </div>
                          
                          {categoriaInput && !categorias.some(c => 
                            c.toLowerCase() === categoriaInput.toLowerCase()
                          ) && (
                            <div className="px-2 py-2 border-b">
                              <Button
                                type="button"
                                variant="ghost"
                                className="w-full justify-start text-sm"
                                onClick={() => {
                                  field.onChange(categoriaInput);
                                  setOpenCategoriaPopover(false);
                                }}
                              >
                                <span>Crear "{categoriaInput}"</span>
                              </Button>
                            </div>
                          )}
                          
                          <div className="overflow-y-auto max-h-[300px] scroll-smooth scrollbar-thin">
                            {categorias
                              .filter(cat => !categoriaInput || cat.toLowerCase().includes(categoriaInput.toLowerCase()))
                              .map(categoria => (
                                <div
                                  key={categoria}
                                  className={cn(
                                    "px-2 py-3 cursor-pointer hover:bg-accent flex items-center font-medium",
                                    field.value === categoria && "bg-accent"
                                  )}
                                  onClick={() => {
                                    field.onChange(categoria);
                                    setOpenCategoriaPopover(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === categoria ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {categoria}
                                </div>
                              ))
                            }
                            
                            {categorias.filter(cat => 
                              !categoriaInput || cat.toLowerCase().includes(categoriaInput.toLowerCase())
                            ).length === 0 && (
                              <div className="p-4 text-sm text-center text-muted-foreground">
                                No hay categorías disponibles
                              </div>
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Seleccione una categoría existente o cree una nueva.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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
      </DialogContent>
    </Dialog>
  )
} 