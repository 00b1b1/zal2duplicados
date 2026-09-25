import { jsPDF } from "jspdf";
import logo from "@/assets/dhl-logo.png";
import type { Order } from "./orders";

export const safeFilePart = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "sin-nombre";
export const dayPdfName = (day: string) => `duplicados-${safeFilePart(day).toUpperCase()}`;
export const orderPdfName = (orderNumber: string) => `pedido-${safeFilePart(orderNumber)}`;

export const createOrdersPdf = (orders: Order[], fileName: string) => {
  if (!orders.length) throw new Error("No hay pedidos para el PDF.");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const width = doc.internal.pageSize.getWidth();

  orders.forEach((order, index) => {
    if (index) doc.addPage("a4", "landscape");
    doc.setFillColor(255, 204, 0);
    doc.rect(0, 0, width, 9, "F");
    doc.addImage(logo, "PNG", 17, 14, 42, 14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(14);
    doc.text("PEDIDO DUPLICADO", 68, 23);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`JORNADA: ${order.day.toLocaleUpperCase("es-ES")}`, width - 17, 23, { align: "right" });
    doc.setDrawColor(90, 90, 90);
    doc.line(17, 34, width - 17, 34);

    doc.setTextColor(95, 95, 95);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("N.º PEDIDO", 17, 52);
    doc.setTextColor(25, 25, 25);
    doc.setFontSize(54);
    const orderWidth = width - 34;
    const orderScale = Math.min(1, orderWidth / doc.getTextWidth(order.orderNumber));
    doc.setFontSize(Math.max(26, 54 * orderScale));
    doc.text(order.orderNumber, 17, 76);
    doc.setDrawColor(212, 5, 17);
    doc.setLineWidth(1.4);
    doc.line(17, 86, width - 17, 86);

    doc.setTextColor(95, 95, 95);
    doc.setFontSize(12);
    doc.text("PROVEEDOR", 17, 105);
    doc.setTextColor(25, 25, 25);
    doc.setFontSize(28);
    const supplierLines = doc.splitTextToSize(order.supplier, width - 80) as string[];
    if (supplierLines.length > 2) doc.setFontSize(20);
    const lines = doc.splitTextToSize(order.supplier, width - 80) as string[];
    doc.text(lines.slice(0, 3), 17, 120, { lineHeightFactor: 1.15 });

    doc.setFillColor(255, 204, 0);
    doc.rect(width - 65, 100, 48, 40, "F");
    doc.setTextColor(25, 25, 25);
    doc.setFontSize(10);
    doc.text("CAJAS", width - 41, 111, { align: "center" });
    doc.setFontSize(27);
    doc.text(order.boxes, width - 41, 132, { align: "center", maxWidth: 42 });

    doc.setLineWidth(0.2);
    doc.setDrawColor(170, 170, 170);
    doc.line(17, 186, width - 17, 186);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(95, 95, 95);
    doc.text("ZAL Seco · Preparación de pedidos duplicados", 17, 195);
    doc.text(`${index + 1} / ${orders.length}`, width - 17, 195, { align: "right" });
  });
  doc.save(`${safeFilePart(fileName)}.pdf`);
};
