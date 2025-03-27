"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Usuario } from "./pocketbase";

interface AuthContextType {
  user: Usuario | null;
  loading: boolean;
  redirecting: boolean;
  error: string | null;
  login: (identity: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Evitar recarga infinita verificando si estamos en el cliente
const isBrowser = typeof window !== 'undefined';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Verificar si el usuario está autenticado al cargar la página
  useEffect(() => {
    // Evitar múltiples inicializaciones
    if (isInitialized || !isBrowser) return;

    async function initializeAuth() {
      try {
        console.log("Inicializando autenticación...");
        setIsInitialized(true);
        
        // Verificar si hay datos de usuario en localStorage
        const storedUser = localStorage.getItem('user');
        
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            console.log("Usuario recuperado del localStorage:", userData.username);
            
            // Establecer el usuario en el estado (temporalmente mientras verificamos)
            setUser(userData);
          } catch (error) {
            console.error("Error al procesar datos de usuario:", error);
            localStorage.removeItem('user');
          }
        }
        
        // Verificar con el servidor siempre para confirmar que la sesión es válida
        await verifyWithServer();
      } catch (err) {
        console.error("Error al verificar autenticación:", err);
        setUser(null);
        setLoading(false);
      }
    }
    
    // Solo ejecutar una vez al inicio
    initializeAuth();
  }, [isInitialized]);

  const verifyWithServer = useCallback(async () => {
    if (!isBrowser) return;
    
    try {
      console.log("Verificando autenticación con el servidor...");
      
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      console.log("Respuesta del servidor:", response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log("Sesión inválida o expirada");
          setUser(null);
          localStorage.removeItem('user');
        } else {
          console.error("Error al verificar autenticación:", response.status);
          // No eliminar usuario de localStorage si hay error de red/servidor
        }
        
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log("Usuario confirmado por el servidor:", data.user.username);
        setUser(data.user);
        // Actualizar localStorage con datos del servidor
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        console.log("No autenticado según el servidor:", data.message);
        setUser(null);
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error("Error al verificar con servidor:", error);
      // No eliminar usuario de localStorage si hay error de red
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para iniciar sesión
  const login = useCallback(async (identity: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Iniciando proceso de login para:", identity);
      
      // Realizar la solicitud al endpoint de login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({ identity, password }),
        credentials: 'include'
      });
      
      console.log("Respuesta del servidor:", response.status);
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        console.error('Error de autenticación:', data.message || 'Credenciales inválidas');
        setLoading(false);
        setError(data.message || 'Credenciales inválidas');
        return { success: false, error: data.message || 'Credenciales inválidas' };
      }
      
      console.log("Login exitoso para:", data.user.username);
      
      // Guardar en localStorage para persistencia
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      // Actualizar estado
      setUser(data.user);
      
      // Obtener la URL de redirección guardada o usar /dashboard por defecto
      let redirectPath = '/dashboard';
      
      if (typeof window !== 'undefined') {
        const savedRedirect = sessionStorage.getItem('redirect_after_login');
        const urlParams = new URLSearchParams(window.location.search);
        const urlRedirect = urlParams.get('redirect');
        
        if (savedRedirect) {
          redirectPath = savedRedirect;
          // Limpiar después de usar
          sessionStorage.removeItem('redirect_after_login');
        } else if (urlRedirect) {
          // Usar el parámetro de URL si está disponible y no hay redirección guardada
          redirectPath = urlRedirect;
        }
      }
      
      // Redirigir después de un breve retraso para permitir que los estados se actualicen
      setRedirecting(true);
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          console.log("Redirigiendo a:", redirectPath);
          window.location.href = redirectPath;
        }
      }, 300);
      
      return { success: true };
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      setLoading(false);
      setError('Error inesperado al iniciar sesión');
      return { success: false, error: 'Error inesperado al iniciar sesión' };
    }
  }, []);

  // Función para cerrar sesión
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      setRedirecting(true);
      
      // Antes de hacer la solicitud, limpiar el estado
      setUser(null);
      
      // Limpiar localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
      }
      
      // Realizar la solicitud al endpoint de logout
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error('Error en la respuesta del servidor:', await response.text());
        setRedirecting(false);
        return { success: false, error: 'Error al cerrar sesión' };
      }
      
      // Redirigir a la página de login después de un breve retraso
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          console.log("Redirigiendo a login después de cerrar sesión");
          window.location.href = "/login";
        }
      }, 300);
      
      return { success: true };
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setRedirecting(false);
      return { success: false, error: 'Error inesperado al cerrar sesión' };
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        redirecting,
        error,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
} 