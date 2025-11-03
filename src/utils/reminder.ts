// src/utils/reminder.ts
export type ReminderHandler = (noteId: string, title: string, body: string) => void;

interface Scheduled {
  timeoutId: number;
}

const scheduledMap: Record<string, Scheduled> = {};

/**
 * Schedule a reminder for a given Date (client-side).
 * If time is in the past, triggers immediately.
 * Returns the timeoutId.
 */
export function scheduleReminder(
  noteId: string,
  dateISO: string,
  title: string,
  body: string,
  handler: ReminderHandler
): number | null {
  if (!dateISO) return null;
  const when = new Date(dateISO).getTime();
  const now = Date.now();
  const ms = when - now;

  // Common limit: setTimeout with very large durations may be unreliable.
  // For very long timeouts, we'll schedule for the nearest chunk and rehydrate later.
  const MAX_TIMEOUT = 2147483647; // ~24.8 days in ms

  const execute = () => {
    handler(noteId, title, body);
    // remove scheduled entry
    delete scheduledMap[noteId];
  };

  if (ms <= 0) {
    // trigger immediately
    window.setTimeout(execute, 200);
    return null;
  }

  const timeoutMs = ms > MAX_TIMEOUT ? MAX_TIMEOUT : ms;
  const timeoutId = window.setTimeout(() => {
    // if scheduled for longer than MAX_TIMEOUT, we re-schedule again when this chunk finishes
    if (ms > MAX_TIMEOUT) {
      // store remaining and re-schedule
      const remainingISO = new Date(Date.now() + (ms - MAX_TIMEOUT)).toISOString();
      scheduleReminder(noteId, remainingISO, title, body, handler);
      // clean current
      if (scheduledMap[noteId]) delete scheduledMap[noteId];
      return;
    }
    execute();
  }, timeoutMs);

  scheduledMap[noteId] = { timeoutId };
  return timeoutId;
}

export function cancelReminder(noteId: string) {
  const s = scheduledMap[noteId];
  if (s) {
    window.clearTimeout(s.timeoutId);
    delete scheduledMap[noteId];
  }
}

/**
 * Rehydrate reminders from an array of notes stored in localStorage.
 * - notes should contain { id, title, content, eventDate, remind }
 */
export function rehydrateReminders(
  notes: Array<{ id: string; title: string; content: string; eventDate?: string; remind?: boolean }>,
  handler: ReminderHandler
) {
  for (const n of notes) {
    if (n.remind && n.eventDate) {
      scheduleReminder(n.id, n.eventDate, n.title, n.content, handler);
    }
  }
}
