const steps = ["Leyendo archivo", "Comprobando estructura", "Detectando pedidos", "Separando jornadas", "Preparando resultados"];

export const ProcessingSteps = ({ phase, complete }: { phase: string; complete: boolean }) => (
  <ol className="grid gap-2 text-sm sm:grid-cols-5" aria-label="Fases del análisis">
    {steps.map((step, index) => {
      const current = phase.startsWith(step);
      const reached = complete || steps.findIndex((item) => phase.startsWith(item)) > index;
      return <li key={step} className={`border-l-4 px-2 py-1 ${current ? "border-[#D40511] font-bold" : reached ? "border-[#FFCC00]" : "border-border text-muted-foreground"}`} aria-current={current ? "step" : undefined}>{index + 1}. {step}</li>;
    })}
  </ol>
);
