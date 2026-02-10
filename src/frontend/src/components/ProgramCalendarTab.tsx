import { useState, useMemo, useEffect } from 'react';
import { useGetProgramsActiveInRange, useGetUniqueDivisions, useGetAllTeamMembers } from '../hooks/useQueries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, X } from 'lucide-react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, addWeeks, format, isSameDay, isSameMonth } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { Program, ProgramStatus, ProgramPriority } from '../backend';
import ProgramCalendarViewSwitcher from './program-calendar/ProgramCalendarViewSwitcher';
import MonthGridView from './program-calendar/views/MonthGridView';
import WeekGridView from './program-calendar/views/WeekGridView';
import AgendaListView from './program-calendar/views/AgendaListView';
import DayDetailPanel from './program-calendar/DayDetailPanel';
import ProgramDetailDrawer from './program-calendar/ProgramDetailDrawer';
import ProgramFormDialog from './ProgramFormDialog';
import GridDensityControl from './program-calendar/GridDensityControl';
import { applyProgramFilters } from './program-calendar/programFilterUtils';
import { useMediaQuery } from '../hooks/useMediaQuery';

type ViewMode = 'month' | 'week' | 'agenda';
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
  }, [isMobile]);

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

  const { data: programs = [], isLoading, error } = useGetProgramsActiveInRange(visibleRange);
  const { data: divisions = [] } = useGetUniqueDivisions();
  const { data: teamMembers = [] } = useGetAllTeamMembers();

  // Get unique PICs and priorities from programs
  const uniquePICs = useMemo(() => {
    const pics = new Set(programs.map(p => p.personInCharge.name));
    return Array.from(pics).sort();
  }, [programs]);

  const uniquePriorities = useMemo(() => {
    return ['high', 'middle', 'low'];
  }, []);

  const uniqueStatuses = useMemo(() => {
    return ['planning', 'ongoing', 'completed'];
  }, []);

  // Apply filters
  const filteredPrograms = useMemo(() => {
    return applyProgramFilters(programs, filters);
  }, [programs, filters]);

  const handlePrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, -1));
    } else if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, -1));
    } else {
      setCurrentDate(addDays(currentDate, -7));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 7));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
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

  const hasActiveFilters = filters.division || filters.pic || filters.status || filters.priority;

  const getViewTitle = () => {
    if (viewMode === 'month') {
      return format(currentDate, 'MMMM yyyy', { locale: enUS });
    } else if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(start, 'MMM d', { locale: enUS })} - ${format(end, 'MMM d, yyyy', { locale: enUS })}`;
    } else {
      return format(currentDate, 'MMMM yyyy', { locale: enUS });
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Program Calendar
          </h2>
          <p className="text-base md:text-lg text-muted-foreground mt-2">
            Manage and track program schedules visually
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-soft">
        <CardContent className="pt-8 pb-8 px-6 md:px-8">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">Filter Programs</h3>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-9 text-sm"
                >
                  <X className="h-4 w-4 mr-1.5" />
                  Reset Filters
                </Button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2.5">
                <label className="text-sm font-medium text-muted-foreground">Unit/Division</label>
                <Select value={filters.division} onValueChange={(value) => setFilters({ ...filters, division: value })}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="All divisions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All divisions</SelectItem>
                    {divisions.map((div) => (
                      <SelectItem key={div} value={div}>
                        {div}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2.5">
                <label className="text-sm font-medium text-muted-foreground">Person in Charge</label>
                <Select value={filters.pic} onValueChange={(value) => setFilters({ ...filters, pic: value })}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="All PICs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All PICs</SelectItem>
                    {uniquePICs.map((pic) => (
                      <SelectItem key={pic} value={pic}>
                        {pic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2.5">
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2.5">
                <label className="text-sm font-medium text-muted-foreground">Priority</label>
                <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All priorities</SelectItem>
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

      {/* View Controls */}
      <Card className="shadow-soft">
        <CardContent className="pt-8 pb-8 px-6 md:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="default" onClick={handlePrevious} className="h-10 px-4">
                ←
              </Button>
              <Button variant="outline" size="default" onClick={handleToday} className="h-10 px-5">
                Today
              </Button>
              <Button variant="outline" size="default" onClick={handleNext} className="h-10 px-4">
                →
              </Button>
              <div className="ml-3 text-lg md:text-xl font-semibold">
                {getViewTitle()}
              </div>
            </div>
            <div className="flex items-center gap-4">
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
        </CardContent>
      </Card>

      {/* Calendar View */}
      <Card className="shadow-soft">
        <CardContent className="p-5 md:p-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-24">
              <p className="text-destructive text-lg">Error: {(error as Error).message}</p>
            </div>
          ) : (
            <>
              {viewMode === 'month' && (
                <MonthGridView
                  currentDate={currentDate}
                  programs={filteredPrograms}
                  onDayClick={handleDayClick}
                  onProgramClick={handleProgramClick}
                  gridDensity={gridDensity}
                />
              )}
              {viewMode === 'week' && (
                <WeekGridView
                  currentDate={currentDate}
                  programs={filteredPrograms}
                  onDayClick={handleDayClick}
                  onProgramClick={handleProgramClick}
                  gridDensity={gridDensity}
                />
              )}
              {viewMode === 'agenda' && (
                <AgendaListView
                  currentDate={currentDate}
                  programs={filteredPrograms}
                  onProgramClick={handleProgramClick}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Day Detail Panel */}
      <DayDetailPanel
        date={selectedDate}
        programs={filteredPrograms}
        onClose={() => setSelectedDate(null)}
        onProgramClick={handleProgramClick}
      />

      {/* Program Detail Drawer */}
      <ProgramDetailDrawer
        program={selectedProgram}
        onClose={() => setSelectedProgram(null)}
        onEdit={handleEditProgram}
      />

      {/* Edit Program Dialog */}
      <ProgramFormDialog
        open={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingProgram(null);
        }}
        program={editingProgram}
      />
    </div>
  );
}
