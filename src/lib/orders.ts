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
};

export type SavedBatch = {
  id: string;
  fileName: string;
  createdAt: string;
  featuredDay: string;
  uploader: string;
  orders: Order[];
};

export type WorkerResult = {
  orders: Order[];
  days: DaySummary[];
  warnings: string[];
};