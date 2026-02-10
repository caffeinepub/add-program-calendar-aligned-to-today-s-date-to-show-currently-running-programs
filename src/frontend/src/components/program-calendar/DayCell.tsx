import { Badge } from '@/components/ui/badge';
import { format, isToday } from 'date-fns';
import type { Program } from '../../backend';
import { cn } from '@/lib/utils';

type GridDensity = 'comfortable' | 'compact';

interface DayCellProps {
  date: Date;
  programs: Program[];
  isCurrentMonth: boolean;
  onClick: () => void;
  variant?: 'month' | 'week';
  gridDensity?: GridDensity;
}

export default function DayCell({
  date,
  programs,
  isCurrentMonth,
  onClick,
  variant = 'month',
  gridDensity = 'comfortable',
}: DayCellProps) {
  const today = isToday(date);
  const count = programs.length;

  const paddingClass = gridDensity === 'comfortable' 
    ? (variant === 'month' ? 'p-2.5 md:p-3' : 'p-4 md:p-5')
    : (variant === 'month' ? 'p-1.5 md:p-2' : 'p-3 md:p-4');

  const minHeightClass = gridDensity === 'comfortable'
    ? (variant === 'week' ? 'min-h-[120px]' : '')
    : (variant === 'week' ? 'min-h-[90px]' : '');

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative w-full rounded-xl border-2 transition-all hover:shadow-md hover:border-primary/40',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        variant === 'month' ? 'aspect-square' : minHeightClass,
        paddingClass,
        today && 'bg-primary/10 border-primary/60',
        !isCurrentMonth && variant === 'month' && 'opacity-40',
        count > 0 ? 'bg-background hover:bg-accent/40' : 'bg-muted/20'
      )}
    >
      <div className="flex flex-col h-full">
        <div className={cn(
          'text-base md:text-lg font-semibold',
          today ? 'text-primary' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
        )}>
          {format(date, 'd')}
        </div>
        
        {count > 0 && (
          <div className="mt-auto">
            <Badge
              variant={today ? 'default' : 'secondary'}
              className={cn(
                'text-xs px-2 py-0.5',
                variant === 'month' && 'text-[11px] md:text-xs'
              )}
            >
              {count}
            </Badge>
          </div>
        )}
      </div>
    </button>
  );
}
