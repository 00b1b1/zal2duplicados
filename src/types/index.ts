
export interface OrderData {
  id: string;
  day: string;
  order: string;
  supplier: string;
  details?: string;
}

export interface ProcessedFile {
  id: string;
  fileName: string;
  uploadDate: string;
  uploadedBy: string;
  orders: OrderData[];
  days: string[];
}
