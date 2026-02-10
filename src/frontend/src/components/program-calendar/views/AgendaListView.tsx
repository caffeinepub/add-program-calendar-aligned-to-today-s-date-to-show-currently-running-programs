import { useMemo } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { Program } from '../../../backend';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
      <div className="text-center py-20">
        <Calendar className="h-20 w-20 mx-auto text-muted-foreground/30 mb-6" />
        <p className="text-xl font-medium text-muted-foreground">
          No programs in the next 2 weeks
        </p>
        <p className="text-base text-muted-foreground mt-3">
          Try adjusting your filters or add new programs
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {agendaDays.map(({ date, programs: dayPrograms }) => (
        <div key={date.toISOString()} className="space-y-4">
          <div className="pb-3 border-b">
            <h3 className="text-lg md:text-xl font-bold">
              {format(date, 'EEEE, MMMM d, yyyy', { locale: enUS })}
            </h3>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              {dayPrograms.length} {dayPrograms.length === 1 ? 'program' : 'programs'}
            </p>
          </div>

          <div className="space-y-3">
            {dayPrograms.map((program) => {
              const statusConfig = getStatusConfig(program.status);
              const priorityConfig = getPriorityConfig(program.priority);

              return (
                <Card
                  key={program.id.toString()}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onProgramClick(program)}
                >
                  <CardContent className="p-5 md:p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="font-semibold text-lg md:text-xl flex-1">
                          {program.name}
                        </h4>
                        <Badge className={priorityConfig.className}>
                          {priorityConfig.label}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm md:text-base text-muted-foreground">
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
                        <span className="text-base font-semibold">
                          {Number(program.progress)}% complete
                        </span>
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
