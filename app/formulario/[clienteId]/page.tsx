import { Suspense } from "react";
import { IconLoader2 } from "@tabler/icons-react";
import ClienteWrapper from "./client-wrapper";

// Componente de carga para Suspense
function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <IconLoader2 className="h-10 w-10 animate-spin text-primary" />
      <span className="ml-2">Cargando formulario...</span>
    </div>
  );
}

// Este es un Server Component - AHORA usamos async para obtener los params
export default async function FormularioPersonaPage({ 
  params 
}: { 
  params: Promise<{ clienteId: string }> 
}) {
  // Esperamos a que los parámetros se resuelvan
  const { clienteId } = await params;
  
  return (
    <Suspense fallback={<Loading />}>
      <ClienteWrapper clienteId={clienteId} />
    </Suspense>
  );
}
