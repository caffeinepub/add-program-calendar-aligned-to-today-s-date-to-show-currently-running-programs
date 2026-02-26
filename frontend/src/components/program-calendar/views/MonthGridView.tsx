import { useMemo } from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { Program, TeamAgendaItem, Kpi } from '../../../backend';
import DayCell from '../DayCell';
import { computeDayCategoryCounts } from '../calendarCategoryUtils';

interface MonthGridViewProps {
  currentDate: Date;
  programs: Program[];
  agendaItems: TeamAgendaItem[];
  kpiDeadlines: Kpi[];
  onDayClick: (date: Date) => void;
  onProgramClick: (program: Program) => void;
  gridDensity: 'comfortable' | 'compact';
}

export default function MonthGridView({
  currentDate,
  programs,
  agendaItems,
  kpiDeadlines,
  onDayClick,
  gridDensity,
}: MonthGridViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const dayCounts = useMemo(() => {
    return computeDayCategoryCounts(days, programs, agendaItems, kpiDeadlines);
  }, [days, programs, agendaItems, kpiDeadlines]);

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-2">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1.5">
        {weekdays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-1.5"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const counts = dayCounts[dateKey] || { program: 0, agenda: 0, kpi: 0 };
          
          return (
            <DayCell
              key={day.toISOString()}
              date={day}
              isCurrentMonth={isSameMonth(day, currentDate)}
              categoryCounts={counts}
              onClick={() => onDayClick(day)}
              density={gridDensity}
            />
          );
        })}
      </div>
    </div>
  );
}
