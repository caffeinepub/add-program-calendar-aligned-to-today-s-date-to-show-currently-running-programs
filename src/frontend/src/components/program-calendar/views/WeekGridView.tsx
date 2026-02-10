import { useMemo } from 'react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { Program } from '../../../backend';
import DayCell from '../DayCell';

type GridDensity = 'comfortable' | 'compact';

interface WeekGridViewProps {
  currentDate: Date;
  programs: Program[];
  onDayClick: (date: Date) => void;
  onProgramClick: (program: Program) => void;
  gridDensity?: GridDensity;
}

export default function WeekGridView({
  currentDate,
  programs,
  onDayClick,
  onProgramClick,
  gridDensity = 'comfortable',
}: WeekGridViewProps) {
  const days = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const end = endOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const gapClass = gridDensity === 'comfortable' ? 'gap-3 md:gap-4' : 'gap-2 md:gap-2.5';

  return (
    <div className="space-y-5">
      <div className={`grid grid-cols-1 md:grid-cols-7 ${gapClass}`}>
        {days.map((day, index) => {
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
            <div key={day.toISOString()} className="space-y-2">
              <div className="text-center">
                <div className="text-sm font-semibold text-muted-foreground">
                  {weekDays[index]}
                </div>
                <div className="text-lg md:text-xl font-bold mt-1">
                  {format(day, 'd')}
                </div>
              </div>
              <DayCell
                date={day}
                programs={dayPrograms}
                isCurrentMonth={true}
                onClick={() => onDayClick(day)}
                variant="week"
                gridDensity={gridDensity}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
