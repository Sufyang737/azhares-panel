"use client";

import FormularioClienteComponent from "./client-component";

// Un componente wrapper simple que solo recibe un clienteId
export default function ClienteWrapper({ clienteId }: { clienteId: string }) {
  return <FormularioClienteComponent clienteId={clienteId} />;
} 