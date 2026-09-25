import type { DaySummary } from "@/lib/orders";

export const DaySelector = ({ days, activeDay, onSelect }: { days: DaySummary[]; activeDay: string; onSelect: (day: string) => void }) => (
  <section aria-labelledby="day-heading" className="space-y-4 border-t border-border pt-7">
    <div><p className="step-label">02 / ELEGIR JORNADA</p><h2 id="day-heading" className="text-2xl font-bold">¿Qué día quieres preparar?</h2><p className="text-sm text-muted-foreground">Selecciona una jornada para revisar, generar el PDF y guardarla.</p></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{days.map(({ day, orders, boxes }) => <button type="button" key={day} onClick={() => onSelect(day)} aria-pressed={activeDay === day} className={`min-h-28 rounded border-2 p-4 text-left transition-colors hover:border-[#D40511] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${activeDay === day ? "border-[#D40511] bg-[#FFF8DC]" : "border-border bg-white"}`}><span className="block text-lg font-bold uppercase">{day}</span><span className="mt-2 block text-sm">{orders} pedidos · {boxes === null ? "Cajas sin total disponible" : `${boxes} cajas`}</span><span className="mt-1 block text-xs font-semibold text-[#A0000B]">{activeDay === day ? "Jornada seleccionada" : "Seleccionar jornada"}</span></button>)}</div>
  </section>
);
