import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const AppHeader = ({ onReset, hasFile }: { onReset: () => void; hasFile: boolean }) => (
  <header className="border-b border-black/15 bg-[#FFCC00]">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
      <div className="flex items-center gap-5">
        <img src={`${import.meta.env.BASE_URL}brand/dhl-logo.svg`} alt="DHL" className="w-24 shrink-0 sm:w-28" />
        <div className="border-l border-black/30 pl-5"><p className="text-xs font-bold uppercase tracking-wide">ZAL Seco · Carrefour</p><h1 className="text-xl font-bold leading-tight sm:text-2xl">Duplicados ZAL Seco</h1><p className="text-xs">Preparación de pedidos duplicados</p></div>
      </div>
      <div className="flex items-center gap-3"><span className="text-xs font-semibold">Procesamiento local</span>{hasFile && <Button variant="outline" size="sm" onClick={onReset} className="border-black/30 bg-white"><RotateCcw className="size-4" /> Nuevo Excel</Button>}</div>
    </div>
  </header>
);
