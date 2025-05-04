"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { IconCalendarEvent, IconHeart, IconHome } from "@tabler/icons-react";
import Link from "next/link";

export default function GraciasPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="border-none shadow-xl bg-white/80 backdrop-blur">
          <CardHeader className="text-center space-y-2 pb-2">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              ¡Información recibida!
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Gracias por completar tus datos. Estamos emocionados de trabajar contigo.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 text-center px-6">
            <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-green-800">
              Hemos registrado correctamente tu información. En breve nos pondremos en contacto contigo para coordinar los detalles de tu evento.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-blue-50/50 border-blue-100">
                <CardContent className="pt-6 flex flex-col items-center">
                  <IconCalendarEvent className="w-8 h-8 text-blue-600 mb-2" />
                  <h3 className="font-semibold text-blue-900">Planificación detallada</h3>
                  <p className="text-sm text-blue-700 mt-1">Organizaremos cada detalle</p>
                </CardContent>
              </Card>

              <Card className="bg-purple-50/50 border-purple-100">
                <CardContent className="pt-6 flex flex-col items-center">
                  <IconHeart className="w-8 h-8 text-purple-600 mb-2" />
                  <h3 className="font-semibold text-purple-900">Evento a tu medida</h3>
                  <p className="text-sm text-purple-700 mt-1">Personalizado para ti</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col items-center space-y-4 pt-6">
            <Button
              asChild
              className="w-full max-w-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              <Link href="/" className="flex items-center justify-center">
                <IconHome className="mr-2 h-4 w-4" />
                Ir al inicio
              </Link>
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Si necesitas más información, no dudes en contactarnos.
              </p>
              <p className="text-sm font-medium text-indigo-600 flex items-center justify-center">
                <IconHeart className="w-4 h-4 mr-1" />
                ¡Tu evento será inolvidable!
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
