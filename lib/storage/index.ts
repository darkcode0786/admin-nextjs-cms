import { localStorageAdapter } from "./local-storage";
import type { StorageAdapter } from "./types";

export type { StorageAdapter, StoredObject, UploadFolder, UploadInput } from "./types";

export function getStorage(): StorageAdapter {
  return localStorageAdapter;
}
