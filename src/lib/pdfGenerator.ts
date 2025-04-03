
import { jsPDF } from 'jspdf';
import { OrderData, ProcessedFile } from '@/types';

export const generatePDF = (
  fileData: ProcessedFile,
  selectedDay?: string,
  selectedOrderId?: string
): { pdf: jsPDF; pageCount: number } => {
  // Create a new PDF document with landscape orientation
  const pdf = new jsPDF({
    orientation: 'landscape', // Cambio a orientación horizontal
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
  pdf.rect(0, 0, 297, 20, 'F'); // Adjusted width for landscape
  
  // Add "PEDIDO DUPLICADO" title prominently
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(212, 5, 17); // DHL Red
  pdf.setFontSize(22);
  pdf.text('PEDIDO DUPLICADO', 148, 12, { align: 'center' });
  
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
  pdf.roundedRect(20, y - 10, 257, 120, 3, 3, 'F'); // Adjusted width for landscape
  
  // Add border with DHL yellow
  pdf.setDrawColor(255, 204, 0);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(20, y - 10, 257, 120, 3, 3, 'S'); // Adjusted width for landscape
  
  // Add order details
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(212, 5, 17); // DHL Red
  pdf.setFontSize(14);
  pdf.text(`Día: ${order.day}`, 148, y, { align: 'center' }); // Adjusted for landscape
  
  pdf.setFontSize(22);
  pdf.text(`Pedido: ${order.order}`, 148, y + 20, { align: 'center' }); // Adjusted for landscape
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(0);
  pdf.text(`Proveedor: ${order.supplier}`, 148, y + 40, { align: 'center' }); // Adjusted for landscape
  
  if (order.details) {
    // Highlight the "NÚMERO DE CAJAS" title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(212, 5, 17); // DHL Red for emphasis
    pdf.text(`NÚMERO DE CAJAS:`, 30, y + 70);
    
    // Use multiline text for details with larger font and bold
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(0, 0, 0); // Black for better visibility
    const splitDetails = pdf.splitTextToSize(order.details, 230); // Adjusted width for landscape
    pdf.text(splitDetails, 30, y + 85);
  }
};

const addFooter = (pdf: jsPDF, currentPage: number, totalPages: number, fileData: ProcessedFile) => {
  pdf.setFillColor(212, 5, 17); // DHL Red
  pdf.rect(0, 200, 297, 10, 'F'); // Adjusted for landscape
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(255);
  pdf.text(`Página ${currentPage} de ${totalPages}`, 148, 206, { align: 'center' }); // Adjusted for landscape
  
  // Add custom footer text
  pdf.text('Desarrollado en DHL Carrefour - ZAL Seco', 20, 206);
  pdf.text(new Date().toLocaleDateString('es-ES'), 270, 206);
};
