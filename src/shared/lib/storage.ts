/**
 * AsyncStorage Wrapper
 *
 * Type-safe wrapper around AsyncStorage for consistent data persistence.
 * Handles JSON serialization, error handling, and data migration.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys constants
export const STORAGE_KEYS = {
  USER_PROGRESS: 'vocabulary-progress',
  SETTINGS: 'vocabulary-settings',
  VERSION: 'vocabulary-version',
  LAST_SYNC: 'vocabulary-last-sync',
} as const;

// Current storage version for migration
const CURRENT_VERSION = '1.0.0';

/**
 * Get item from AsyncStorage with JSON parsing
 * @param key Storage key
 * @returns Parsed value or null if not found
 */
export async function getItem<T>(key: string): Promise<T | null> {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    if (jsonValue === null) {
      return null;
    }
    return JSON.parse(jsonValue) as T;
  } catch (error) {
    console.error(`Error getting item ${key} from storage:`, error);
    return null;
  }
}

/**
 * Set item in AsyncStorage with JSON stringification
 * @param key Storage key
 * @param value Value to store
 */
export async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error(`Error setting item ${key} in storage:`, error);
    throw error;
  }
}

/**
 * Remove item from AsyncStorage
 * @param key Storage key
 */
export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing item ${key} from storage:`, error);
    throw error;
  }
}

/**
 * Clear all data from AsyncStorage
 */
export async function clear(): Promise<void> {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
}

/**
 * Get all keys from AsyncStorage
 */
export async function getAllKeys(): Promise<readonly string[]> {
  try {
    return await AsyncStorage.getAllKeys();
  } catch (error) {
    console.error('Error getting all keys from storage:', error);
    return [];
  }
}

/**
 * Get multiple items from AsyncStorage
 * @param keys Array of storage keys
 */
export async function multiGet<T>(keys: string[]): Promise<Record<string, T | null>> {
  try {
    const pairs = await AsyncStorage.multiGet(keys);
    const result: Record<string, T | null> = {};

    pairs.forEach(([key, value]) => {
      if (value !== null) {
        try {
          result[key] = JSON.parse(value) as T;
        } catch {
          result[key] = null;
        }
      } else {
        result[key] = null;
      }
    });

    return result;
  } catch (error) {
    console.error('Error getting multiple items from storage:', error);
    return {};
  }
}

/**
 * Set multiple items in AsyncStorage
 * @param items Record of key-value pairs to store
 */
export async function multiSet(items: Record<string, unknown>): Promise<void> {
  try {
    const pairs: [string, string][] = Object.entries(items).map(([key, value]) => [
      key,
      JSON.stringify(value),
    ]);
    await AsyncStorage.multiSet(pairs);
  } catch (error) {
    console.error('Error setting multiple items in storage:', error);
    throw error;
  }
}

/**
 * Get current storage version
 */
export async function getVersion(): Promise<string> {
  const version = await getItem<string>(STORAGE_KEYS.VERSION);
  return version || CURRENT_VERSION;
}

/**
 * Set storage version
 */
export async function setVersion(version: string): Promise<void> {
  await setItem(STORAGE_KEYS.VERSION, version);
}

/**
 * Migrate data from old version to new version
 * Placeholder for future schema changes
 * @param oldVersion Previous version
 * @param newVersion Target version
 */
export async function migrate(oldVersion: string, newVersion: string): Promise<void> {
  console.log(`Migrating storage from ${oldVersion} to ${newVersion}`);

  // Placeholder for future migrations
  // Example migration logic:
  // if (oldVersion === '1.0.0' && newVersion === '1.1.0') {
  //   // Perform migration steps
  // }

  await setVersion(newVersion);
}

/**
 * Initialize storage and check for migrations
 */
export async function initializeStorage(): Promise<void> {
  try {
    const currentVersion = await getVersion();

    if (currentVersion !== CURRENT_VERSION) {
      await migrate(currentVersion, CURRENT_VERSION);
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}
