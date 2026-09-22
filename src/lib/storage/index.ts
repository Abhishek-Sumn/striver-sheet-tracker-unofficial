import { StorageAdapter } from "./types";
import { LocalStorageAdapter } from "./localStorageAdapter";

// StorageAdapter singleton instance
// When cloud sync is implemented, this can be dynamically swapped with CloudStorageAdapter
let storageInstance: StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
  if (!storageInstance) {
    storageInstance = new LocalStorageAdapter();
  }
  return storageInstance;
}

export * from "./types";
export * from "./localStorageAdapter";
