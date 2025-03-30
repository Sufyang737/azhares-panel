"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Home, Calendar, Heart, ArrowRight, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";

export default function GraciasPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <Card className="border-slate-200 shadow-lg overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-green-400 to-emerald-500"></div>
          <CardHeader className="pb-2">
            <div className="flex justify-center mb-4">
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                <CheckCircle className="h-16 w-16 text-green-500" />
              </motion.div>
            </div>
            <CardTitle className="text-center text-2xl font-bold">¡Información recibida!</CardTitle>
            <CardDescription className="text-center text-base mt-2">
              Gracias por completar tus datos. Estamos emocionados de trabajar contigo.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pt-2 pb-6">
            <div className="space-y-6 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-green-50 rounded-lg p-4 border border-green-100"
              >
                <p className="text-slate-800">
                  Hemos registrado correctamente tu información. En breve nos pondremos en 
                  contacto contigo para coordinar los detalles de tu evento.
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="grid grid-cols-2 gap-4"
              >
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col items-center">
                  <Calendar className="h-6 w-6 text-blue-500 mb-2" />
                  <h3 className="text-sm font-medium">Próximos pasos</h3>
                  <p className="text-xs text-slate-600 mt-1">Planificación detallada</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex flex-col items-center">
                  <Heart className="h-6 w-6 text-purple-500 mb-2" />
                  <h3 className="text-sm font-medium">Personalización</h3>
                  <p className="text-xs text-slate-600 mt-1">Evento a tu medida</p>
                </div>
              </motion.div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 border-t bg-slate-50 p-6">
            <Button 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
              onClick={() => router.push("/")}
            >
              <Home className="mr-2 h-4 w-4" /> Ir al inicio
            </Button>
            
            <div className="w-full text-center text-xs text-slate-500 mt-2">
              <p>Si necesitas más información, no dudes en contactarnos.</p>
              <div className="mt-2 flex items-center justify-center gap-1">
                <Heart className="h-3 w-3 text-red-400" /> 
                <span>¡Tu evento será inolvidable!</span>
              </div>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-8 text-center"
      >
        <p className="text-sm text-slate-500 mb-2">¿Quieres conocer nuestro trabajo?</p>
        <Button variant="outline" className="border-slate-300" size="sm" onClick={() => window.open('https://instagram.com/orcishevents', '_blank')}>
          Ver nuestros eventos <ArrowRight className="ml-2 h-3.5 w-3.5" />
        </Button>
      </motion.div>
    </div>
  );
}
