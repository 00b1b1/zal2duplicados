import { Check, FileCheck2, ListFilter, ScanSearch } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { label: "Carga", icon: FileCheck2 },
  { label: "Validación", icon: ScanSearch },
  { label: "Clasificación", icon: ListFilter },
  { label: "Finalizado", icon: Check },
];

export const ProcessingSteps = ({ active }: { active: number }) => (
  <div className="relative grid grid-cols-4 gap-2" aria-label="Fases del procesamiento">
    <div className="absolute left-[12%] right-[12%] top-4 h-px bg-border" />
    {steps.map(({ label, icon: Icon }, index) => {
      const done = index < active;
      const current = index === active;
      return (
        <div key={label} className="relative z-10 flex min-w-0 flex-col items-center gap-2 text-center">
          <span className={cn(
            "grid size-8 place-items-center rounded-full border bg-background text-muted-foreground ring-4 ring-card transition-colors",
            (done || current) && "border-primary bg-primary text-primary-foreground",
            current && active < 3 && "animate-pulse",
          )}>
            <Icon className="size-4" />
          </span>
          <span className={cn("text-[10px] font-bold uppercase text-muted-foreground sm:text-xs", (done || current) && "text-foreground")}>{label}</span>
        </div>
      );
    })}
  </div>
);