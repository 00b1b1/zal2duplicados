import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { Archive, CalendarDays, CheckCircle2, Download, FileSpreadsheet, FolderArchive, Printer, Search, Trash2, Upload, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProcessingSteps } from "@/components/ProcessingSteps";
import { createOrdersPdf } from "@/lib/pdf";
import { deleteBatch, getSavedBatches, saveBatch } from "@/lib/storage";
import type { Order, SavedBatch, WorkerResult } from "@/lib/orders";

type Status = "idle" | "processing" | "ready" | "error";
const acceptedExtensions = ["xlsx", "xls", "xlsm"];

const Index = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker>();
  const [status, setStatus] = useState<Status>("idle");
  const [phase, setPhase] = useState("Preparado para recibir un archivo");
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<WorkerResult | null>(null);
  const [selectedDay, setSelectedDay] = useState("todos");
  const [featuredDay, setFeaturedDay] = useState("");
  const [uploader, setUploader] = useState("");
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState<SavedBatch[]>([]);
  const [savedDay, setSavedDay] = useState("todos");
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    getSavedBatches().then(setSaved).catch(() => toast.error("No se pudo abrir el historial local."));
    return () => workerRef.current?.terminate();
  }, []);

  const reset = () => {
    workerRef.current?.terminate();
    setStatus("idle"); setPhase("Preparado para recibir un archivo"); setProgress(0);
    setFileName(""); setResult(null); setSelectedDay("todos"); setFeaturedDay(""); setSearch("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const processFile = async (file?: File) => {
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !acceptedExtensions.includes(extension)) {
      toast.error("Selecciona un archivo XLSX, XLS o XLSM."); return;
    }
    setFileName(file.name); setStatus("processing"); setResult(null); setProgress(8); setPhase("Preparando el archivo sin enviarlo fuera del equipo");
    try {
      const buffer = await file.arrayBuffer();
      const worker = new Worker(new URL("../lib/excel.worker.ts", import.meta.url), { type: "module" });
      workerRef.current = worker;
      worker.onmessage = (event) => {
        if (event.data.type === "phase") { setPhase(event.data.phase); setProgress(event.data.progress); }
        if (event.data.type === "complete") {
          const next = event.data.result as WorkerResult;
          setResult(next); setFeaturedDay(next.days[0]?.day ?? ""); setProgress(100); setPhase("Procesamiento completado"); setStatus("ready");
          worker.terminate();
          if (!next.orders.length) toast.warning("No se encontraron pedidos válidos desde B5.");
        }
        if (event.data.type === "error") { setStatus("error"); setPhase(event.data.message); worker.terminate(); }
      };
      worker.onerror = () => { setStatus("error"); setPhase("El archivo no se pudo procesar. Comprueba su estructura."); worker.terminate(); };
      worker.postMessage(buffer, [buffer]);
    } catch {
      setStatus("error"); setPhase("No se pudo abrir el archivo seleccionado.");
    }
  };

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es-ES");
    return (result?.orders ?? []).filter((order) =>
      (selectedDay === "todos" || order.day === selectedDay) &&
      (!query || order.orderNumber.toLocaleLowerCase("es-ES").includes(query) || order.supplier.toLocaleLowerCase("es-ES").includes(query)),
    );
  }, [result, search, selectedDay]);

  const savedDays = useMemo(() => [...new Set(saved.flatMap((batch) => batch.orders.map((order) => order.day)))], [saved]);
  const visibleSaved = saved.filter((batch) => savedDay === "todos" || batch.orders.some((order) => order.day === savedDay));

  const persistCurrent = async () => {
    if (!result?.orders.length || !featuredDay || !uploader.trim()) { toast.error("Indica quién sube el archivo y el día destacado."); return; }
    const batch: SavedBatch = { id: crypto.randomUUID(), fileName, createdAt: new Date().toISOString(), featuredDay, uploader: uploader.trim(), orders: result.orders };
    setSaved(await saveBatch(batch)); toast.success("Archivo guardado en este dispositivo.");
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); void processFile(event.dataTransfer.files[0]); };
  const onInput = (event: ChangeEvent<HTMLInputElement>) => void processFile(event.target.files?.[0]);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-10">
        <header className="flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md bg-primary text-primary-foreground"><FileSpreadsheet className="size-5" /></span>
            <div><h1 className="text-xl font-bold sm:text-2xl">Pedidos Duplicados - ZAL Seco</h1><p className="text-sm text-muted-foreground">Recepción y preparación de pedidos</p></div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium"><span className="size-2 rounded-full bg-emerald-500" />Procesamiento local</span>
            <Button onClick={reset}><Upload />Nuevo archivo</Button>
          </div>
        </header>

        <Tabs defaultValue="procesar" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:w-[420px]">
            <TabsTrigger value="procesar"><FileSpreadsheet className="mr-2 size-4" />Nuevo procesamiento</TabsTrigger>
            <TabsTrigger value="guardados"><FolderArchive className="mr-2 size-4" />Archivos guardados</TabsTrigger>
          </TabsList>

          <TabsContent value="procesar" className="space-y-6">
            <section className="grid gap-6 lg:grid-cols-[1.45fr_0.8fr]">
              <div className="space-y-6">
                <div className="rounded-lg border bg-card p-5 shadow-sm sm:p-7">
                  {status === "idle" ? (
                    <div onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop} className={`flex min-h-64 flex-col items-center justify-center rounded-md border-2 border-dashed p-7 text-center transition-colors ${dragging ? "border-primary bg-accent" : "border-border bg-muted/30"}`}>
                      <span className="mb-4 grid size-12 place-items-center rounded-full bg-secondary text-muted-foreground"><Upload className="size-5" /></span>
                      <h2 className="font-semibold">Carga el archivo de pedidos</h2><p className="mt-1 max-w-sm text-sm text-muted-foreground">Se analiza en este dispositivo. Admite Excel con macros: XLSX, XLS y XLSM.</p>
                      <input ref={inputRef} className="sr-only" type="file" accept=".xlsx,.xls,.xlsm" onChange={onInput} />
                      <Button variant="secondary" className="mt-5" onClick={() => inputRef.current?.click()}>Seleccionar desde el equipo</Button>
                    </div>
                  ) : (
                    <div className="min-h-64 animate-fade-in">
                      <div className="mb-7 flex items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-emerald-700"><FileSpreadsheet /></span><div className="min-w-0"><p className="truncate font-semibold">{fileName}</p><p className="text-xs text-muted-foreground">{status === "ready" ? `${result?.orders.length ?? 0} pedidos encontrados` : "Procesando libro de Excel"}</p></div></div><Button variant="ghost" size="icon" aria-label="Quitar archivo" onClick={reset}><X /></Button></div>
                      <ProcessingSteps active={status === "ready" ? 3 : status === "error" ? 1 : progress < 30 ? 0 : progress < 82 ? 1 : 2} />
                      <div className="mt-8 rounded-md bg-muted/70 p-4" aria-live="polite"><div className="mb-2 flex justify-between gap-4 text-sm"><span className={status === "error" ? "text-destructive" : "font-medium"}>{phase}</span><span>{progress}%</span></div><Progress value={progress} className="h-2" /></div>
                    </div>
                  )}
                </div>

                {status === "ready" && result && (
                  <div className="animate-fade-in rounded-lg border bg-card shadow-sm">
                    <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="font-semibold">Pedidos detectados</h2><p className="text-sm text-muted-foreground">{visibleOrders.length} de {result.orders.length} pedidos · {result.days.length} hojas PDF</p></div><div className="relative w-full sm:w-72"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar pedido o proveedor" className="pl-9" /></div></div>
                    <div className="flex gap-2 overflow-x-auto border-b p-4"><Button size="sm" variant={selectedDay === "todos" ? "default" : "outline"} onClick={() => setSelectedDay("todos")}>Todos <span className="ml-1 opacity-75">{result.orders.length}</span></Button>{result.days.map(({ day, orders }) => <Button key={day} size="sm" variant={selectedDay === day ? "default" : "outline"} onClick={() => setSelectedDay(day)}>{day} <span className="ml-1 opacity-75">{orders}</span></Button>)}</div>
                    <div className="max-h-80 overflow-auto"><table className="w-full text-left text-sm"><thead className="sticky top-0 bg-muted text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">Pedido</th><th className="px-5 py-3">Proveedor</th><th className="px-5 py-3">Día</th><th className="px-5 py-3 text-right">Cajas</th><th className="px-5 py-3"><span className="sr-only">Imprimir</span></th></tr></thead><tbody className="divide-y">{visibleOrders.map((order) => <tr key={order.id} className="hover:bg-muted/40"><td className="px-5 py-3 font-semibold">{order.orderNumber}</td><td className="px-5 py-3">{order.supplier}</td><td className="px-5 py-3 text-muted-foreground">{order.day}</td><td className="px-5 py-3 text-right font-semibold">{order.boxes}</td><td className="px-5 py-3 text-right"><Button variant="ghost" size="icon" aria-label={`Imprimir pedido ${order.orderNumber}`} onClick={() => createOrdersPdf([order], `pedido-${order.orderNumber}`)}><Printer /></Button></td></tr>)}</tbody></table></div>
                  </div>
                )}
              </div>

              <aside className="space-y-6">
                <div className="rounded-lg border bg-card p-5 shadow-sm"><h2 className="mb-5 font-semibold">Estado del procesamiento</h2><ProcessingSteps active={status === "ready" ? 3 : status === "idle" ? -1 : progress < 30 ? 0 : progress < 82 ? 1 : 2} /><div className="mt-6 flex items-center gap-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">{status === "ready" ? <CheckCircle2 className="size-4 text-emerald-600" /> : <Archive className="size-4" />}{status === "ready" ? "Listo para generar e imprimir" : "Esperando un archivo válido"}</div></div>
                {status === "ready" && result && <div className="animate-fade-in space-y-4 rounded-lg border bg-card p-5 shadow-sm"><div><h2 className="font-semibold">Preparar salida</h2><p className="text-sm text-muted-foreground">Una hoja horizontal por pedido.</p></div><label className="block text-sm font-medium">Subido por<Input className="mt-1.5" value={uploader} onChange={(event) => setUploader(event.target.value)} placeholder="Nombre de la persona" /></label><label className="block text-sm font-medium">Día destacado<select className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={featuredDay} onChange={(event) => setFeaturedDay(event.target.value)}>{result.days.map(({ day }) => <option key={day} value={day}>{day}</option>)}</select></label><Button className="w-full" onClick={() => createOrdersPdf(visibleOrders, selectedDay === "todos" ? "pedidos-duplicados" : `pedidos-${selectedDay}`)} disabled={!visibleOrders.length}><Download />Generar PDF ({visibleOrders.length})</Button><Button className="w-full" variant="secondary" onClick={persistCurrent}><Archive />Guardar procesamiento</Button>{result.warnings.length > 0 && <p className="text-xs text-muted-foreground">{result.warnings.length} hojas ignoradas por no tener la estructura B4/C4.</p>}</div>}
              </aside>
            </section>
          </TabsContent>

          <TabsContent value="guardados" className="space-y-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-lg font-semibold">Archivos guardados</h2><p className="text-sm text-muted-foreground">Procesamientos disponibles en este dispositivo.</p></div><div className="flex max-w-full gap-2 overflow-auto"><Button size="sm" variant={savedDay === "todos" ? "default" : "outline"} onClick={() => setSavedDay("todos")}>Todos</Button>{savedDays.map((day) => <Button size="sm" key={day} variant={savedDay === day ? "default" : "outline"} onClick={() => setSavedDay(day)}>{day}</Button>)}</div></div>
            {visibleSaved.length ? <div className="grid gap-4 md:grid-cols-2">{visibleSaved.map((batch) => { const batchOrders = savedDay === "todos" ? batch.orders : batch.orders.filter((order) => order.day === savedDay); return <article key={batch.id} className="rounded-lg border bg-card p-5 shadow-sm"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-emerald-700"><FileSpreadsheet /></span><div className="min-w-0 flex-1"><h3 className="truncate font-semibold">{batch.fileName}</h3><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><UserRound className="size-3" />{batch.uploader}</p></div><Button size="icon" variant="ghost" aria-label={`Eliminar ${batch.fileName}`} onClick={async () => setSaved(await deleteBatch(batch.id))}><Trash2 /></Button></div><div className="my-4 grid grid-cols-2 gap-3 rounded-md bg-muted p-3 text-sm"><span><CalendarDays className="mr-1 inline size-4" />{batch.featuredDay}</span><span className="text-right font-semibold">{batchOrders.length} pedidos</span></div><p className="mb-4 text-xs text-muted-foreground">Guardado el {new Date(batch.createdAt).toLocaleString("es-ES")}</p><Button variant="outline" className="w-full" onClick={() => createOrdersPdf(batchOrders, `pedidos-${batch.featuredDay}`)}><Printer />Preparar para imprimir</Button></article>; })}</div> : <div className="rounded-lg border border-dashed bg-card py-20 text-center"><FolderArchive className="mx-auto mb-3 size-9 text-muted-foreground" /><p className="font-medium">No hay archivos para este filtro</p><p className="text-sm text-muted-foreground">Los procesamientos guardados aparecerán aquí.</p></div>}
          </TabsContent>
        </Tabs>
        <footer className="border-t pt-5 text-center text-xs text-muted-foreground">Desarrollado en DHL Carrefour - ZAL Seco</footer>
      </div>
    </main>
  );
};

export default Index;
