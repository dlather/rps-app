import { useState, useEffect, useCallback } from "react";

type SetValue<T> = T | ((prevValue: T) => T);

/**
 * Custom hook to synchronize state with localStorage.
 *
 * @param key - The key in localStorage.
 * @param initialValue - The initial value to use if the key does not exist.
 * @returns A tuple containing the stored value, a setter function, and a remover function.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void, () => void] {
  /**
   * Reads the value from localStorage.
   * If the key does not exist, returns the initialValue.
   */
  const readValue = useCallback((): T => {
    if (typeof window === "undefined") {
      // If window is undefined (e.g., during server-side rendering), return initialValue
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return initialValue;
      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  // Initialize state with the value from localStorage or the initialValue
  const [storedValue, setStoredValue] = useState<T>(readValue);

  /**
   * Sets a new value both in state and in localStorage.
   *
   * @param value - The new value or a function to update the current value.
   */
  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        // Determine the new value based on whether value is a function
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        // Update state
        setStoredValue(valueToStore);
        // Update localStorage immediately
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  /**
   * Removes the value from localStorage and resets the state to initialValue.
   */
  const removeValue = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  /**
   * Effect to listen for changes to localStorage from other tabs/windows.
   * This ensures that the state stays in sync across different browser contexts.
   */
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key) {
        setStoredValue(
          event.newValue ? (JSON.parse(event.newValue) as T) : initialValue
        );
      }
    };

    // Listen for storage events
    window.addEventListener("storage", handleStorageChange);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
