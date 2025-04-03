
import { jsPDF } from 'jspdf';
import { OrderData, ProcessedFile } from '@/types';

export const generatePDF = (
  fileData: ProcessedFile,
  selectedDay?: string,
  selectedOrderId?: string
): { pdf: jsPDF; pageCount: number } => {
  // Create a new PDF document
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Filter orders based on selected day or order ID
  let ordersToInclude = fileData.orders;
  if (selectedDay) {
    ordersToInclude = ordersToInclude.filter(order => order.day === selectedDay);
  }
  if (selectedOrderId) {
    ordersToInclude = ordersToInclude.filter(order => order.id === selectedOrderId);
  }
  
  // Process each order - one order per page
  ordersToInclude.forEach((order, index) => {
    // Add a new page for each order after the first one
    if (index > 0) {
      pdf.addPage();
    }
    
    // Add header to each page
    addHeader(pdf, fileData);
    
    // Add order details centered on the page
    addOrderDetails(pdf, order, 70);
    
    // Add footer with page numbers
    addFooter(pdf, index + 1, ordersToInclude.length, fileData);
  });
  
  return { pdf, pageCount: ordersToInclude.length };
};

const addHeader = (pdf: jsPDF, fileData: ProcessedFile) => {
  // Add DHL-inspired header
  pdf.setFillColor(255, 204, 0); // DHL Yellow
  pdf.rect(0, 0, 210, 20, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(212, 5, 17); // DHL Red
  pdf.setFontSize(16);
  pdf.text('Informe de Pedidos', 105, 12, { align: 'center' });
  
  // Add file metadata
  pdf.setFontSize(10);
  pdf.setTextColor(85, 85, 85); // Dark gray
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Archivo: ${fileData.fileName}`, 10, 25);
  pdf.text(`Fecha: ${fileData.uploadDate}`, 10, 30);
  pdf.text(`Procesado por: ${fileData.uploadedBy}`, 10, 35);
};

const addOrderDetails = (pdf: jsPDF, order: OrderData, y: number) => {
  // Add box for each order - larger and more prominent
  pdf.setFillColor(245, 245, 245);
  pdf.roundedRect(20, y - 10, 170, 120, 3, 3, 'F');
  
  // Add border with DHL yellow
  pdf.setDrawColor(255, 204, 0);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(20, y - 10, 170, 120, 3, 3, 'S');
  
  // Add order details
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(212, 5, 17); // DHL Red
  pdf.setFontSize(14);
  pdf.text(`Día: ${order.day}`, 105, y, { align: 'center' });
  
  pdf.setFontSize(18);
  pdf.text(`Pedido: ${order.order}`, 105, y + 20, { align: 'center' });
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(0);
  pdf.text(`Proveedor: ${order.supplier}`, 105, y + 40, { align: 'center' });
  
  if (order.details) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(85, 85, 85);
    pdf.text(`Detalles:`, 30, y + 70);
    
    // Use multiline text for details
    const splitDetails = pdf.splitTextToSize(order.details, 150);
    pdf.text(splitDetails, 30, y + 80);
  }
};

const addFooter = (pdf: jsPDF, currentPage: number, totalPages: number, fileData: ProcessedFile) => {
  pdf.setFillColor(212, 5, 17); // DHL Red
  pdf.rect(0, 287, 210, 10, 'F');
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(255);
  pdf.text(`Página ${currentPage} de ${totalPages}`, 105, 293, { align: 'center' });
  
  // Add copyright or company info
  pdf.text('Generado por Express Excel Ship', 20, 293);
  pdf.text(new Date().toLocaleDateString('es-ES'), 180, 293);
};
