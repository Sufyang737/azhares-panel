"use client";

import { ReactNode } from "react";

export default function FormularioLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {children}
    </div>
  );
} 