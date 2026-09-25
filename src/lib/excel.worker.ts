import * as XLSX from "xlsx";
import type { DaySummary, Order, WorkerResult } from "./orders";

const normalize = (value: unknown) => String(value ?? "").trim();
const dayKey = (value: string) => value.toLocaleLowerCase("es-ES");

self.onmessage = (event: MessageEvent<ArrayBuffer>) => {
  try {
    self.postMessage({ type: "phase", phase: "Leyendo archivo", progress: 16 });
    const workbook = XLSX.read(event.data, { type: "array", bookVBA: true });
    self.postMessage({ type: "phase", phase: "Comprobando estructura", progress: 30 });
    const orders: Order[] = [];
    const dayNames = new Map<string, string>();
    const warnings: string[] = [];
    let validSheets = 0;

    workbook.SheetNames.forEach((sheetName, sheetIndex) => {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) return;
      self.postMessage({
        type: "phase",
        phase: `Detectando pedidos · ${sheetName}`,
        progress: 35 + Math.round(((sheetIndex + 1) / workbook.SheetNames.length) * 42),
      });
      const bounds = XLSX.utils.decode_range(sheet["!ref"] ?? "A1:A1");
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        raw: false,
        defval: "",
        range: { s: { r: 0, c: 0 }, e: bounds.e },
      });
      const headers = (rows[3] ?? []).map((cell) => normalize(cell).toLocaleUpperCase("es-ES"));
      if (!headers[1]?.includes("PEDIDO") || !headers[2]?.includes("PROVEEDOR")) {
        warnings.push(`${sheetName}: no se encontraron PEDIDO en B4 y PROVEEDOR en C4.`);
        return;
      }
      validSheets += 1;
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

    self.postMessage({ type: "phase", phase: "Separando jornadas", progress: 86 });
    const counts = new Map<string, { orders: number; boxes: number; complete: boolean }>();
    orders.forEach((order) => {
      const count = counts.get(order.day) ?? { orders: 0, boxes: 0, complete: true };
      const boxes = Number(order.boxes.replace(/\s/g, "").replace(",", "."));
      count.orders += 1;
      if (order.boxes === "—" || !Number.isFinite(boxes)) count.complete = false;
      else count.boxes += boxes;
      counts.set(order.day, count);
    });
    const days: DaySummary[] = [...counts].map(([day, count]) => ({ day, orders: count.orders, boxes: count.complete ? count.boxes : null }));
    self.postMessage({ type: "phase", phase: "Preparando resultados", progress: 96 });
    const result: WorkerResult = { orders, days, warnings, validSheets };
    self.postMessage({ type: "complete", result });
  } catch (error) {
    self.postMessage({ type: "error", message: error instanceof Error ? error.message : "No se pudo leer el archivo." });
  }
};
