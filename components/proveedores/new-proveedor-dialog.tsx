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

interface NewProveedorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProveedorCreated?: (newProveedor: Proveedor) => void
  categoriasDisponibles: string[]
}

export function NewProveedorDialog({
  open,
  onOpenChange,
  onProveedorCreated,
  categoriasDisponibles,
}: NewProveedorDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categoriasInternas, setCategoriasInternas] = useState<string[]>([])
  const [isCreateCategoriaDialogOpen, setIsCreateCategoriaDialogOpen] = useState(false)
  const [newCategoriaName, setNewCategoriaName] = useState("")
  
  useEffect(() => {
    if (open) {
      setCategoriasInternas(categoriasDisponibles.sort((a,b) => a.localeCompare(b)));
          }
  }, [open, categoriasDisponibles]);
  
  useEffect(() => {
    if (open) {
      form.reset({
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
      });
    }
  }, [open]);
  
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
  
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    const formattedData = {
      ...data,
      telefono: data.telefono ? Number(data.telefono) : null,
      comision: data.comision ? Number(data.comision) : null,
    };
    
    try {
      const response = await fetch('/api/proveedores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success("Proveedor creado correctamente");
        if (onProveedorCreated && result.data) {
          onProveedorCreated(result.data);
        }
        form.reset();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Error al crear el proveedor");
      }
    } catch (error) {
      console.error("Error al crear proveedor:", error);
      toast.error("Error al comunicarse con el servidor");
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nuevo Proveedor</DialogTitle>
          <DialogDescription>
            Introduce los detalles del nuevo proveedor y guárdalos cuando hayas terminado.
          </DialogDescription>
        </DialogHeader>
        
          <div className="max-h-[calc(80vh-120px)] overflow-y-auto pr-6 space-y-6">
        <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
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
                          <Input placeholder="Alias del proveedor" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value || null)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
              <FormField
                control={form.control}
                name="contacto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contacto</FormLabel>
                    <FormControl>
                        <Input placeholder="Nombre del contacto" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value || null)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                          <Input type="tel" placeholder="Teléfono" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value || null)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                          <Input type="email" placeholder="correo@ejemplo.com" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value || null)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                </div>
              
              <FormField
                control={form.control}
                name="pais"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value || null)} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un país" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                          {PAISES_PERMITIDOS.map((pais) => (
                            <SelectItem key={pais} value={pais}>
                              {pais.charAt(0).toUpperCase() + pais.slice(1)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Seleccione uno de los países disponibles
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            
              <FormField
                control={form.control}
                name="web"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sitio Web</FormLabel>
                    <FormControl>
                        <Input placeholder="ejemplo.com" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value || null)} />
                    </FormControl>
                      <FormDescription>
                        Ingrese solo el dominio, se añadirá https:// automáticamente
                      </FormDescription>
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
                        <Input placeholder="usuario" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value || null)} />
                    </FormControl>
                      <FormDescription>
                        Ingrese solo el usuario, se añadirá https://instagram.com/ automáticamente
                      </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            
              <FormField
                control={form.control}
                name="direccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                        <Input placeholder="Dirección" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value || null)} />
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
                        <Input type="number" placeholder="Porcentaje de comisión" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value || null)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                      <div className="flex items-center justify-between">
                    <FormLabel>Categoría</FormLabel>
                        <Button 
                          type="button" 
                          variant="outline"
                          size="sm"
                          onClick={() => setIsCreateCategoriaDialogOpen(true)}
                        >
                          <IconPlus className="mr-2 h-4 w-4" /> Nueva
                        </Button>
                      </div>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione una categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                          {categoriasInternas.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                        Seleccione o cree una categoría para el proveedor.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            
                <DialogFooter className="pt-6">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Guardar Proveedor
              </Button>
            </DialogFooter>
          </form>
        </Form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateCategoriaDialogOpen} onOpenChange={setIsCreateCategoriaDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Añadir Opción de Categoría</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-[1fr_3fr] items-center gap-4">
              <Label htmlFor="new-categoria-name-interna" className="text-right">
                Nombre:
              </Label>
              <Input
                id="new-categoria-name-interna"
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