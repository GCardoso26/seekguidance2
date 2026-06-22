"use client";

import { useState } from "react";
import { Sidebar } from "@/components/seller-dashboard/Sidebar";
import { useSellerStore } from "@/hooks/useSellerStore";

export default function VendedorPainelLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { storeId, ownerId } = useSellerStore();

  return (
    <div className="flex min-h-screen bg-luxury-onyx text-white">
      <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
        <Sidebar sellerId={ownerId ?? storeId} className="fixed left-0 top-0 z-30 h-screen w-64" />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <Sidebar
            sellerId={ownerId ?? storeId}
            className="relative z-50 h-full w-64"
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col lg:ml-64">
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg bg-white/10 px-3 py-2 text-sm"
          >
            ☰ Menu
          </button>
          <span className="text-sm font-semibold">Painel do Vendedor</span>
        </div>
        {children}
      </div>
    </div>
  );
}
