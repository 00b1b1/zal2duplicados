import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { Archive, CheckCircle2, Download, FileSpreadsheet, Printer, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { AppHeader } from "@/components/AppHeader";
import { DaySelector } from "@/components/DaySelector";
import { OrdersTable } from "@/components/OrdersTable";
import { ProcessingSteps } from "@/components/ProcessingSteps";
import { SavedDays } from "@/components/SavedDays";
import { createOrdersPdf, dayPdfName, orderPdfName } from "@/lib/pdf";
import { deleteBatch, getSavedBatches, saveBatch } from "@/lib/storage";
import type { Order, SavedBatch, WorkerResult } from "@/lib/orders";

type Status = "idle" | "processing" | "ready" | "error";
const acceptedExtensions = ["xlsx", "xls", "xlsm"];

const Index = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const [view, setView] = useState<"work" | "saved">("work");
  const [status, setStatus] = useState<Status>("idle");
  const [phase, setPhase] = useState("Leyendo archivo");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [storageError, setStorageError] = useState("");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<WorkerResult | null>(null);
  const [activeDay, setActiveDay] = useState("");
  const [uploader, setUploader] = useState("");
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState<SavedBatch[]>([]);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");

  useEffect(() => {
    getSavedBatches().then(setSaved).catch(() => setStorageError("No se pudo abrir el historial local. Comprueba el almacenamiento del navegador."));
    return () => workerRef.current?.terminate();
  }, []);

  const activeDayOrders = useMemo(() => result?.orders.filter((order) => order.day === activeDay) ?? [], [result, activeDay]);
  const visibleOrders = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es-ES");
    return activeDayOrders.filter((order) => !query || order.orderNumber.toLocaleLowerCase("es-ES").includes(query) || order.supplier.toLocaleLowerCase("es-ES").includes(query));
  }, [activeDayOrders, search]);
  const activeSummary = result?.days.find(({ day }) => day === activeDay);

  const reset = () => {
    workerRef.current?.terminate(); workerRef.current = null;
    setStatus("idle"); setPhase("Leyendo archivo"); setProgress(0); setError("");
    setFileName(""); setResult(null); setActiveDay(""); setSearch(""); setSavedNotice("");
    if (inputRef.current) inputRef.current.value = "";
    setView("work");
  };

  const processFile = async (file?: File) => {
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !acceptedExtensions.includes(extension)) { setError("Formato no aceptado. Selecciona un archivo XLSX, XLS o XLSM."); setStatus("error"); return; }
    workerRef.current?.terminate();
    setFileName(file.name); setStatus("processing"); setError(""); setSavedNotice(""); setResult(null); setActiveDay(""); setSearch(""); setProgress(8); setPhase("Leyendo archivo");
    try {
      const buffer = await file.arrayBuffer();
      const worker = new Worker(new URL("../lib/excel.worker.ts", import.meta.url), { type: "module" });
      workerRef.current = worker;
      worker.onmessage = (event: MessageEvent<{ type: string; phase?: string; progress?: number; result?: WorkerResult; message?: string }>) => {
        if (event.data.type === "phase") { setPhase(event.data.phase ?? "Analizando archivo"); setProgress(event.data.progress ?? 0); }
        if (event.data.type === "complete") {
          const next = event.data.result;
          if (!next) return;
          setResult(next); setProgress(100); setStatus("ready"); worker.terminate(); workerRef.current = null;
          if (!next.orders.length) setError(next.validSheets === 0 ? "No se encontraron hojas con PEDIDO en B4 y PROVEEDOR en C4. Comprueba que es el Excel correcto." : "El archivo es válido, pero no contiene pedidos para preparar.");
        }
        if (event.data.type === "error") { setStatus("error"); setError("No se pudo analizar el Excel. Comprueba que no esté dañado y que tenga la estructura esperada."); worker.terminate(); workerRef.current = null; }
      };
      worker.onerror = () => { setStatus("error"); setError("No se pudo analizar el Excel. Comprueba su estructura e inténtalo de nuevo."); worker.terminate(); workerRef.current = null; };
      worker.postMessage(buffer, [buffer]);
    } catch { setStatus("error"); setError("No se pudo abrir el archivo seleccionado. Inténtalo de nuevo."); }
  };

  const persistCurrent = async () => {
    if (!activeDay || !activeDayOrders.length) { setError("Selecciona una jornada antes de guardarla."); return; }
    if (!uploader.trim()) { setError("Indica quién realiza este procesamiento antes de guardar."); return; }
    setSaving(true); setError(""); setSavedNotice("");
    try {
      const batch: SavedBatch = { id: crypto.randomUUID(), fileName, createdAt: new Date().toISOString(), day: activeDay, uploader: uploader.trim(), orders: activeDayOrders };
      setSaved(await saveBatch(batch)); setSavedNotice(`Jornada ${activeDay} guardada: ${activeDayOrders.length} pedidos.`);
    } catch { setStorageError("No se pudo guardar la jornada en este dispositivo. Comprueba el espacio y los permisos del navegador."); }
    finally { setSaving(false); }
  };

  const generatePdf = (orders: Order[], name: string) => {
    if (generating || !orders.length) return;
    setGenerating(true); setError("");
    try { createOrdersPdf(orders, name); }
    catch { setError("No se pudo generar el PDF. Vuelve a intentarlo."); }
    finally { window.setTimeout(() => setGenerating(false), 600); }
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); void processFile(event.dataTransfer.files[0]); };
  const onInput = (event: ChangeEvent<HTMLInputElement>) => { void processFile(event.target.files?.[0]); event.target.value = ""; };
  const removeSaved = async (id: string) => { try { setSaved(await deleteBatch(id)); setStorageError(""); } catch { setStorageError("No se pudo eliminar la jornada. Inténtalo de nuevo."); } };

  return <div className="min-h-screen bg-background text-foreground">
    <AppHeader onReset={reset} hasFile={status !== "idle"} />
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
      <nav aria-label="Secciones" className="mb-8 flex gap-6 border-b border-black/20 text-sm font-bold">
        <button className={`min-h-11 border-b-[3px] px-1 ${view === "work" ? "border-[#D40511]" : "border-transparent text-muted-foreground"}`} aria-current={view === "work" ? "page" : undefined} onClick={() => setView("work")}>Preparar jornada</button>
        <button className={`min-h-11 border-b-[3px] px-1 ${view === "saved" ? "border-[#D40511]" : "border-transparent text-muted-foreground"}`} aria-current={view === "saved" ? "page" : undefined} onClick={() => setView("saved")}>Jornadas guardadas ({saved.length})</button>
      </nav>
      {view === "saved" ? <SavedDays batches={saved} onPdf={(batch) => generatePdf(batch.orders, dayPdfName(batch.day))} onDelete={(id) => void removeSaved(id)} error={storageError || error} /> : <div className="space-y-8">
        <section aria-labelledby="upload-heading" className="space-y-4"><div><p className="step-label">01 / CARGAR EXCEL</p><h2 id="upload-heading" className="text-2xl font-bold">Carga el archivo de pedidos</h2><p className="text-sm text-muted-foreground">Selecciona el Excel generado para las recepciones de ZAL Seco.</p></div>
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.xlsm" onChange={onInput} aria-label="Seleccionar archivo Excel de pedidos" className="sr-only" />
          {status === "idle" || status === "error" ? <div onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop} className={`flex min-h-48 flex-col items-center justify-center gap-3 rounded border-2 border-dashed p-6 text-center ${dragging ? "border-[#D40511] bg-[#FFF8DC]" : "border-black/30 bg-white"}`}><Upload className="size-7" aria-hidden="true" /><p className="font-semibold">{dragging ? "Suelta el Excel aquí" : "Arrastra el Excel aquí o selecciónalo"}</p><Button onClick={() => inputRef.current?.click()}><Upload className="size-4" /> Seleccionar Excel</Button><p className="text-xs text-muted-foreground">XLSX · XLS · XLSM</p></div> : <div className="border-y border-black/30 bg-white p-5"><div className="flex items-center gap-3"><FileSpreadsheet className="size-6 shrink-0 text-[#A0000B]" aria-hidden="true" /><p className="min-w-0 break-all font-semibold">{fileName}</p></div>{status === "processing" && <div className="mt-5 space-y-4"><ProcessingSteps phase={phase} complete={false} /><div aria-live="polite" role="status"><p className="mb-2 text-sm font-semibold">{phase} · {progress}%</p><Progress value={progress} /></div></div>}{status === "ready" && <p className="mt-2 text-sm">{result?.orders.length ?? 0} pedidos detectados en {result?.days.length ?? 0} jornadas.</p>}</div>}
          <p className="text-xs text-muted-foreground"><strong className="text-foreground">Procesamiento local.</strong> El Excel no sale de este dispositivo.</p>
          {error && <p role="alert" className="error-panel">{error}</p>}
        </section>
        {status === "idle" && <section className="border-t pt-6"><h2 className="mb-3 text-lg font-bold">Cómo funciona</h2><ol className="grid gap-2 text-sm sm:grid-cols-5">{["Carga el Excel", "Selecciona la jornada", "Revisa los pedidos", "Genera el PDF", "Guarda la jornada"].map((step, index) => <li key={step} className="border-l-4 border-[#FFCC00] pl-3"><strong>{index + 1}.</strong> {step}</li>)}</ol></section>}
        {status === "ready" && result && result.orders.length > 0 && <>
          <DaySelector days={result.days} activeDay={activeDay} onSelect={(day) => { setActiveDay(day); setSearch(""); setError(""); setSavedNotice(""); }} />
          {activeDay && <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_300px]"><OrdersTable orders={visibleOrders} count={activeDayOrders.length} search={search} onSearch={setSearch} onPrint={(order) => generatePdf([order], orderPdfName(order.orderNumber))} />
            <aside className="h-fit border-t-4 border-[#D40511] bg-white p-5 lg:mt-0"><p className="step-label">04 / PREPARAR PDF</p><h2 className="text-xl font-bold">Jornada {activeDay}</h2><dl className="my-5 space-y-2 text-sm"><div className="flex justify-between border-b pb-2"><dt>Pedidos</dt><dd className="font-bold">{activeDayOrders.length}</dd></div><div className="flex justify-between border-b pb-2"><dt>Cajas</dt><dd className="font-bold">{activeSummary?.boxes ?? "Sin total"}</dd></div><div className="break-all"><dt className="text-muted-foreground">Archivo origen</dt><dd className="font-semibold">{fileName}</dd></div></dl><p className="mb-3 text-sm font-semibold">Vas a generar el PDF de {activeDay}: {activeDayOrders.length} pedidos{activeSummary?.boxes !== null ? ` · ${activeSummary?.boxes} cajas` : ""}.</p><Button className="w-full" disabled={generating} onClick={() => generatePdf(activeDayOrders, dayPdfName(activeDay))}><Download className="size-4" /> {generating ? "Preparando PDF…" : "Generar PDF"}</Button><p className="mt-2 text-xs text-muted-foreground">Descarga una hoja por pedido de esta jornada.</p>
              <div className="mt-6 border-t pt-5"><p className="step-label">05 / GUARDAR JORNADA</p><label htmlFor="uploader" className="mb-2 block text-sm font-semibold">¿Quién realiza este procesamiento?</label><Input id="uploader" value={uploader} onChange={(event) => setUploader(event.target.value)} placeholder="Nombre de la persona" autoComplete="name" /><Button variant="outline" className="mt-3 w-full" disabled={saving} onClick={() => void persistCurrent()}><Archive className="size-4" /> {saving ? "Guardando…" : "Guardar jornada"}</Button><p className="mt-2 text-xs text-muted-foreground">Guarda localmente solo los pedidos de {activeDay} para volver a imprimirlos.</p>{savedNotice && <p role="status" className="mt-3 flex gap-2 text-sm font-semibold"><CheckCircle2 className="size-5 text-green-700" /> {savedNotice}</p>}{storageError && <p role="alert" className="error-panel mt-3">{storageError}</p>}</div>
            </aside></div>}
          {!activeDay && <p className="border-l-4 border-[#FFCC00] bg-white p-4 text-sm font-semibold">Selecciona una jornada para continuar.</p>}
          {!!result.warnings.length && <p className="text-sm text-muted-foreground">{result.warnings.length} hojas ignoradas por no tener PEDIDO en B4 y PROVEEDOR en C4.</p>}
        </>}
        {status === "ready" && result?.orders.length === 0 && <Button variant="outline" onClick={reset}>Probar con otro Excel</Button>}
      </div>}
    </main><footer className="mx-auto max-w-7xl border-t px-4 py-5 text-xs text-muted-foreground sm:px-6">DHL · ZAL Seco · Los datos permanecen en este dispositivo</footer>
  </div>;
};

export default Index;
