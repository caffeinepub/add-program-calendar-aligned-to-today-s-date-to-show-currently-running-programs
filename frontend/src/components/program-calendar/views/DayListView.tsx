import { useMemo } from 'react';
import { format, isSameDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { Program, TeamAgendaItem, Kpi } from '../../../backend';
import { Badge } from '@/components/ui/badge';
import { getStatusConfig, getPriorityConfig } from '../statusPriorityStyles';
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
  const dayPrograms = useMemo(() => {
    return programs.filter((p) => {
      try {
        const programStart = Number(p?.startDate);
        const programEnd = Number(p?.endDate);
        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);
        
        return programEnd >= dayStart.getTime() && programStart <= dayEnd.getTime();
      } catch (error) {
        console.warn('Error filtering program in day view:', error);
        return false;
      }
    });
  }, [currentDate, programs]);

  const dayAgenda = useMemo(() => {
    return agendaItems.filter((item) => {
      try {
        return isSameDay(new Date(Number(item?.startTime)), currentDate);
      } catch (error) {
        console.warn('Error filtering agenda item in day view:', error);
        return false;
      }
    });
  }, [currentDate, agendaItems]);

  const dayKpis = useMemo(() => {
    return kpiDeadlines.filter((kpi) => {
      try {
        return kpi?.deadline && isSameDay(new Date(Number(kpi.deadline)), currentDate);
      } catch (error) {
        console.warn('Error filtering KPI in day view:', error);
        return false;
      }
    });
  }, [currentDate, kpiDeadlines]);

  const hasItems = dayPrograms.length > 0 || dayAgenda.length > 0 || dayKpis.length > 0;

  if (!hasItems) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">No items scheduled for this day</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Programs */}
      {dayPrograms.map((program) => {
        try {
          const statusConfig = getStatusConfig(program.status);
          const priorityConfig = getPriorityConfig(program.priority);
          
          return (
            <div
              key={`program-${program.id}`}
              onClick={() => onProgramClick(program)}
              className="flex items-start gap-2 p-3 rounded border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
            >
              <div className="w-1 h-full bg-[var(--calendar-program)] rounded-full flex-shrink-0 mt-1" />
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 space-y-1.5">
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
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {program?.description || 'No description'}
                </p>
                <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                  <span>Unit: {program?.unit || 'Unknown'}</span>
                  <span>PIC: {program?.personInCharge?.name || 'Unknown'}</span>
                  <span>Division: {program?.personInCharge?.division || 'Unknown'}</span>
                  <span>Progress: {Number(program?.progress || 0)}%</span>
                </div>
              </div>
            </div>
          );
        } catch (error) {
          console.warn('Error rendering program in day view:', error);
          return null;
        }
      })}

      {/* Agenda Items */}
      {dayAgenda.map((item) => {
        try {
          return (
            <div
              key={`agenda-${item.id}`}
              className="flex items-start gap-2 p-3 rounded border bg-card"
            >
              <div className="w-1 h-full bg-[var(--calendar-agenda)] rounded-full flex-shrink-0 mt-1" />
              <Users className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <h4 className="font-medium text-sm line-clamp-1">{item?.title || 'Untitled'}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {item?.description || 'No description'}
                </p>
                <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                  <span>
                    {format(new Date(Number(item?.startTime || 0)), 'h:mm a', { locale: enUS })} - 
                    {format(new Date(Number(item?.endTime || 0)), 'h:mm a', { locale: enUS })}
                  </span>
                  {item?.attendees && item.attendees.length > 0 && (
                    <span>Attendees: {item.attendees.length}</span>
                  )}
                </div>
              </div>
            </div>
          );
        } catch (error) {
          console.warn('Error rendering agenda item in day view:', error);
          return null;
        }
      })}

      {/* KPI Deadlines */}
      {dayKpis.map((kpi) => {
        try {
          return (
            <div
              key={`kpi-${kpi.id}`}
              className="flex items-start gap-2 p-3 rounded border bg-card"
            >
              <div className="w-1 h-full bg-[var(--calendar-kpi)] rounded-full flex-shrink-0 mt-1" />
              <Target className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <h4 className="font-medium text-sm line-clamp-1">{kpi?.name || 'Untitled'}</h4>
                <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                  <span>Team: {kpi?.team?.name || 'Unknown'}</span>
                  <span>Division: {kpi?.team?.division || 'Unknown'}</span>
                  <span>Target: {Number(kpi?.targetValue || 0)}</span>
                  <span>Current: {Number(kpi?.realizationValue || 0)}</span>
                  <span>Progress: {Math.round((Number(kpi?.realizationValue || 0) / Number(kpi?.targetValue || 1)) * 100)}%</span>
                </div>
              </div>
            </div>
          );
        } catch (error) {
          console.warn('Error rendering KPI in day view:', error);
          return null;
        }
      })}
    </div>
  );
}
