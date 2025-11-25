"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { TeamMember } from "@/app/services/team"
import { IconPencil } from "@tabler/icons-react"

const formSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    apellido: z.string().min(1, "El apellido es requerido"),
    cargo: z.string().min(1, "El cargo es requerido"),
    dni: z.string().min(7, "DNI inválido"),
    telefono: z.string().min(10, "Teléfono inválido"),
    email: z.string().email("Email inválido"),
    cumpleanio: z.string().min(1, "La fecha de cumpleaños es requerida"),
    pais: z.string().min(1, "El país es requerido"),
    ciudad: z.string().min(1, "La ciudad es requerida"),
})

type FormData = z.infer<typeof formSchema>

interface EditMemberDialogProps {
    member: TeamMember
    onSuccess?: () => void
}

export function EditMemberDialog({ member, onSuccess }: EditMemberDialogProps) {
    const [open, setOpen] = useState(false)
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nombre: member.nombre || "",
            apellido: member.apellido || "",
            cargo: member.cargo || "",
            dni: String(member.dni || ""),
            telefono: String(member.telefono || ""),
            email: member.email || "",
            cumpleanio: member.cumpleanio || "",
            pais: member.pais || "",
            ciudad: member.ciudad || "",
        },
    })

    // Resetear el formulario cuando cambie el miembro
    useEffect(() => {
        form.reset({
            nombre: member.nombre || "",
            apellido: member.apellido || "",
            cargo: member.cargo || "",
            dni: String(member.dni || ""),
            telefono: String(member.telefono || ""),
            email: member.email || "",
            cumpleanio: member.cumpleanio || "",
            pais: member.pais || "",
            ciudad: member.ciudad || "",
        })
    }, [member, form])

    async function onSubmit(data: FormData) {
        try {
            const response = await fetch(`/api/team/${member.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...data,
                    dni: parseInt(data.dni),
                    telefono: parseInt(data.telefono),
                }),
            })

            if (!response.ok) {
                throw new Error("Error al actualizar el miembro del equipo")
            }

            toast.success("Miembro del equipo actualizado exitosamente")
            setOpen(false)
            onSuccess?.()
        } catch (error) {
            console.error("Error updating team member:", error)
            toast.error("Error al actualizar el miembro del equipo")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <IconPencil className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Miembro del Equipo</DialogTitle>
                    <DialogDescription>
                        Modifica los datos del miembro del equipo
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="nombre"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Juan" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="apellido"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Apellido</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Pérez" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="cargo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cargo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Wedding Planner" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="dni"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>DNI</FormLabel>
                                        <FormControl>
                                            <Input placeholder="12345678" {...field} />
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
                                            <Input placeholder="1123456789" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="juan@azares.com" type="email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="cumpleanio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha de Cumpleaños</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="pais"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>País</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Argentina" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="ciudad"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ciudad</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Buenos Aires" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit">Guardar Cambios</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
