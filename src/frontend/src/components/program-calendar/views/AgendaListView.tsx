import { useMemo } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { Program } from '../../../backend';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, User, Building2 } from 'lucide-react';
import { getStatusConfig, getPriorityConfig } from '../statusPriorityStyles';

interface AgendaListViewProps {
  currentDate: Date;
  programs: Program[];
  onProgramClick: (program: Program) => void;
}

export default function AgendaListView({
  currentDate,
  programs,
  onProgramClick,
}: AgendaListViewProps) {
  const agendaDays = useMemo(() => {
    const days: { date: Date; programs: Program[] }[] = [];
    
    for (let i = 0; i < 14; i++) {
      const date = addDays(currentDate, i);
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

      if (dayPrograms.length > 0) {
        days.push({ date, programs: dayPrograms });
      }
    }
    
    return days;
  }, [currentDate, programs]);

  if (agendaDays.length === 0) {
    return (
      <div className="text-center py-16">
        <Calendar className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
        <p className="text-lg font-medium text-muted-foreground">
          Tidak ada program dalam 2 minggu ke depan
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Coba ubah filter atau tambah program baru
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {agendaDays.map(({ date, programs: dayPrograms }) => (
        <div key={date.toISOString()} className="space-y-3">
          <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-2 border-b">
            <h3 className="text-base md:text-lg font-bold">
              {format(date, 'EEEE, d MMMM yyyy', { locale: idLocale })}
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              {dayPrograms.length} program
            </p>
          </div>

          <div className="space-y-2">
            {dayPrograms.map((program) => {
              const statusConfig = getStatusConfig(program.status);
              const priorityConfig = getPriorityConfig(program.priority);

              return (
                <Card
                  key={program.id.toString()}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onProgramClick(program)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base md:text-lg line-clamp-2">
                            {program.name}
                          </h4>
                          {program.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {program.description}
                            </p>
                          )}
                        </div>
                        <Badge className={priorityConfig.className}>
                          {priorityConfig.label}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-4 w-4" />
                          <span>{program.unit}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="h-4 w-4" />
                          <span>{program.personInCharge.name}</span>
                        </div>
                        <Badge variant={statusConfig.variant} className="text-xs">
                          {statusConfig.label}
                        </Badge>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs md:text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold">{Number(program.progress)}%</span>
                        </div>
                        <Progress value={Number(program.progress)} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
