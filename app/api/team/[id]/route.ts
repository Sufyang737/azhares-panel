import { NextResponse } from "next/server"
import { updateTeamMember, CreateTeamMemberData } from "@/app/services/team"
import { z } from "zod"

// Schema de validación para actualizar un miembro del equipo (todos los campos opcionales)
const updateTeamMemberSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").optional(),
  apellido: z.string().min(1, "El apellido es requerido").optional(),
  cargo: z.string().min(1, "El cargo es requerido").optional(),
  dni: z.number().min(1000000, "DNI inválido").optional(),
  telefono: z.number().min(1000000000, "Teléfono inválido").optional(),
  email: z.string().email("Email inválido").optional(),
  cumpleanio: z.string().transform((date) => {
    if (!date) return undefined;
    // Si la fecha ya está en formato YYYY-MM-DD, la devolvemos tal cual
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    // Si es una fecha ISO, la convertimos a YYYY-MM-DD
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }).optional(),
  pais: z.string().min(1, "El país es requerido").optional(),
  ciudad: z.enum(["buenos-aires", "cordoba"], {
    errorMap: () => ({ message: "La ciudad debe ser 'buenos-aires' o 'cordoba'" })
  }).optional(),
}).strict()

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    console.log('Body recibido para actualización:', body)

    // Validar los datos
    const validatedData = updateTeamMemberSchema.parse(body)
    console.log('Datos validados:', validatedData)

    // Actualizar el miembro del equipo
    const member = await updateTeamMember(id, validatedData as Partial<CreateTeamMemberData>)
    console.log('Miembro actualizado:', member)

    return NextResponse.json(member)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Error de validación:', error.errors)
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating team member:", error)
    return NextResponse.json(
      { error: "Error al actualizar el miembro del equipo" },
      { status: 500 }
    )
  }
}
