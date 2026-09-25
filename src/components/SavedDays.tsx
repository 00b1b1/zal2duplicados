import { Archive, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { SavedBatch } from "@/lib/orders";

export const SavedDays = ({ batches, onPdf, onDelete, error }: { batches: SavedBatch[]; onPdf: (batch: SavedBatch) => void; onDelete: (id: string) => void; error: string }) => (
  <section aria-labelledby="saved-heading" className="space-y-5">
    <div><p className="step-label">HISTORIAL LOCAL</p><h2 id="saved-heading" className="text-2xl font-bold">Jornadas guardadas</h2><p className="text-sm text-muted-foreground">Se conservan en este dispositivo para volver a preparar su PDF.</p></div>
    {error && <p role="alert" className="error-panel">{error}</p>}
    {!batches.length ? <div className="border-y py-14 text-center"><Archive className="mx-auto mb-3 size-8" aria-hidden="true" /><p className="font-semibold">Aún no hay jornadas guardadas</p><p className="text-sm text-muted-foreground">Carga un Excel, elige un día y pulsa «Guardar jornada».</p></div> :
      <div className="divide-y border-y border-black/30">{batches.map((batch) => {
        const boxes = batch.orders.reduce((sum, order) => sum + Number(order.boxes.replace(",", ".")), 0);
        const hasBoxes = batch.orders.every((order) => order.boxes !== "—" && Number.isFinite(Number(order.boxes.replace(",", "."))));
        return <article key={batch.id} className="grid gap-3 py-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0"><h3 className="text-lg font-bold uppercase">{batch.day}</h3><p className="font-medium">{batch.orders.length} pedidos · {hasBoxes ? `${boxes} cajas` : "Cajas sin total disponible"}</p><p className="mt-2 break-all text-sm text-muted-foreground">Procesado por {batch.uploader} · Origen: {batch.fileName}</p><p className="text-sm text-muted-foreground">Guardado: {new Date(batch.createdAt).toLocaleString("es-ES")}</p></div>
          <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => onPdf(batch)}><Printer className="size-4" /> Preparar PDF</Button>
            <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" aria-label={`Eliminar jornada ${batch.day}`}><Trash2 className="size-4" /> Eliminar</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Eliminar jornada {batch.day}</AlertDialogTitle><AlertDialogDescription>Este registro dejará de estar disponible para volver a imprimir. El PDF que ya hayas descargado no se elimina.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(batch.id)}>Eliminar jornada</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
          </div></article>;
      })}</div>}
  </section>
);
