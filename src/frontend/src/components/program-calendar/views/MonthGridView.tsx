import { useMemo } from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, addDays } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { Program } from '../../../backend';
import DayCell from '../DayCell';

type GridDensity = 'comfortable' | 'compact';

interface MonthGridViewProps {
  currentDate: Date;
  programs: Program[];
  onDayClick: (date: Date) => void;
  onProgramClick: (program: Program) => void;
  gridDensity?: GridDensity;
}

export default function MonthGridView({
  currentDate,
  programs,
  onDayClick,
  onProgramClick,
  gridDensity = 'comfortable',
}: MonthGridViewProps) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const gapClass = gridDensity === 'comfortable' ? 'gap-3 md:gap-4' : 'gap-1.5 md:gap-2';

  return (
    <div className="space-y-4">
      {/* Week day headers */}
      <div className={`grid grid-cols-7 ${gapClass}`}>
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm md:text-base font-semibold text-muted-foreground py-3"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className={`grid grid-cols-7 ${gapClass}`}>
        {days.map((day) => {
          const dayPrograms = programs.filter((p) => {
            const dayStart = new Date(day);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(day);
            dayEnd.setHours(23, 59, 59, 999);
            
            return (
              Number(p.endDate) >= dayStart.getTime() &&
              Number(p.startDate) <= dayEnd.getTime()
            );
          });

          return (
            <DayCell
              key={day.toISOString()}
              date={day}
              programs={dayPrograms}
              isCurrentMonth={isSameMonth(day, currentDate)}
              onClick={() => onDayClick(day)}
              gridDensity={gridDensity}
            />
          );
        })}
      </div>
    </div>
  );
}
