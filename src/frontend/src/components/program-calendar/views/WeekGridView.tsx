import { useMemo } from 'react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { Program } from '../../../backend';
import DayCell from '../DayCell';

interface WeekGridViewProps {
  currentDate: Date;
  programs: Program[];
  onDayClick: (date: Date) => void;
  onProgramClick: (program: Program) => void;
}

export default function WeekGridView({
  currentDate,
  programs,
  onDayClick,
  onProgramClick,
}: WeekGridViewProps) {
  const days = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const end = endOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const weekDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-3">
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
                <div className="text-xs md:text-sm font-semibold text-muted-foreground">
                  {weekDays[index]}
                </div>
                <div className="text-lg md:text-2xl font-bold">
                  {format(day, 'd', { locale: idLocale })}
                </div>
              </div>
              <DayCell
                date={day}
                programs={dayPrograms}
                isCurrentMonth={true}
                onClick={() => onDayClick(day)}
                variant="week"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
