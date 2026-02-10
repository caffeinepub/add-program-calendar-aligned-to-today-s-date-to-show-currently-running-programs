import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Calendar, Building2, User } from 'lucide-react';
import type { Program } from '../../backend';
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

  if (!date) return null;

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const dayPrograms = programs.filter((p) => {
    return (
      Number(p.endDate) >= dayStart.getTime() &&
      Number(p.startDate) <= dayEnd.getTime()
    );
  });

  return (
    <Sheet open={!!date} onOpenChange={onClose}>
      <SheetContent side={isMobile ? 'bottom' : 'right'} className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2.5 text-xl">
            <Calendar className="h-5 w-5" />
            {format(date, 'EEEE, MMMM d, yyyy', { locale: enUS })}
          </SheetTitle>
          <SheetDescription className="text-base">
            {dayPrograms.length} {dayPrograms.length === 1 ? 'program' : 'programs'} active on this date
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)] mt-8 pr-4">
          {dayPrograms.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground/30 mb-5" />
              <p className="text-base text-muted-foreground">
                No programs on this date
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {dayPrograms.map((program) => {
                const statusConfig = getStatusConfig(program.status);
                const priorityConfig = getPriorityConfig(program.priority);

                return (
                  <Card
                    key={program.id.toString()}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      onProgramClick(program);
                      onClose();
                    }}
                  >
                    <CardContent className="p-5">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <h4 className="font-semibold text-lg line-clamp-2 flex-1">
                            {program.name}
                          </h4>
                          <Badge className={priorityConfig.className}>
                            {priorityConfig.label}
                          </Badge>
                        </div>

                        {program.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {program.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span>{program.unit}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{program.personInCharge.name}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Badge variant={statusConfig.variant}>
                            {statusConfig.label}
                          </Badge>
                          <span className="text-sm font-semibold">
                            {Number(program.progress)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
