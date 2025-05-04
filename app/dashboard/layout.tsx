"use client";

import { ShadcnSidebar } from "@/components/shadcn-sidebar";
import { SiteHeader } from "@/components/site-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <ShadcnSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <SiteHeader />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
} 