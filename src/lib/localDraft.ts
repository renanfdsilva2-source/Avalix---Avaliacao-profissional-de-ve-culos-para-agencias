import { get, set, del, update } from "idb-keyval";

// Stores the entire working draft (form state + photos as data URLs) locally
// in IndexedDB so nothing is lost — works offline, survives reload/crash.

const KEY = "avalix:current-draft:v1";
const QUEUE_KEY = "avalix:offline-queue:v1";

export interface LocalDraft {
  evaluationId: string | null;
  // Free-form snapshot of the form state. Photos are kept as data URLs OR URLs.
  state: Record<string, unknown>;
  updatedAt: number;
  // Photos that still need to be uploaded once we're online.
  pendingUpload?: boolean;
}

export interface OfflineQueueItem extends LocalDraft {
  id: string;
  status: "draft" | "completed";
  queuedAt: number;
  attempt: number;
  clientUpdatedAt: string;
}

export async function loadLocalDraft(): Promise<LocalDraft | null> {
  try {
    const v = await get<LocalDraft>(KEY);
    return v ?? null;
  } catch (e) {
    console.warn("localDraft load failed", e);
    return null;
  }
}

export async function saveLocalDraft(draft: LocalDraft): Promise<void> {
  try {
    await set(KEY, draft);
  } catch (e) {
    console.warn("localDraft save failed", e);
  }
}

export async function clearLocalDraft(): Promise<void> {
  try {
    await del(KEY);
  } catch (e) {
    console.warn("localDraft clear failed", e);
  }
}

export async function loadOfflineQueue(): Promise<OfflineQueueItem[]> {
  try {
    return (await get<OfflineQueueItem[]>(QUEUE_KEY)) ?? [];
  } catch (e) {
    console.warn("offlineQueue load failed", e);
    return [];
  }
}

export async function enqueueOfflineSave(item: Omit<OfflineQueueItem, "id" | "queuedAt" | "attempt">): Promise<void> {
  try {
    await update<OfflineQueueItem[]>(QUEUE_KEY, (queue = []) => {
      const id = `${item.evaluationId ?? "local"}:${item.clientUpdatedAt}`;
      const next: OfflineQueueItem = { ...item, id, queuedAt: Date.now(), attempt: 0 };
      return [...queue.filter((q) => q.evaluationId !== item.evaluationId), next];
    });
  } catch (e) {
    console.warn("offlineQueue enqueue failed", e);
  }
}

export async function removeOfflineQueueItem(id: string): Promise<void> {
  try {
    await update<OfflineQueueItem[]>(QUEUE_KEY, (queue = []) => queue.filter((item) => item.id !== id));
  } catch (e) {
    console.warn("offlineQueue remove failed", e);
  }
}
