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
    const stored = localStorage.getItem(REMINDER_STORAGE_KEY);
    if (!stored) return false;

    const records: Record<string, ReminderRecord> = JSON.parse(stored);
    const record = records[key];

    if (!record) return false;

    // Check if expired
    const now = Date.now();
    if (now - record.timestamp > EXPIRY_TIME) {
      // Clean up expired record
      delete records[key];
      localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(records));
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
    const stored = localStorage.getItem(REMINDER_STORAGE_KEY);
    const records: Record<string, ReminderRecord> = stored ? JSON.parse(stored) : {};

    records[key] = { timestamp: Date.now() };

    // Clean up old records
    const now = Date.now();
    Object.keys(records).forEach((k) => {
      if (now - records[k].timestamp > EXPIRY_TIME) {
        delete records[k];
      }
    });

    localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('Error marking reminder:', error);
  }
}
