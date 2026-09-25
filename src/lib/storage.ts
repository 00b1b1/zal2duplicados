import localforage from "localforage";
import type { SavedBatch } from "./orders";

const store = localforage.createInstance({ name: "pedidos-duplicados-zal", storeName: "batches" });
const KEY = "saved-batches-v2";

export const getSavedBatches = async () => (await store.getItem<SavedBatch[]>(KEY)) ?? [];

export const saveBatch = async (batch: SavedBatch) => {
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