'use client';

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconBook, IconLifebuoy, IconMail } from "@tabler/icons-react";

export default function HelpPage() {
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
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold">Centro de Ayuda</h1>
                <p className="text-muted-foreground">
                  Encuentra ayuda y recursos para usar Azares Panel
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <IconBook className="h-8 w-8 text-primary" />
                    <CardTitle className="mt-4">Documentación</CardTitle>
                    <CardDescription>
                      Consulta nuestra documentación detallada sobre cómo usar todas las funciones.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <a
                      href="#"
                      className="text-sm text-primary hover:underline"
                    >
                      Ver documentación →
                    </a>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <IconLifebuoy className="h-8 w-8 text-primary" />
                    <CardTitle className="mt-4">Soporte Técnico</CardTitle>
                    <CardDescription>
                      ¿Necesitas ayuda? Nuestro equipo de soporte está aquí para ayudarte.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <a
                      href="#"
                      className="text-sm text-primary hover:underline"
                    >
                      Contactar soporte →
                    </a>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <IconMail className="h-8 w-8 text-primary" />
                    <CardTitle className="mt-4">Contacto</CardTitle>
                    <CardDescription>
                      ¿Tienes preguntas o sugerencias? Escríbenos directamente.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <a
                      href="mailto:soporte@azares.com"
                      className="text-sm text-primary hover:underline"
                    >
                      Enviar email →
                    </a>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 