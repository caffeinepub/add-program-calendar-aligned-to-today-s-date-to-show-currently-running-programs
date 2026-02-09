import { Button } from '@/components/ui/button';
import { Calendar, List, Columns3 } from 'lucide-react';

type ViewMode = 'month' | 'week' | 'agenda';

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
  return (
    <div className="flex items-center gap-1 rounded-lg border bg-background p-1">
      <Button
        variant={viewMode === 'month' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('month')}
        disabled={disabled}
        className="h-8 px-3"
      >
        <Calendar className="h-4 w-4 mr-1.5" />
        <span className="hidden sm:inline">Bulan</span>
      </Button>
      <Button
        variant={viewMode === 'week' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('week')}
        disabled={disabled}
        className="h-8 px-3"
      >
        <Columns3 className="h-4 w-4 mr-1.5" />
        <span className="hidden sm:inline">Minggu</span>
      </Button>
      <Button
        variant={viewMode === 'agenda' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('agenda')}
        className="h-8 px-3"
      >
        <List className="h-4 w-4 mr-1.5" />
        <span className="hidden sm:inline">Agenda</span>
      </Button>
    </div>
  );
}
