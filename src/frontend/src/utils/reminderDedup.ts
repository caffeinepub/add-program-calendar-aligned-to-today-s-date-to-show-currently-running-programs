import { safeGetJSON, safeSetJSON } from './safeBrowserStorage';

const REMINDER_STORAGE_KEY = 'calendarRemindersShown';
const EXPIRY_TIME = 48 * 60 * 60 * 1000; // 48 hours

interface ReminderRecord {
  timestamp: number;
}

export function getReminderKey(category: string, itemId: string, leadTime: string): string {
  return `${category}-${itemId}-${leadTime}`;
}

export function isReminderShown(key: string): boolean {
  try {
    const records = safeGetJSON<Record<string, ReminderRecord>>(REMINDER_STORAGE_KEY, {});
    const record = records[key];

    if (!record) return false;

    // Check if expired
    const now = Date.now();
    if (now - record.timestamp > EXPIRY_TIME) {
      // Clean up expired record
      delete records[key];
      safeSetJSON(REMINDER_STORAGE_KEY, records);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking reminder:', error);
    return false;
  }
}

export function markReminderShown(key: string): void {
  try {
    const records = safeGetJSON<Record<string, ReminderRecord>>(REMINDER_STORAGE_KEY, {});
    records[key] = { timestamp: Date.now() };

    // Clean up old records
    const now = Date.now();
    Object.keys(records).forEach((k) => {
      if (now - records[k].timestamp > EXPIRY_TIME) {
        delete records[k];
      }
    });

    safeSetJSON(REMINDER_STORAGE_KEY, records);
  } catch (error) {
    console.error('Error marking reminder:', error);
  }
}
