import { format, isToday } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { getCategoryColor } from './calendarCategoryUtils';

interface DayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  categoryCounts: {
    program: number;
    agenda: number;
    kpi: number;
  };
  onClick: () => void;
  density: 'comfortable' | 'compact';
}

export default function DayCell({
  date,
  isCurrentMonth,
  categoryCounts,
  onClick,
  density,
}: DayCellProps) {
  const today = isToday(date);
  const hasItems = categoryCounts.program > 0 || categoryCounts.agenda > 0 || categoryCounts.kpi > 0;

  const paddingClass = density === 'comfortable' ? 'p-2.5' : 'p-2';
  const heightClass = density === 'comfortable' ? 'min-h-[90px]' : 'min-h-[70px]';

  return (
    <button
      onClick={onClick}
      className={`
        ${paddingClass} ${heightClass}
        w-full text-left rounded border
        transition-colors
        ${today ? 'bg-primary/5 border-primary' : 'bg-card border-border'}
        ${!isCurrentMonth ? 'opacity-40' : ''}
        ${hasItems ? 'hover:bg-accent/30' : 'hover:bg-accent/20'}
        focus:outline-none focus:ring-1 focus:ring-primary
      `}
    >
      <div className="flex flex-col h-full">
        <div className={`text-sm font-medium mb-1 ${today ? 'text-primary' : 'text-foreground'}`}>
          {format(date, 'd', { locale: enUS })}
        </div>
        
        {hasItems && (
          <div className="flex flex-col gap-0.5 mt-auto">
            {categoryCounts.program > 0 && (
              <div
                className="h-1 rounded-full"
                style={{ backgroundColor: getCategoryColor('program'), opacity: 0.7 }}
              />
            )}
            {categoryCounts.agenda > 0 && (
              <div
                className="h-1 rounded-full"
                style={{ backgroundColor: getCategoryColor('agenda'), opacity: 0.7 }}
              />
            )}
            {categoryCounts.kpi > 0 && (
              <div
                className="h-1 rounded-full"
                style={{ backgroundColor: getCategoryColor('kpi'), opacity: 0.7 }}
              />
            )}
          </div>
        )}
      </div>
    </button>
  );
}
