import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Calendar, Building2, User, Edit, Clock } from 'lucide-react';
import type { Program } from '../../backend';
import { getStatusConfig, getPriorityConfig } from './statusPriorityStyles';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface ProgramDetailDrawerProps {
  program: Program | null;
  onClose: () => void;
  onEdit: (program: Program) => void;
  canEdit?: boolean;
}

export default function ProgramDetailDrawer({
  program,
  onClose,
  onEdit,
  canEdit = true,
}: ProgramDetailDrawerProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [displayProgram, setDisplayProgram] = useState<Program | null>(program);

  // Keep the last non-null program for exit animation
  useEffect(() => {
    if (program) {
      setDisplayProgram(program);
    }
  }, [program]);

  if (!displayProgram) return null;

  const statusConfig = getStatusConfig(displayProgram.status);
  const priorityConfig = getPriorityConfig(displayProgram.priority);

  const formatDate = (timestamp: bigint) => {
    return format(new Date(Number(timestamp)), 'MMMM d, yyyy', { locale: enUS });
  };

  return (
    <Sheet open={!!program} onOpenChange={onClose}>
      <SheetContent 
        side={isMobile ? 'bottom' : 'right'} 
        className="w-full sm:max-w-lg flex flex-col overflow-hidden transition-transform duration-300 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out motion-reduce:transition-none motion-reduce:animate-none data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-right-1/2 data-[state=open]:slide-in-from-right-1/2 sm:data-[state=closed]:slide-out-to-right-full sm:data-[state=open]:slide-in-from-right-full data-[side=bottom]:data-[state=closed]:slide-out-to-bottom-full data-[side=bottom]:data-[state=open]:slide-in-from-bottom-full"
      >
        <SheetHeader className="shrink-0">
          <SheetTitle className="text-xl">{displayProgram.name}</SheetTitle>
          <SheetDescription className="text-base">Detailed program information</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 mt-6 pr-4">
          <div className="space-y-7 pb-6">
            {/* Status and Priority */}
            <div className="flex items-center gap-3">
              <Badge variant={statusConfig.variant} className="text-sm px-3 py-1">
                {statusConfig.label}
              </Badge>
              <Badge className={priorityConfig.className + ' px-3 py-1'}>
                {priorityConfig.label}
              </Badge>
            </div>

            {/* Description */}
            {displayProgram.description && (
              <div className="space-y-2.5">
                <h3 className="text-sm font-semibold text-muted-foreground">Description</h3>
                <p className="text-base leading-relaxed">{displayProgram.description}</p>
              </div>
            )}

            <Separator />

            {/* Period */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Program Period
              </h3>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="text-base font-medium">{formatDate(displayProgram.startDate)}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">End Date</p>
                  <p className="text-base font-medium">{formatDate(displayProgram.endDate)}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Unit/Division */}
            <div className="space-y-2.5">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Unit/Division
              </h3>
              <p className="text-base font-medium">{displayProgram.unit}</p>
            </div>

            <Separator />

            {/* Person in Charge */}
            <div className="space-y-2.5">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Person in Charge
              </h3>
              <div className="space-y-1.5">
                <p className="text-base font-medium">{displayProgram.personInCharge.name}</p>
                <p className="text-sm text-muted-foreground">
                  {displayProgram.personInCharge.role} • {displayProgram.personInCharge.division}
                </p>
              </div>
            </div>

            <Separator />

            {/* Progress */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Progress</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{Number(displayProgram.progress)}%</span>
                  <span className="text-sm text-muted-foreground">
                    {Number(displayProgram.progress) === 100 ? 'Complete' : 'In Progress'}
                  </span>
                </div>
                <Progress value={Number(displayProgram.progress)} className="h-3" />
              </div>
            </div>
          </div>
        </ScrollArea>

        {canEdit && (
          <div className="shrink-0 pt-4 pb-2 border-t">
            <Button
              onClick={() => onEdit(displayProgram)}
              className="w-full"
              size="lg"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Program
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
