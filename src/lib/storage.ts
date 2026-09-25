import localforage from "localforage";
import type { SavedBatch } from "./orders";

const store = localforage.createInstance({ name: "pedidos-duplicados-zal", storeName: "batches" });
const KEY = "saved-days-v3";
const LEGACY_KEY = "saved-batches-v2";

type LegacyBatch = Omit<SavedBatch, "day"> & { featuredDay: string };

export const getSavedBatches = async (): Promise<SavedBatch[]> => {
  const current = await store.getItem<SavedBatch[]>(KEY);
  if (current) return current;
  const legacy = await store.getItem<LegacyBatch[]>(LEGACY_KEY);
  if (!legacy) return [];
  // Older records contained the whole workbook. Split them into one record per day.
  const migrated = legacy.flatMap((batch) => [...new Set(batch.orders.map((order) => order.day))].map((day) => ({
    id: `${batch.id}-${day}`, fileName: batch.fileName, createdAt: batch.createdAt,
    day, uploader: batch.uploader, orders: batch.orders.filter((order) => order.day === day),
  })));
  await store.setItem(KEY, migrated);
  return migrated;
};

export const saveBatch = async (batch: SavedBatch) => {
  if (!batch.day || !batch.orders.length || batch.orders.some((order) => order.day !== batch.day)) {
    throw new Error("La jornada contiene pedidos de otro día.");
  }
  const current = await getSavedBatches();
  const next = [batch, ...current].slice(0, 30);
  await store.setItem(KEY, next);
  return next;
};

export const deleteBatch = async (id: string) => {
  const next = (await getSavedBatches()).filter((batch) => batch.id !== id);
  await store.setItem(KEY, next);
  return next;
};
