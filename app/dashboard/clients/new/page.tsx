"use client";

import React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  IconArrowLeft, 
  IconBuilding,
  IconAt,
  IconPhone,
  IconMapPin,
  IconNotes
} from "@tabler/icons-react";
import Link from "next/link";

// Definir el esquema de validación
const formSchema = z.object({
  nombre: z.string().min(1, { message: "El nombre es obligatorio" }),
  contacto: z.string().min(1, { message: "El contacto es obligatorio" }),
  email: z.string().email({ message: "Email inválido" }).optional().or(z.literal("")),
  telefono: z.string().optional().or(z.literal("")),
  direccion: z.string().optional().or(z.literal("")),
  comentarios: z.string().optional().or(z.literal("")),
  estado: z.string().default("Activo"),
});

export default function NewClientPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      contacto: "",
      email: "",
      telefono: "",
      direccion: "",
      comentarios: "",
      estado: "Activo",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/clientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear el cliente");
      }

      toast.success(`Cliente "${values.nombre}" creado correctamente`);
      router.push("/dashboard/clients");
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al crear el cliente";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
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
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    asChild
                  >
                    <Link href="/dashboard/clients">
                      <IconArrowLeft className="h-4 w-4" />
                      <span className="sr-only">Volver</span>
                    </Link>
                  </Button>
                  <h1 className="text-xl font-semibold">Crear Nuevo Cliente</h1>
                </div>
                <p className="text-muted-foreground text-sm mt-2">
                  Complete el formulario para crear un nuevo cliente en el sistema.
                </p>
              </div>
              <div className="px-4 lg:px-6">
                <Form {...form}>
                  <form 
                    onSubmit={form.handleSubmit(onSubmit)} 
                    className="space-y-6 max-w-2xl"
                  >
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="nombre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre</FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <IconBuilding className="absolute ml-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  placeholder="Nombre del cliente"
                                  className="pl-10" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Nombre o razón social del cliente
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="contacto"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contacto</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Nombre de la persona de contacto" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Persona principal de contacto
                            </FormDescription>
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
                              <div className="flex items-center">
                                <IconAt className="absolute ml-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  placeholder="email@ejemplo.com" 
                                  className="pl-10"
                                  type="email"
                                  {...field} 
                                />
                              </div>
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
                              <div className="flex items-center">
                                <IconPhone className="absolute ml-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  placeholder="+54 9 11 1234-5678" 
                                  className="pl-10"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="direccion"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Dirección</FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <IconMapPin className="absolute ml-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  placeholder="Dirección completa" 
                                  className="pl-10"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="comentarios"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Comentarios</FormLabel>
                            <FormControl>
                              <div className="flex">
                                <IconNotes className="absolute ml-3 mt-2 h-4 w-4 text-muted-foreground" />
                                <Textarea 
                                  placeholder="Comentarios o notas adicionales sobre el cliente" 
                                  className="pl-10 min-h-[100px]"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end gap-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => router.push("/dashboard/clients")}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Guardando..." : "Guardar Cliente"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 