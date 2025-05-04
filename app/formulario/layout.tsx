"use client";

import { ReactNode } from "react";

export default function FormularioLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30">
      {children}
    </div>
  );
} 