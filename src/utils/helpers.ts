/**
 * Utility functions for Vault Recall
 */

/**
 * Generates a unique ID for questions and quiz attempts.
 * Format: 8 random alphanumeric characters.
 */
export function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Gets the current timestamp in ISO format.
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Gets today's date as YYYY-MM-DD.
 */
export function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Shuffles an array in place using Fisher-Yates algorithm.
 * Returns the same array reference.
 */
export function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j]!;
    array[j] = temp!;
  }
  return array;
}

/**
 * Creates a shuffled copy of an array.
 */
export function shuffledCopy<T>(array: T[]): T[] {
  return shuffleArray([...array]);
}
