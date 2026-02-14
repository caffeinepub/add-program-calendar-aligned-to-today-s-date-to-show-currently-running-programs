import { useState, useMemo, useEffect } from 'react';
import { useGetProgramsActiveInRange, useGetUniqueDivisions, useGetAllTeamMembers, useGetTeamAgendaItemsByRange, useGetKPIsWithDeadlinesInRange } from '../hooks/useQueries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, X, Bell, BellOff, AlertCircle, RefreshCw } from 'lucide-react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, addWeeks, format, startOfDay, endOfDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { Program, ProgramStatus, ProgramPriority } from '../backend';
import ProgramCalendarViewSwitcher from './program-calendar/ProgramCalendarViewSwitcher';
import MonthGridView from './program-calendar/views/MonthGridView';
import WeekGridView from './program-calendar/views/WeekGridView';
import AgendaListView from './program-calendar/views/AgendaListView';
import DayListView from './program-calendar/views/DayListView';
import DayDetailPanel from './program-calendar/DayDetailPanel';
import ProgramDetailDrawer from './program-calendar/ProgramDetailDrawer';
import ProgramFormDialog from './ProgramFormDialog';
import GridDensityControl from './program-calendar/GridDensityControl';
import CalendarCategoryLegend from './program-calendar/CalendarCategoryLegend';
import { applyProgramFilters } from './program-calendar/programFilterUtils';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useCalendarReminders } from '../hooks/useCalendarReminders';
import { safeGetJSON, safeSetJSON } from '../utils/safeBrowserStorage';
import CalendarTabErrorBoundary from './program-calendar/CalendarTabErrorBoundary';

type ViewMode = 'month' | 'week' | 'day' | 'agenda';
type GridDensity = 'comfortable' | 'compact';

interface FilterState {
  division: string;
  pic: string;
  status: string;
  priority: string;
}

