import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Calendar, User, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { Program } from '../../backend';
import { ProgramStatus, ProgramPriority } from '../../backend';

interface ProgramListItemCardProps {
  program: Program;
  canEdit: boolean;
  onView: (program: Program) => void;
  onEdit: (program: Program) => void;
  onDelete: (id: bigint) => void;
}

export default function ProgramListItemCard({
  program,
  canEdit,
  onView,
  onEdit,
  onDelete,
}: ProgramListItemCardProps) {
  const getStatusBadge = (status: ProgramStatus) => {
    // Use green colors for all statuses in light mode
    switch (status) {
      case ProgramStatus.planning:
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 text-xs">Perencanaan</Badge>;
      case ProgramStatus.ongoing:
        return <Badge className="bg-green-600 text-white dark:bg-green-700 dark:text-white text-xs">Berjalan</Badge>;
      case ProgramStatus.completed:
        return <Badge className="bg-teal-600 text-white dark:bg-teal-700 dark:text-white text-xs">Selesai</Badge>;
      default:
        return <Badge className="text-xs">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: ProgramPriority) => {
    // Use green and blue colors for priorities in light mode
    switch (priority) {
      case ProgramPriority.high:
        return <Badge className="bg-emerald-600 text-white dark:bg-emerald-700 dark:text-white text-xs">Tinggi</Badge>;
      case ProgramPriority.middle:
        return <Badge className="bg-teal-600 text-white dark:bg-teal-700 dark:text-white text-xs">Sedang</Badge>;
      case ProgramPriority.low:
        return <Badge className="bg-blue-600 text-white dark:bg-blue-700 dark:text-white text-xs">Rendah</Badge>;
      default:
        return <Badge className="text-xs">{priority}</Badge>;
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onView(program);
  };

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={handleCardClick}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="space-y-3">
          {/* Header: Title and Badges */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base sm:text-lg line-clamp-2 mb-2">
                {program.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {program.description}
              </p>
            </div>
            {canEdit && (
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(program);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(program.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )}
          </div>

          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-2">
            {getPriorityBadge(program.priority)}
            {getStatusBadge(program.status)}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Division */}
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Unit/Divisi</p>
                <p className="text-sm font-medium truncate">{program.unit}</p>
              </div>
            </div>

            {/* Person in Charge */}
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Penanggung Jawab</p>
                <p className="text-sm font-medium truncate">{program.personInCharge.name}</p>
                <p className="text-xs text-muted-foreground truncate">{program.personInCharge.role}</p>
              </div>
            </div>

            {/* Date Range */}
            <div className="flex items-start gap-2 sm:col-span-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Periode</p>
                <p className="text-sm">
                  {format(new Date(Number(program.startDate)), 'dd MMM yyyy', { locale: idLocale })}
                  {' '}-{' '}
                  {format(new Date(Number(program.endDate)), 'dd MMM yyyy', { locale: idLocale })}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar - Green color only */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">Progress (dari KPI)</span>
              <span className="text-sm font-semibold">{Number(program.progress)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-green-600 dark:bg-green-500 transition-all"
                style={{ width: `${Number(program.progress)}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
