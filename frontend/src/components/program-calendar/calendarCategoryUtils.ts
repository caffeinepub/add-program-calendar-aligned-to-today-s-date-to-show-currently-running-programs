import { format, isSameDay } from 'date-fns';
import type { Program, TeamAgendaItem, Kpi } from '../../backend';

export type CategoryType = 'program' | 'agenda' | 'kpi';

export function getCategoryColor(category: CategoryType): string {
  switch (category) {
    case 'program':
      return '#3b82f6'; // Blue
    case 'agenda':
      return '#10b981'; // Green
    case 'kpi':
      return '#ef4444'; // Red
    default:
      return '#6b7280'; // Gray
  }
}

export function computeDayCategoryCounts(
  days: Date[],
  programs: Program[],
  agendaItems: TeamAgendaItem[],
  kpiDeadlines: Kpi[]
): Record<string, { program: number; agenda: number; kpi: number }> {
  const counts: Record<string, { program: number; agenda: number; kpi: number }> = {};

  days.forEach((day) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    let programCount = 0;
    let agendaCount = 0;
    let kpiCount = 0;

    // Count programs active on this day
    programs.forEach((program) => {
      const programStart = Number(program.startDate);
      const programEnd = Number(program.endDate);
      if (programEnd >= dayStart.getTime() && programStart <= dayEnd.getTime()) {
        programCount++;
      }
    });

    // Count agenda items on this day
    agendaItems.forEach((item) => {
      const itemStart = Number(item.startTime);
      const itemEnd = Number(item.endTime);
      if (itemEnd >= dayStart.getTime() && itemStart <= dayEnd.getTime()) {
        agendaCount++;
      }
    });

    // Count KPI deadlines on this day
    kpiDeadlines.forEach((kpi) => {
      if (kpi.deadline) {
        const deadlineDate = new Date(Number(kpi.deadline));
        if (isSameDay(deadlineDate, day)) {
          kpiCount++;
        }
      }
    });

    counts[dateKey] = { program: programCount, agenda: agendaCount, kpi: kpiCount };
  });

  return counts;
}
