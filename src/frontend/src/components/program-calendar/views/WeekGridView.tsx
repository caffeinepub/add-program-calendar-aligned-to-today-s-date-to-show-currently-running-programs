import { useMemo } from 'react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { Program, TeamAgendaItem, Kpi } from '../../../backend';
import DayCell from '../DayCell';
import { computeDayCategoryCounts } from '../calendarCategoryUtils';

interface WeekGridViewProps {
  currentDate: Date;
  programs: Program[];
  agendaItems: TeamAgendaItem[];
  kpiDeadlines: Kpi[];
  onDayClick: (date: Date) => void;
  onProgramClick: (program: Program) => void;
  gridDensity: 'comfortable' | 'compact';
}

export default function WeekGridView({
  currentDate,
  programs,
  agendaItems,
  kpiDeadlines,
  onDayClick,
  gridDensity,
}: WeekGridViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const dayCounts = useMemo(() => {
    return computeDayCategoryCounts(days, programs, agendaItems, kpiDeadlines);
  }, [days, programs, agendaItems, kpiDeadlines]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
      {days.map((day) => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const counts = dayCounts[dateKey] || { program: 0, agenda: 0, kpi: 0 };

        return (
          <div key={day.toISOString()} className="space-y-1.5">
            <div className="text-center">
              <div className="text-xs font-medium text-muted-foreground">
                {format(day, 'EEE', { locale: enUS })}
              </div>
            </div>
            <DayCell
              date={day}
              isCurrentMonth={true}
              categoryCounts={counts}
              onClick={() => onDayClick(day)}
              density={gridDensity}
            />
          </div>
        );
      })}
    </div>
  );
}