export default function ProgramCalendarTab() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [viewMode, setViewMode] = useState<ViewMode>(isMobile ? 'agenda' : 'month');
  const [gridDensity, setGridDensity] = useState<GridDensity>('comfortable');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(() => {
    return safeGetJSON('calendarRemindersEnabled', true);
  });

  const [filters, setFilters] = useState<FilterState>({
    division: '',
    pic: '',
    status: '',
    priority: '',
  });

  // Update view mode when screen size changes
  useEffect(() => {
    if (isMobile && viewMode !== 'agenda') {
      setViewMode('agenda');
    }
  }, [isMobile, viewMode]);

  // Calculate visible range based on view mode
  const visibleRange = useMemo(() => {
    let start: Date;
    let end: Date;

    if (viewMode === 'month') {
      start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
      end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    } else if (viewMode === 'week') {
      start = startOfWeek(currentDate, { weekStartsOn: 0 });
      end = endOfWeek(currentDate, { weekStartsOn: 0 });
    } else if (viewMode === 'day') {
      start = startOfDay(currentDate);
      end = endOfDay(currentDate);
    } else {
      // Agenda: show 2 weeks forward
      start = new Date(currentDate);
      start.setHours(0, 0, 0, 0);
      end = addDays(start, 14);
    }

    return {
      start: BigInt(start.getTime()),
      end: BigInt(end.getTime()),
    };
  }, [currentDate, viewMode]);

  const { 
    data: programs = [], 
    isLoading: programsLoading, 
    error: programsError,
    refetch: refetchPrograms 
  } = useGetProgramsActiveInRange(visibleRange);
  
  const { 
    data: agendaItems = [], 
    isLoading: agendaLoading,
    error: agendaError,
    refetch: refetchAgenda 
  } = useGetTeamAgendaItemsByRange(visibleRange);
  
  const { 
    data: kpiDeadlines = [], 
    isLoading: kpisLoading,
    error: kpisError,
    refetch: refetchKpis 
  } = useGetKPIsWithDeadlinesInRange(visibleRange);
  
  const { data: divisions = [] } = useGetUniqueDivisions();
  const { data: teamMembers = [] } = useGetAllTeamMembers();

  const isLoading = programsLoading || agendaLoading || kpisLoading;
  const hasError = programsError || agendaError || kpisError;

  // Initialize reminders
  useCalendarReminders({
    programs,
    agendaItems,
    kpiDeadlines,
    enabled: remindersEnabled,
  });

  // Get unique PICs and priorities from programs with safe access
  const uniquePICs = useMemo(() => {
    const pics = new Set(
      programs
        .filter(p => p?.personInCharge?.name)
        .map(p => p.personInCharge.name)
    );
    return Array.from(pics).sort();
  }, [programs]);

  const uniquePriorities = useMemo(() => {
    return ['high', 'middle', 'low'];
  }, []);

  const uniqueStatuses = useMemo(() => {
    return ['planning', 'ongoing', 'completed'];
  }, []);

  // Sanitize divisions list: filter out empty/whitespace-only strings
  const sanitizedDivisions = useMemo(() => {
    return divisions
      .map(d => (d || '').trim())
      .filter(d => d.length > 0);
  }, [divisions]);

  // Sanitize PICs list: filter out empty/whitespace-only strings
  const sanitizedPICs = useMemo(() => {
    return uniquePICs
      .map(p => (p || '').trim())
      .filter(p => p.length > 0);
  }, [uniquePICs]);

  // Apply filters with safe access
  const filteredPrograms = useMemo(() => {
    return applyProgramFilters(programs, filters);
  }, [programs, filters]);

  // Check if there's any data in the visible range
  const hasData = filteredPrograms.length > 0 || agendaItems.length > 0 || kpiDeadlines.length > 0;

  const handlePrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, -1));
    } else if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, -1));
    } else if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, -1));
    } else {
      setCurrentDate(addDays(currentDate, -7));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 7));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (date: Date) => {
    if (viewMode === 'day') {
      setCurrentDate(date);
    } else {
      setSelectedDate(date);
    }
  };

  const handleProgramClick = (program: Program) => {
    setSelectedProgram(program);
  };

  const handleEditProgram = (program: Program) => {
    setEditingProgram(program);
    setIsEditDialogOpen(true);
    setSelectedProgram(null);
  };

  const handleResetFilters = () => {
    setFilters({
      division: '',
      pic: '',
      status: '',
      priority: '',
    });
  };

  const handleToggleReminders = (enabled: boolean) => {
    setRemindersEnabled(enabled);
    safeSetJSON('calendarRemindersEnabled', enabled);
    
    // Request notification permission if enabling and supported
    if (enabled && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'default') {
          Notification.requestPermission().catch(err => {
            console.warn('Notification permission request failed:', err);
          });
        }
      } catch (error) {
        console.warn('Notification API not supported:', error);
      }
    }
  };

  const handleRetry = () => {
    refetchPrograms();
    refetchAgenda();
    refetchKpis();
  };

  const hasActiveFilters = filters.division || filters.pic || filters.status || filters.priority;

  const getViewTitle = () => {
    if (viewMode === 'month') {
      return format(currentDate, 'MMMM yyyy', { locale: enUS });
    } else if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(start, 'MMM d', { locale: enUS })} - ${format(end, 'MMM d, yyyy', { locale: enUS })}`;
    } else if (viewMode === 'day') {
      return format(currentDate, 'EEEE, MMMM d, yyyy', { locale: enUS });
    } else {
      return format(currentDate, 'MMMM yyyy', { locale: enUS });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header - Always visible */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Program Calendar
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track program schedules visually
          </p>
        </div>
      </div>

      {/* Filters - Always visible */}
      <Card>
        <CardContent className="pt-4 pb-4 px-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Filter Programs</h3>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-8 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Unit/Division</label>
                <Select value={filters.division} onValueChange={(value) => setFilters({ ...filters, division: value })}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All divisions" />
                  </SelectTrigger>
                  <SelectContent>
                    {sanitizedDivisions.map((div) => (
                      <SelectItem key={div} value={div}>
                        {div}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Person in Charge</label>
                <Select value={filters.pic} onValueChange={(value) => setFilters({ ...filters, pic: value })}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All PICs" />
                  </SelectTrigger>
                  <SelectContent>
                    {sanitizedPICs.map((pic) => (
                      <SelectItem key={pic} value={pic}>
                        {pic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Priority</label>
                <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="middle">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Controls - Always visible */}
      <Card>
        <CardContent className="pt-4 pb-4 px-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePrevious} className="h-8 px-3">
                  ←
                </Button>
                <Button variant="outline" size="sm" onClick={handleToday} className="h-8 px-3">
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={handleNext} className="h-8 px-3">
                  →
                </Button>
                <div className="ml-2 text-base font-semibold">
                  {getViewTitle()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(viewMode === 'month' || viewMode === 'week') && (
                  <GridDensityControl
                    density={gridDensity}
                    onDensityChange={setGridDensity}
                  />
                )}
                <ProgramCalendarViewSwitcher
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  disabled={isMobile}
                />
              </div>
            </div>
            
            {/* Category Legend and Reminders */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3 border-t">
              <CalendarCategoryLegend />
              
              <div className="flex items-center gap-2">
                <Label htmlFor="reminders-toggle" className="text-xs font-medium cursor-pointer flex items-center gap-1.5">
                  {remindersEnabled ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
                  Reminders
                </Label>
                <Switch
                  id="reminders-toggle"
                  checked={remindersEnabled}
                  onCheckedChange={handleToggleReminders}
                />
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  (24h & 3h)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar View - Wrapped in error boundary */}
      <Card>
        <CardContent className="p-4">
          <CalendarTabErrorBoundary onReset={handleRetry}>
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : hasError ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <div className="text-center space-y-2">
                  <p className="text-lg font-semibold">Failed to load calendar data</p>
                  <p className="text-sm text-muted-foreground">
                    {(hasError as Error)?.message || 'An error occurred while fetching calendar data'}
                  </p>
                </div>
                <Button onClick={handleRetry} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : !hasData ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-2">
                <p className="text-lg font-semibold">No items scheduled</p>
                <p className="text-sm text-muted-foreground">
                  There are no programs, agenda items, or KPI deadlines in the visible range
                </p>
              </div>
            ) : (
              <>
                {viewMode === 'month' && (
                  <MonthGridView
                    currentDate={currentDate}
                    programs={filteredPrograms}
                    agendaItems={agendaItems}
                    kpiDeadlines={kpiDeadlines}
                    onDayClick={handleDayClick}
                    onProgramClick={handleProgramClick}
                    gridDensity={gridDensity}
                  />
                )}
                {viewMode === 'week' && (
                  <WeekGridView
                    currentDate={currentDate}
                    programs={filteredPrograms}
                    agendaItems={agendaItems}
                    kpiDeadlines={kpiDeadlines}
                    onDayClick={handleDayClick}
                    onProgramClick={handleProgramClick}
                    gridDensity={gridDensity}
                  />
                )}
                {viewMode === 'day' && (
                  <DayListView
                    currentDate={currentDate}
                    programs={filteredPrograms}
                    agendaItems={agendaItems}
                    kpiDeadlines={kpiDeadlines}
                    onProgramClick={handleProgramClick}
                  />
                )}
                {viewMode === 'agenda' && (
                  <AgendaListView
                    currentDate={currentDate}
                    programs={filteredPrograms}
                    agendaItems={agendaItems}
                    kpiDeadlines={kpiDeadlines}
                    onProgramClick={handleProgramClick}
                  />
                )}
              </>
            )}
          </CalendarTabErrorBoundary>
        </CardContent>
      </Card>

      {/* Day Detail Panel */}
      {selectedDate && (
        <DayDetailPanel
          date={selectedDate}
          programs={filteredPrograms}
          onClose={() => setSelectedDate(null)}
          onProgramClick={handleProgramClick}
        />
      )}

      {/* Program Detail Drawer */}
      <ProgramDetailDrawer
        program={selectedProgram}
        onClose={() => setSelectedProgram(null)}
        onEdit={handleEditProgram}
        canEdit={true}
      />

      {/* Edit Program Dialog */}
      {editingProgram && (
        <ProgramFormDialog
          open={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingProgram(null);
          }}
          program={editingProgram}
        />
      )}
    </div>
  );
}
