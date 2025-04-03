
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
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get all sheet names (days of the week)
        const days = workbook.SheetNames;
        
        let allOrders: OrderData[] = [];
        
        // Process each sheet (day)
        days.forEach(day => {
          const worksheet = workbook.Sheets[day];
          
          // Get the supplier from cell C4
          const supplier = worksheet['C4']?.v || 'Unknown Supplier';
          
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
                supplier,
                details: row[2] ? row[2].toString() : undefined
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
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
