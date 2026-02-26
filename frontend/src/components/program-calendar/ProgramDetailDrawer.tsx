import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { Program } from '../../backend';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { getStatusConfig, getPriorityConfig } from './statusPriorityStyles';
import { Edit } from 'lucide-react';

interface ProgramDetailDrawerProps {
  program: Program | null;
  onClose: () => void;
  onEdit?: (program: Program) => void;
  canEdit?: boolean;
}

export default function ProgramDetailDrawer({
  program,
  onClose,
  onEdit,
  canEdit = true,
}: ProgramDetailDrawerProps) {
  if (!program) return null;

  const statusConfig = getStatusConfig(program.status);
  const priorityConfig = getPriorityConfig(program.priority);

  const showEditButton = onEdit && canEdit;

  return (
    <Sheet open={!!program} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <SheetTitle className="text-lg flex-1">{program.name}</SheetTitle>
            {showEditButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(program)}
                className="h-8 px-3"
              >
                <Edit className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-7rem)]">
          <div className="space-y-4 pr-4">
            {/* Status and Priority */}
            <div className="flex flex-wrap gap-2">
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              <Badge className={priorityConfig.className}>{priorityConfig.label}</Badge>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Description</h4>
              <p className="text-sm">{program.description}</p>
            </div>

            <Separator />

            {/* Details */}
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Unit/Division</h4>
                <p className="text-sm">{program.unit}</p>
              </div>

              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Person in Charge</h4>
                <p className="text-sm">{program.personInCharge.name}</p>
                <p className="text-xs text-muted-foreground">
                  {program.personInCharge.role} • {program.personInCharge.division}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Timeline</h4>
                <p className="text-sm">
                  {format(new Date(Number(program.startDate)), 'MMM d, yyyy', { locale: enUS })}
                  {' → '}
                  {format(new Date(Number(program.endDate)), 'MMM d, yyyy', { locale: enUS })}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Progress (Calculated from KPIs)</h4>
                <div className="space-y-1.5">
                  <Progress value={Number(program.progress)} className="h-2" />
                  <p className="text-sm font-medium">{Number(program.progress)}%</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Progress dihitung otomatis dari bobot dan pencapaian KPI
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
