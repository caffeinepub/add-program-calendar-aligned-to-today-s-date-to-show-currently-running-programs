import { Badge } from '@/components/ui/badge';
import { format, isToday } from 'date-fns';
import type { Program } from '../../backend';
import { cn } from '@/lib/utils';

interface DayCellProps {
  date: Date;
  programs: Program[];
  isCurrentMonth: boolean;
  onClick: () => void;
  variant?: 'month' | 'week';
}

export default function DayCell({
  date,
  programs,
  isCurrentMonth,
  onClick,
  variant = 'month',
}: DayCellProps) {
  const today = isToday(date);
  const count = programs.length;

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative w-full rounded-lg border transition-all hover:shadow-md hover:border-primary/50',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        variant === 'month' ? 'aspect-square p-1.5 md:p-2' : 'min-h-[100px] p-3',
        today && 'bg-primary/5 border-primary',
        !isCurrentMonth && variant === 'month' && 'opacity-40',
        count > 0 ? 'bg-background hover:bg-accent/50' : 'bg-muted/30'
      )}
    >
      <div className="flex flex-col h-full">
        <div className={cn(
          'text-sm md:text-base font-semibold',
          today ? 'text-primary' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
        )}>
          {format(date, 'd')}
        </div>
        
        {count > 0 && (
          <div className="mt-auto">
            <Badge
              variant={today ? 'default' : 'secondary'}
              className={cn(
                'text-xs px-1.5 py-0.5',
                variant === 'month' && 'text-[10px] md:text-xs'
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
