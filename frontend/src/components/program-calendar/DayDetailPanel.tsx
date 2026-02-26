import { useMemo } from 'react';
import { format, isSameDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { Program } from '../../backend';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { getStatusConfig, getPriorityConfig } from './statusPriorityStyles';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface DayDetailPanelProps {
  date: Date | null;
  programs: Program[];
  onClose: () => void;
  onProgramClick: (program: Program) => void;
}

export default function DayDetailPanel({
  date,
  programs,
  onClose,
  onProgramClick,
}: DayDetailPanelProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const dayPrograms = useMemo(() => {
    if (!date) return [];
    
    return programs.filter((program) => {
      try {
        const programStart = Number(program?.startDate);
        const programEnd = Number(program?.endDate);
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        return programEnd >= dayStart.getTime() && programStart <= dayEnd.getTime();
      } catch (error) {
        console.warn('Error filtering program in day detail:', error);
        return false;
      }
    });
  }, [date, programs]);

  if (!date) return null;

  return (
    <Sheet open={!!date} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side={isMobile ? 'bottom' : 'right'} className="w-full sm:max-w-md">
        <SheetHeader className="pb-3">
          <SheetTitle className="text-lg">
            {format(date, 'EEEE, MMMM d, yyyy', { locale: enUS })}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
          {dayPrograms.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No programs on this day</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dayPrograms.map((program) => {
                try {
                  const statusConfig = getStatusConfig(program.status);
                  const priorityConfig = getPriorityConfig(program.priority);

                  return (
                    <div
                      key={program.id}
                      onClick={() => {
                        onProgramClick(program);
                        onClose();
                      }}
                      className="p-3 rounded border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                    >
                      <h4 className="font-medium text-sm mb-2 line-clamp-1">{program.name || 'Untitled'}</h4>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <Badge variant={statusConfig.variant} className="text-xs">
                          {statusConfig.label}
                        </Badge>
                        <Badge className={`${priorityConfig.className} text-xs`}>
                          {priorityConfig.label}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p><span className="font-medium">Unit:</span> {program?.unit || 'Unknown'}</p>
                        <p><span className="font-medium">PIC:</span> {program?.personInCharge?.name || 'Unknown'}</p>
                        <p><span className="font-medium">Progress:</span> {Number(program?.progress || 0)}%</p>
                      </div>
                    </div>
                  );
                } catch (error) {
                  console.warn('Error rendering program in day detail:', error);
                  return null;
                }
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
