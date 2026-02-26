import { Button } from '@/components/ui/button';
import { Calendar, CalendarDays, CalendarRange, List } from 'lucide-react';

type ViewMode = 'month' | 'week' | 'day' | 'agenda';

interface ProgramCalendarViewSwitcherProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  disabled?: boolean;
}

export default function ProgramCalendarViewSwitcher({
  viewMode,
  onViewModeChange,
  disabled = false,
}: ProgramCalendarViewSwitcherProps) {
  const views: Array<{ mode: ViewMode; label: string; icon: React.ReactNode }> = [
    { mode: 'month', label: 'Month', icon: <Calendar className="h-3.5 w-3.5" /> },
    { mode: 'week', label: 'Week', icon: <CalendarRange className="h-3.5 w-3.5" /> },
    { mode: 'day', label: 'Day', icon: <CalendarDays className="h-3.5 w-3.5" /> },
    { mode: 'agenda', label: 'Agenda', icon: <List className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="inline-flex items-center gap-0.5 rounded border bg-background p-0.5">
      {views.map((view) => (
        <Button
          key={view.mode}
          variant={viewMode === view.mode ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange(view.mode)}
          disabled={disabled && view.mode !== 'agenda'}
          className="h-7 px-2 gap-1"
        >
          {view.icon}
          <span className="hidden sm:inline text-xs">{view.label}</span>
        </Button>
      ))}
    </div>
  );
}
