"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IconAlertCircle, IconLoader2 } from "@tabler/icons-react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, login, loading, redirecting } = useAuth();
  const redirectedRef = useRef(false);
  const searchParams = useSearchParams();
  
  // Obtener la URL de redirección si existe
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  // Verificar si ya hay un usuario autenticado (solo una vez)
  useEffect(() => {
    // Evitar múltiples redirecciones y verificar solo del lado del cliente
    if (typeof window === 'undefined' || redirectedRef.current) return;
    
    if (user) {
      console.log("Usuario autenticado, redirigiendo a:", redirectPath);
      redirectedRef.current = true;
      // Usar sessionStorage para indicar que venimos de una redirección
      sessionStorage.setItem('redirecting_from_login', 'true');
      window.location.href = redirectPath;
    }
  }, [user, redirectPath]);

  // Manejar el parámetro de URL de redirección
  useEffect(() => {
    // Solo del lado del cliente
    if (typeof window === 'undefined') return;
    
    const redirect = searchParams.get("redirect");
    if (redirect) {
      console.log("Guardando destino de redirección:", redirect);
      sessionStorage.setItem('redirect_after_login', redirect);
    }
  }, [searchParams]);

  // Verificar localStorage solo una vez al cargar
  useEffect(() => {
    // Evitar si estamos en servidor o ya estamos redirigiendo
    if (typeof window === 'undefined' || redirectedRef.current) return;
    
    // Si ya se está cargando desde AuthContext, no necesitamos verificar
    if (loading || redirecting) return;

    // Verificar si venimos de una redirección anterior (para evitar loops)
    const isRedirecting = sessionStorage.getItem('redirecting_from_login');
    if (isRedirecting) {
      // Limpiar para evitar loops
      sessionStorage.removeItem('redirecting_from_login');
      return;
    }
  }, [loading, redirecting]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // No procesar si ya estamos procesando o redirigiendo
    if (isProcessing || redirecting || redirectedRef.current) return;
    
    setShowError(false);
    setIsProcessing(true);

    if (!identity || !password) {
      setErrorMessage("Por favor ingrese su nombre de usuario/email y contraseña");
      setShowError(true);
      setIsProcessing(false);
      return;
    }

    try {
      console.log("Enviando credenciales...");
      const result = await login(identity, password);
      
      if (!result.success) {
        setErrorMessage(result.error || "Error de autenticación");
        setShowError(true);
        setIsProcessing(false);
      } else {
        // Marcar como redirigiendo para evitar loops
        redirectedRef.current = true;
      }
      // Si es exitoso, el AuthContext manejará la redirección
    } catch (error) {
      console.error("Error en proceso de login:", error);
      setErrorMessage("Error inesperado. Por favor, intente nuevamente.");
      setShowError(true);
      setIsProcessing(false);
    }
  }

  // Mostrar pantalla de carga mientras verificamos autenticación o procesamos login
  if (loading || isProcessing || redirecting || redirectedRef.current) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center">
          <IconLoader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p>{redirecting || redirectedRef.current ? "Redirigiendo..." : "Procesando, por favor espere..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Azhares Panel</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder al panel administrativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {showError && (
              <Alert variant="destructive">
                <IconAlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="identity">Usuario o Email</Label>
              <Input
                id="identity"
                type="text"
                placeholder="Ingresa tu usuario o email"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                disabled={isProcessing}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isProcessing}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar sesión"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          Panel administrativo de Azhares
        </CardFooter>
      </Card>
    </div>
  );
} 