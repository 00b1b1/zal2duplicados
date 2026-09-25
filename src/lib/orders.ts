export type Order = {
  id: string;
  day: string;
  orderNumber: string;
  supplier: string;
  boxes: string;
};

export type DaySummary = {
  day: string;
  orders: number;
  boxes: number | null;
};

export type SavedBatch = {
  id: string;
  fileName: string;
  createdAt: string;
  day: string;
  uploader: string;
  orders: Order[];
};

export type WorkerResult = {
  orders: Order[];
  days: DaySummary[];
  warnings: string[];
  validSheets: number;
};
