import { useState, useMemo } from 'react';
import { useGetProgramsActiveOnDate } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { Program } from '../backend';

export default function ProgramCalendarTab() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const { data: programs = [], isLoading, error } = useGetProgramsActiveOnDate(selectedDate);

  const handleTodayClick = () => {
    setSelectedDate(new Date());
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      planning: { label: 'Perencanaan', variant: 'secondary' as const },
      ongoing: { label: 'Berjalan', variant: 'default' as const },
      completed: { label: 'Selesai', variant: 'outline' as const },
    };
    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap = {
      high: { label: 'Tinggi', className: 'bg-red-500 hover:bg-red-600 text-white' },
      middle: { label: 'Sedang', className: 'bg-yellow-500 hover:bg-yellow-600 text-white' },
      low: { label: 'Rendah', className: 'bg-green-500 hover:bg-green-600 text-white' },
    };
    const config = priorityMap[priority as keyof typeof priorityMap] || { label: priority, className: '' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (timestamp: bigint) => {
    return format(new Date(Number(timestamp)), 'dd MMM yyyy', { locale: idLocale });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Program Calendar
          </h2>
          <p className="text-muted-foreground mt-1">
            View programs scheduled for specific dates
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        {/* Calendar Section */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
            <Button 
              onClick={handleTodayClick}
              variant="outline"
              className="w-full"
            >
              Today
            </Button>
            <div className="text-sm text-muted-foreground text-center pt-2 border-t">
              Selected: {format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: idLocale })}
            </div>
          </CardContent>
        </Card>

        {/* Programs List Section */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>
              Programs Active on {format(selectedDate, 'dd MMMM yyyy', { locale: idLocale })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-destructive">Error loading programs: {(error as Error).message}</p>
              </div>
            ) : programs.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-lg font-medium">
                  No programs scheduled for this date
                </p>
                <p className="text-muted-foreground text-sm mt-2">
                  Select a different date to view other programs
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Program Name</TableHead>
                      <TableHead>Unit/Division</TableHead>
                      <TableHead>PIC</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Progress</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programs.map((program) => (
                      <TableRow key={program.id.toString()}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{program.name}</div>
                            {program.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {program.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{program.unit}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{program.personInCharge.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {program.personInCharge.role}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatDate(program.startDate)}</div>
                            <div className="text-muted-foreground">to</div>
                            <div>{formatDate(program.endDate)}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getPriorityBadge(program.priority)}</TableCell>
                        <TableCell>{getStatusBadge(program.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="text-sm font-medium">{Number(program.progress)}%</div>
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                                style={{ width: `${Number(program.progress)}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
