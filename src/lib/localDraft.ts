import { get, set, del } from "idb-keyval";

// Stores the entire working draft (form state + photos as data URLs) locally
// in IndexedDB so nothing is lost — works offline, survives reload/crash.

const KEY = "avalix:current-draft:v1";

export interface LocalDraft {
  evaluationId: string | null;
  // Free-form snapshot of the form state. Photos are kept as data URLs OR URLs.
  state: Record<string, unknown>;
  updatedAt: number;
  // Photos that still need to be uploaded once we're online.
  pendingUpload?: boolean;
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
