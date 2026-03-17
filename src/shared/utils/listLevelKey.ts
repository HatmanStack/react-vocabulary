/**
 * Constructs the composite key for listLevelProgress lookups.
 * Single source of truth for the key format used across stores.
 */
export function makeListLevelKey(listId: string, levelId: string): string {
  return `${listId}-${levelId}`;
}
