
import * as XLSX from 'xlsx';
import { OrderData } from '@/types';

export const parseExcelFile = (file: File): Promise<{
  days: string[];
  orders: OrderData[];
  fileName: string;
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        
        // Set options to handle Excel files with macros (.xlsm)
        const options = { 
          type: 'array' as const,
          bookVBA: true,     // Keep VBA (macro) code intact
          cellFormula: true, // Parse cell formulas
          bookDeps: true,    // Parse calculation chain and other dependencies
          WTF: true          // Show errors
        };
        
        // Use setTimeout to allow UI to update between heavy operations
        setTimeout(() => {
          try {
            // Parse workbook in a non-blocking way
            const workbook = XLSX.read(data, options);
            
            // Get all sheet names (days of the week)
            const days = workbook.SheetNames;
            
            let allOrders: OrderData[] = [];
            
            // Process each sheet (day)
            days.forEach((day, dayIndex) => {
              // Use setTimeout to process each sheet with a small delay
              setTimeout(() => {
                try {
                  const worksheet = workbook.Sheets[day];
                  
                  // Convert worksheet to JSON starting from row 4 (where headers begin)
                  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 3 });
                  
                  // Get column indices from headers (row 4)
                  const headerRow = jsonData[0] as any[];
                  let orderColIndex = -1;
                  let supplierColIndex = -1;
                  let detailsColIndex = -1;
                  
                  if (headerRow) {
                    // Find column indices based on headers
                    headerRow.forEach((header, index) => {
                      if (header && typeof header === 'string') {
                        const headerText = header.toString().toLowerCase();
                        if (headerText.includes('pedido')) orderColIndex = index;
                        if (headerText.includes('proveedor')) supplierColIndex = index;
                        if (headerText.includes('detalle') || headerText.includes('caja') || headerText.includes('numero')) {
                          detailsColIndex = index;
                        }
                      }
                    });
                  }
                  
                  // If column indices not found, use default B and C columns
                  if (orderColIndex === -1) orderColIndex = 1; // Column B
                  if (supplierColIndex === -1) supplierColIndex = 2; // Column C
                  
                  // Process rows to extract orders
                  const dayOrders: OrderData[] = [];
                  for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i] as any[];
                    if (row && row.length > orderColIndex && row[orderColIndex]) {
                      dayOrders.push({
                        id: `${day}-${i}`,
                        day,
                        order: row[orderColIndex].toString(),
                        supplier: row[supplierColIndex] ? row[supplierColIndex].toString() : 'No especificado',
                        details: detailsColIndex !== -1 && row[detailsColIndex] ? row[detailsColIndex].toString() : undefined
                      });
                    }
                  }
                  
                  // Add orders from this day to all orders
                  allOrders = [...allOrders, ...dayOrders];
                  
                  // If this is the last day, resolve the promise
                  if (dayIndex === days.length - 1) {
                    resolve({
                      days,
                      orders: allOrders,
                      fileName: file.name
                    });
                  }
                } catch (error) {
                  console.error(`Error al procesar hoja ${day}:`, error);
                  if (dayIndex === days.length - 1) {
                    reject(error);
                  }
                }
              }, dayIndex * 50); // Small delay between sheets to keep UI responsive
            });
            
            // If no sheets were processed, resolve with empty data
            if (days.length === 0) {
              resolve({
                days: [],
                orders: [],
                fileName: file.name
              });
            }
          } catch (error) {
            console.error('Error al procesar archivo Excel:', error);
            reject(error);
          }
        }, 100); // Small delay to allow UI to update
      } catch (error) {
        console.error('Error al iniciar procesamiento de Excel:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      console.error('Error de FileReader:', error);
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
};
