"use client";

import { useEffect, useRef, useState } from "react";
import {
  deleteIndexedDbValue,
  getIndexedDbValue,
  setIndexedDbValue,
} from "@/lib/indexed-db";

/**
 * Persist large text values in IndexedDB to avoid localStorage quota limits.
 */
export function usePersistedTextState(
  key: string,
  initialValue: string,
): [string, (value: string | ((prev: string) => string)) => void] {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);
  const latestWriteRef = useRef(0);

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      try {
        const item = await getIndexedDbValue(key);
        if (!isCancelled && item !== null) {
          setStoredValue(item);
        }
      } catch (error) {
        console.error(`Error loading ${key} from IndexedDB:`, error);
      } finally {
        if (!isCancelled) {
          setIsHydrated(true);
        }
      }
    };

    void load();

    return () => {
      isCancelled = true;
    };
  }, [key]);

  const setValue = (value: string | ((prev: string) => string)) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);

    if (!isHydrated || typeof window === "undefined") {
      return;
    }

    latestWriteRef.current += 1;
    const writeVersion = latestWriteRef.current;

    void (async () => {
      try {
        if (valueToStore === "") {
          await deleteIndexedDbValue(key);
        } else {
          await setIndexedDbValue(key, valueToStore);
        }
      } catch (error) {
        if (writeVersion === latestWriteRef.current) {
          console.error(`Error saving ${key} to IndexedDB:`, error);
        }
      }
    })();
  };

  return [storedValue, setValue];
}
