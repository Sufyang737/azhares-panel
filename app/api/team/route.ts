import { NextResponse } from "next/server"
import { createTeamMember, getTeamMembers } from "@/app/services/team"
import { z } from "zod"

// Schema de validación para crear un miembro del equipo
const createTeamMemberSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  apellido: z.string().min(1, "El apellido es requerido"),
  cargo: z.string().min(1, "El cargo es requerido"),
  dni: z.number().min(1000000, "DNI inválido"),
  telefono: z.number().min(1000000000, "Teléfono inválido"),
  email: z.string().email("Email inválido"),
  cumpleanio: z.string().transform((date) => {
    // Si la fecha ya está en formato YYYY-MM-DD, la devolvemos tal cual
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    // Si es una fecha ISO, la convertimos a YYYY-MM-DD
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }),
  pais: z.string().min(1, "El país es requerido"),
  ciudad: z.enum(["buenos-aires", "cordoba"], {
    errorMap: () => ({ message: "La ciudad debe ser 'buenos-aires' o 'cordoba'" })
  }),
})

export async function GET() {
  try {
    const members = await getTeamMembers()
    return NextResponse.json(members)
  } catch (error) {
    console.error("Error fetching team members:", error)
    return NextResponse.json(
      { error: "Error al obtener los miembros del equipo" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Body recibido:', body)
    
    // Validar los datos
    const validatedData = createTeamMemberSchema.parse(body)
    console.log('Datos validados:', validatedData)
    
    // Crear el miembro del equipo
    const member = await createTeamMember(validatedData)
    console.log('Miembro creado:', member)
    
    return NextResponse.json(member)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Error de validación:', error.errors)
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }
    
    console.error("Error creating team member:", error)
    return NextResponse.json(
      { error: "Error al crear el miembro del equipo" },
      { status: 500 }
    )
  }
} 