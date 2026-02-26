import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { Program, TeamAgendaItem, Kpi } from '../backend';
import { getReminderKey, isReminderShown, markReminderShown } from '../utils/reminderDedup';

interface UseCalendarRemindersProps {
  programs: Program[];
  agendaItems: TeamAgendaItem[];
  kpiDeadlines: Kpi[];
  enabled: boolean;
}

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
const THREE_HOURS = 3 * 60 * 60 * 1000;

export function useCalendarReminders({
  programs,
  agendaItems,
  kpiDeadlines,
  enabled,
}: UseCalendarRemindersProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const checkReminders = () => {
      const now = Date.now();

      // Check programs
      programs.forEach((program) => {
        try {
          const startTime = Number(program.startDate);
          const timeDiff = startTime - now;

          // 24-hour reminder
          if (timeDiff > 0 && timeDiff <= TWENTY_FOUR_HOURS) {
            const key = getReminderKey('program', String(program.id), '24h');
            if (!isReminderShown(key)) {
              showReminder('Program Starting Soon', `${program.name} starts in 24 hours`, 'program');
              markReminderShown(key);
            }
          }

          // 3-hour reminder
          if (timeDiff > 0 && timeDiff <= THREE_HOURS) {
            const key = getReminderKey('program', String(program.id), '3h');
            if (!isReminderShown(key)) {
              showReminder('Program Starting Soon', `${program.name} starts in 3 hours`, 'program');
              markReminderShown(key);
            }
          }
        } catch (error) {
          console.warn('Error processing program reminder:', error);
        }
      });

      // Check agenda items
      agendaItems.forEach((item) => {
        try {
          const startTime = Number(item.startTime);
          const timeDiff = startTime - now;

          // 24-hour reminder
          if (timeDiff > 0 && timeDiff <= TWENTY_FOUR_HOURS) {
            const key = getReminderKey('agenda', String(item.id), '24h');
            if (!isReminderShown(key)) {
              showReminder('Team Agenda Reminder', `${item.title} is in 24 hours`, 'agenda');
              markReminderShown(key);
            }
          }

          // 3-hour reminder
          if (timeDiff > 0 && timeDiff <= THREE_HOURS) {
            const key = getReminderKey('agenda', String(item.id), '3h');
            if (!isReminderShown(key)) {
              showReminder('Team Agenda Reminder', `${item.title} is in 3 hours`, 'agenda');
              markReminderShown(key);
            }
          }
        } catch (error) {
          console.warn('Error processing agenda reminder:', error);
        }
      });

      // Check KPI deadlines
      kpiDeadlines.forEach((kpi) => {
        try {
          if (kpi.deadline) {
            const deadlineTime = Number(kpi.deadline);
            const timeDiff = deadlineTime - now;

            // 24-hour reminder
            if (timeDiff > 0 && timeDiff <= TWENTY_FOUR_HOURS) {
              const key = getReminderKey('kpi', String(kpi.id), '24h');
              if (!isReminderShown(key)) {
                showReminder('KPI Deadline Approaching', `${kpi.name} deadline is in 24 hours`, 'kpi');
                markReminderShown(key);
              }
            }

            // 3-hour reminder
            if (timeDiff > 0 && timeDiff <= THREE_HOURS) {
              const key = getReminderKey('kpi', String(kpi.id), '3h');
              if (!isReminderShown(key)) {
                showReminder('KPI Deadline Approaching', `${kpi.name} deadline is in 3 hours`, 'kpi');
                markReminderShown(key);
              }
            }
          }
        } catch (error) {
          console.warn('Error processing KPI reminder:', error);
        }
      });
    };

    // Check immediately
    checkReminders();

    // Check every 5 minutes
    intervalRef.current = setInterval(checkReminders, 5 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [programs, agendaItems, kpiDeadlines, enabled]);
}

function showReminder(title: string, message: string, category: 'program' | 'agenda' | 'kpi') {
  // Show in-app toast
  toast.info(message, {
    description: title,
    duration: 10000,
  });

  // Try browser notification if permission granted and supported
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body: message,
          icon: '/assets/Satu-Dekade-SHQ-Logo_Alt.png',
          tag: `reminder-${category}`,
        });
      }
    } catch (error) {
      console.warn('Failed to show notification:', error);
    }
  }
}
