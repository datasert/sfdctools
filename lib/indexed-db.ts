"use client";

const DATABASE_NAME = "sfdc-tools";
const DATABASE_VERSION = 1;
const STORE_NAME = "persisted-state";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to open IndexedDB."));
  });
}

export async function getIndexedDbValue(key: string): Promise<string | null> {
  if (typeof window === "undefined" || typeof window.indexedDB === "undefined") {
    return null;
  }

  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => {
      const result = request.result;
      resolve(typeof result === "string" ? result : null);
    };
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to read IndexedDB value."));

    transaction.oncomplete = () => database.close();
    transaction.onabort = () => database.close();
    transaction.onerror = () => database.close();
  });
}

export async function setIndexedDbValue(key: string, value: string): Promise<void> {
  if (typeof window === "undefined" || typeof window.indexedDB === "undefined") {
    return;
  }

  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(value, key);

    request.onsuccess = () => resolve();
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to write IndexedDB value."));

    transaction.oncomplete = () => database.close();
    transaction.onabort = () => database.close();
    transaction.onerror = () => database.close();
  });
}

export async function deleteIndexedDbValue(key: string): Promise<void> {
  if (typeof window === "undefined" || typeof window.indexedDB === "undefined") {
    return;
  }

  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to delete IndexedDB value."));

    transaction.oncomplete = () => database.close();
    transaction.onabort = () => database.close();
    transaction.onerror = () => database.close();
  });
}
