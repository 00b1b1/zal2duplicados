
import * as XLSX from 'xlsx';
import { OrderData } from '@/types';

export const parseExcelFile = (file: File): Promise<{
  days: string[];
  orders: OrderData[];
  fileName: string;
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        
        // Set options to handle Excel files with macros (.xlsm)
        const options = { 
          type: 'array' as const,  // Use const assertion to fix type error
          bookVBA: true,  // Keep VBA (macro) code intact
          cellFormula: true,  // Parse cell formulas
          bookDeps: true,  // Parse calculation chain and other dependencies
          WTF: true  // Show errors
        };
        
        const workbook = XLSX.read(data, options);
        
        // Get all sheet names (days of the week)
        const days = workbook.SheetNames;
        
        let allOrders: OrderData[] = [];
        
        // Process each sheet (day)
        days.forEach(day => {
          const worksheet = workbook.Sheets[day];
          
          // Get the supplier from cell C4
          const supplier = worksheet['C4']?.v || 'Proveedor desconocido';
          
          // Convert worksheet to JSON starting from row 5 (where the data begins)
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 4 });
          
          // Process rows to extract orders
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            if (row && row.length > 1 && row[1]) { // Check if order cell (B column) has data
              allOrders.push({
                id: `${day}-${i}`,
                day,
                order: row[1].toString(),
                supplier: row[2] ? row[2].toString() : supplier, // Get supplier from column C of same row, fallback to C4
                details: row[3] ? row[3].toString() : undefined // Details from column D
              });
            }
          }
        });
        
        resolve({
          days,
          orders: allOrders,
          fileName: file.name
        });
      } catch (error) {
        console.error('Error al procesar archivo Excel:', error);
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
