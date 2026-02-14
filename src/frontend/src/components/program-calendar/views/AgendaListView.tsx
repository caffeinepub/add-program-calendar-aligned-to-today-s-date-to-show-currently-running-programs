import { useMemo } from 'react';
import { format, isSameDay, startOfDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { Program, TeamAgendaItem, Kpi } from '../../../backend';
import { Badge } from '@/components/ui/badge';
import { getStatusConfig, getPriorityConfig } from '../statusPriorityStyles';
import { Calendar, Users, Target } from 'lucide-react';

interface AgendaListViewProps {
  currentDate: Date;
  programs: Program[];
  agendaItems: TeamAgendaItem[];
  kpiDeadlines: Kpi[];
  onProgramClick: (program: Program) => void;
}

interface AgendaDay {
  date: Date;
  programs: Program[];
  agendaItems: TeamAgendaItem[];
  kpiDeadlines: Kpi[];
}

export default function AgendaListView({
  currentDate,
  programs,
  agendaItems,
  kpiDeadlines,
  onProgramClick,
}: AgendaListViewProps) {
  const agendaDays = useMemo(() => {
    const days: AgendaDay[] = [];
    const startDate = startOfDay(currentDate);
    
    // Group items by day for next 14 days
    for (let i = 0; i < 14; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const dayPrograms = programs.filter((p) => {
        try {
          const programStart = Number(p?.startDate);
          const programEnd = Number(p?.endDate);
          const dayStart = new Date(date);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(date);
          dayEnd.setHours(23, 59, 59, 999);
          
          return programEnd >= dayStart.getTime() && programStart <= dayEnd.getTime();
        } catch (error) {
          console.warn('Error filtering program in agenda:', error);
          return false;
        }
      });
      
      const dayAgenda = agendaItems.filter((item) => {
        try {
          return isSameDay(new Date(Number(item?.startTime)), date);
        } catch (error) {
          console.warn('Error filtering agenda item:', error);
          return false;
        }
      });
      
      const dayKpis = kpiDeadlines.filter((kpi) => {
        try {
          return kpi?.deadline && isSameDay(new Date(Number(kpi.deadline)), date);
        } catch (error) {
          console.warn('Error filtering KPI:', error);
          return false;
        }
      });
      
      if (dayPrograms.length > 0 || dayAgenda.length > 0 || dayKpis.length > 0) {
        days.push({
          date,
          programs: dayPrograms,
          agendaItems: dayAgenda,
          kpiDeadlines: dayKpis,
        });
      }
    }
    
    return days;
  }, [currentDate, programs, agendaItems, kpiDeadlines]);

  if (agendaDays.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">No items scheduled in the next 14 days</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {agendaDays.map((day) => (
        <div key={day.date.toISOString()} className="space-y-2">
          <div className="flex items-center gap-2 pb-2 border-b">
            <div className="text-sm font-semibold">
              {format(day.date, 'EEEE, MMMM d', { locale: enUS })}
            </div>
            <div className="text-xs text-muted-foreground">
              {day.programs.length + day.agendaItems.length + day.kpiDeadlines.length} items
            </div>
          </div>

          <div className="space-y-2">
            {/* Programs */}
            {day.programs.map((program) => {
              try {
                const statusConfig = getStatusConfig(program.status);
                const priorityConfig = getPriorityConfig(program.priority);
                
                return (
                  <div
                    key={`program-${program.id}`}
                    onClick={() => onProgramClick(program)}
                    className="flex items-start gap-2 p-2 rounded border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                  >
                    <div className="w-1 h-full bg-[var(--calendar-program)] rounded-full flex-shrink-0 mt-1" />
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm line-clamp-1">{program.name || 'Untitled'}</h4>
                        <div className="flex gap-1 flex-shrink-0">
                          <Badge variant={statusConfig.variant} className="text-xs">
                            {statusConfig.label}
                          </Badge>
                          <Badge className={`${priorityConfig.className} text-xs`}>
                            {priorityConfig.label}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                        <span>Unit: {program?.unit || 'Unknown'}</span>
                        <span>PIC: {program?.personInCharge?.name || 'Unknown'}</span>
                        <span>Progress: {Number(program?.progress || 0)}%</span>
                      </div>
                    </div>
                  </div>
                );
              } catch (error) {
                console.warn('Error rendering program in agenda:', error);
                return null;
              }
            })}

            {/* Agenda Items */}
            {day.agendaItems.map((item) => {
              try {
                return (
                  <div
                    key={`agenda-${item.id}`}
                    className="flex items-start gap-2 p-2 rounded border bg-card"
                  >
                    <div className="w-1 h-full bg-[var(--calendar-agenda)] rounded-full flex-shrink-0 mt-1" />
                    <Users className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="font-medium text-sm line-clamp-1">{item?.title || 'Untitled'}</h4>
                      <div className="text-xs text-muted-foreground">
                        {item?.description || 'No description'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(Number(item?.startTime || 0)), 'h:mm a', { locale: enUS })} - 
                        {format(new Date(Number(item?.endTime || 0)), 'h:mm a', { locale: enUS })}
                      </div>
                    </div>
                  </div>
                );
              } catch (error) {
                console.warn('Error rendering agenda item:', error);
                return null;
              }
            })}

            {/* KPI Deadlines */}
            {day.kpiDeadlines.map((kpi) => {
              try {
                return (
                  <div
                    key={`kpi-${kpi.id}`}
                    className="flex items-start gap-2 p-2 rounded border bg-card"
                  >
                    <div className="w-1 h-full bg-[var(--calendar-kpi)] rounded-full flex-shrink-0 mt-1" />
                    <Target className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="font-medium text-sm line-clamp-1">{kpi?.name || 'Untitled'}</h4>
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                        <span>Team: {kpi?.team?.name || 'Unknown'}</span>
                        <span>Target: {Number(kpi?.targetValue || 0)}</span>
                        <span>Current: {Number(kpi?.realizationValue || 0)}</span>
                      </div>
                    </div>
                  </div>
                );
              } catch (error) {
                console.warn('Error rendering KPI in agenda:', error);
                return null;
              }
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
