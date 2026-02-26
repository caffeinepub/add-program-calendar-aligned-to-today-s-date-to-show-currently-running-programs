/**
 * Safe localStorage utilities with fallback for restricted environments
 */

export function safeGetJSON<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`Failed to read from localStorage (key: ${key}):`, error);
    return defaultValue;
  }
}

export function safeSetJSON<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Failed to write to localStorage (key: ${key}):`, error);
    return false;
  }
}

export function safeGetString(key: string, defaultValue: string): string {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const item = localStorage.getItem(key);
    return item !== null ? item : defaultValue;
  } catch (error) {
    console.warn(`Failed to read from localStorage (key: ${key}):`, error);
    return defaultValue;
  }
}

export function safeSetString(key: string, value: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Failed to write to localStorage (key: ${key}):`, error);
    return false;
  }
}

export function safeRemove(key: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove from localStorage (key: ${key}):`, error);
    return false;
  }
}
