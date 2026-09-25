import * as XLSX from "xlsx";
import type { DaySummary, Order, WorkerResult } from "./orders";

const normalize = (value: unknown) => String(value ?? "").trim();
const dayKey = (value: string) => value.toLocaleLowerCase("es-ES");

self.onmessage = (event: MessageEvent<ArrayBuffer>) => {
  try {
    self.postMessage({ type: "phase", phase: "Leyendo la estructura del libro", progress: 22 });
    const workbook = XLSX.read(event.data, { type: "array", bookVBA: true });
    const orders: Order[] = [];
    const dayNames = new Map<string, string>();
    const warnings: string[] = [];

    workbook.SheetNames.forEach((sheetName, sheetIndex) => {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) return;
      self.postMessage({
        type: "phase",
        phase: `Analizando ${sheetName}`,
        progress: 32 + Math.round(((sheetIndex + 1) / workbook.SheetNames.length) * 45),
      });
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: "", range: 0 });
      const headers = (rows[3] ?? []).map((cell) => normalize(cell).toLocaleUpperCase("es-ES"));
      if (!headers[1]?.includes("PEDIDO") || !headers[2]?.includes("PROVEEDOR")) {
        warnings.push(`${sheetName}: no se encontraron PEDIDO en B4 y PROVEEDOR en C4.`);
        return;
      }
      const boxesIndex = Math.max(3, headers.findIndex((header) => header.includes("CAJA")));
      const canonicalDay = dayNames.get(dayKey(sheetName)) ?? sheetName.trim();
      dayNames.set(dayKey(sheetName), canonicalDay);
      rows.slice(4).forEach((row, rowIndex) => {
        const orderNumber = normalize(row[1]);
        const supplier = normalize(row[2]);
        if (!orderNumber || !supplier) return;
        orders.push({
          id: `${sheetIndex}-${rowIndex}-${orderNumber}`,
          day: canonicalDay,
          orderNumber,
          supplier,
          boxes: normalize(row[boxesIndex]) || "—",
        });
      });
    });

    self.postMessage({ type: "phase", phase: "Agrupando días y preparando la revisión", progress: 91 });
    const counts = new Map<string, number>();
    orders.forEach((order) => counts.set(order.day, (counts.get(order.day) ?? 0) + 1));
    const days: DaySummary[] = [...counts].map(([day, count]) => ({ day, orders: count }));
    const result: WorkerResult = { orders, days, warnings };
    self.postMessage({ type: "complete", result });
  } catch (error) {
    self.postMessage({ type: "error", message: error instanceof Error ? error.message : "No se pudo leer el archivo." });
  }
};