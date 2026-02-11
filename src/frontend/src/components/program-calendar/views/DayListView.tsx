import { useMemo } from 'react';
import { format, isSameDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { Program, TeamAgendaItem, Kpi } from '../../../backend';
import { Badge } from '@/components/ui/badge';
import { getStatusConfig, getPriorityConfig } from '../statusPriorityStyles';
import { getCategoryColor } from '../calendarCategoryUtils';
import { Calendar, Users, Target } from 'lucide-react';

interface DayListViewProps {
  currentDate: Date;
  programs: Program[];
  agendaItems: TeamAgendaItem[];
  kpiDeadlines: Kpi[];
  onProgramClick: (program: Program) => void;
}

export default function DayListView({
  currentDate,
  programs,
  agendaItems,
  kpiDeadlines,
  onProgramClick,
}: DayListViewProps) {
  const dayItems = useMemo(() => {
    const items: Array<{
      type: 'program' | 'agenda' | 'kpi';
      time: number;
      data: Program | TeamAgendaItem | Kpi;
    }> = [];

    // Add programs active on this day
    programs.forEach((program) => {
      const programStart = Number(program.startDate);
      const programEnd = Number(program.endDate);
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      if (programEnd >= dayStart.getTime() && programStart <= dayEnd.getTime()) {
        items.push({ type: 'program', time: programStart, data: program });
      }
    });

    // Add agenda items on this day
    agendaItems.forEach((item) => {
      const itemStart = Number(item.startTime);
      const itemEnd = Number(item.endTime);
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      if (itemEnd >= dayStart.getTime() && itemStart <= dayEnd.getTime()) {
        items.push({ type: 'agenda', time: itemStart, data: item });
      }
    });

    // Add KPI deadlines on this day
    kpiDeadlines.forEach((kpi) => {
      if (kpi.deadline) {
        const deadlineDate = new Date(Number(kpi.deadline));
        if (isSameDay(deadlineDate, currentDate)) {
          items.push({ type: 'kpi', time: Number(kpi.deadline), data: kpi });
        }
      }
    });

    // Sort by time
    items.sort((a, b) => a.time - b.time);

    return items;
  }, [currentDate, programs, agendaItems, kpiDeadlines]);

  if (dayItems.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">No items scheduled for this day</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-center pb-3 border-b">
        <h3 className="text-xl font-bold">{format(currentDate, 'EEEE', { locale: enUS })}</h3>
        <p className="text-sm text-muted-foreground">{format(currentDate, 'MMMM d, yyyy', { locale: enUS })}</p>
      </div>

      <div className="space-y-2">
        {dayItems.map((item, index) => {
          if (item.type === 'program') {
            const program = item.data as Program;
            const statusConfig = getStatusConfig(program.status);
            const priorityConfig = getPriorityConfig(program.priority);

            return (
              <div
                key={`program-${program.id}-${index}`}
                onClick={() => onProgramClick(program)}
                className="p-3 rounded border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className="w-1 h-full rounded-full mt-0.5"
                    style={{ backgroundColor: getCategoryColor('program'), minHeight: '3rem' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Calendar className="h-3.5 w-3.5 shrink-0" style={{ color: getCategoryColor('program') }} />
                      <h4 className="font-medium text-sm truncate">{program.name}</h4>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <Badge variant={statusConfig.variant} className="text-xs h-5">
                        {statusConfig.label}
                      </Badge>
                      <Badge className={`${priorityConfig.className} text-xs h-5`}>
                        {priorityConfig.label}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>{program.unit} • {program.personInCharge.name} • {Number(program.progress)}%</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          if (item.type === 'agenda') {
            const agenda = item.data as TeamAgendaItem;
            const startTime = format(new Date(Number(agenda.startTime)), 'h:mm a', { locale: enUS });
            const endTime = format(new Date(Number(agenda.endTime)), 'h:mm a', { locale: enUS });

            return (
              <div
                key={`agenda-${agenda.id}-${index}`}
                className="p-3 rounded border bg-card"
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className="w-1 h-full rounded-full mt-0.5"
                    style={{ backgroundColor: getCategoryColor('agenda'), minHeight: '3rem' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Users className="h-3.5 w-3.5 shrink-0" style={{ color: getCategoryColor('agenda') }} />
                      <h4 className="font-medium text-sm">{agenda.title}</h4>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>{startTime} - {endTime}</p>
                      {agenda.description && <p className="line-clamp-2">{agenda.description}</p>}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          if (item.type === 'kpi') {
            const kpi = item.data as Kpi;

            return (
              <div
                key={`kpi-${kpi.id}-${index}`}
                className="p-3 rounded border bg-card"
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className="w-1 h-full rounded-full mt-0.5"
                    style={{ backgroundColor: getCategoryColor('kpi'), minHeight: '3rem' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Target className="h-3.5 w-3.5 shrink-0" style={{ color: getCategoryColor('kpi') }} />
                      <h4 className="font-medium text-sm">{kpi.name}</h4>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>{kpi.team.name} • Target: {Number(kpi.targetValue)} • Current: {Number(kpi.realizationValue)}</p>
                      <Badge variant="destructive" className="text-xs h-5 mt-1">Deadline Today</Badge>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
