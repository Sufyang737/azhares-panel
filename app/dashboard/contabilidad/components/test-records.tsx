'use client';

import { Button } from "@/components/ui/button";
import { createTestRecord, getFullContabilidadList } from "@/app/services/contabilidad";
import { useState } from "react";
import { toast } from "sonner";

export function TestRecords() {
  const [loading, setLoading] = useState(false);

  const handleCreateTest = async () => {
    try {
      setLoading(true);
      const record = await createTestRecord();
      console.log('Test record created:', record);
      toast.success('Registro de prueba creado exitosamente');
    } catch (error) {
      console.error('Error creating test record:', error);
      toast.error('Error al crear registro de prueba');
    } finally {
      setLoading(false);
    }
  };

  const handleListRecords = async () => {
    try {
      setLoading(true);
      const records = await getFullContabilidadList();
      console.log('Current records:', records);
      toast.success(`Se encontraron ${records.length} registros`);
    } catch (error) {
      console.error('Error listing records:', error);
      toast.error('Error al listar registros');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-4 mb-4">
      <Button 
        variant="outline" 
        onClick={handleCreateTest}
        disabled={loading}
      >
        Crear Registro de Prueba
      </Button>
      <Button 
        variant="outline" 
        onClick={handleListRecords}
        disabled={loading}
      >
        Listar Registros
      </Button>
    </div>
  );
} 