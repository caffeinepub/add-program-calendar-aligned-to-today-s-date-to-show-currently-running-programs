import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Calendar, Building2, User, Edit, Clock } from 'lucide-react';
import type { Program } from '../../backend';
import { getStatusConfig, getPriorityConfig } from './statusPriorityStyles';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface ProgramDetailDrawerProps {
  program: Program | null;
  onClose: () => void;
  onEdit: (program: Program) => void;
}

export default function ProgramDetailDrawer({
  program,
  onClose,
  onEdit,
}: ProgramDetailDrawerProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (!program) return null;

  const statusConfig = getStatusConfig(program.status);
  const priorityConfig = getPriorityConfig(program.priority);

  const formatDate = (timestamp: bigint) => {
    return format(new Date(Number(timestamp)), 'dd MMMM yyyy', { locale: idLocale });
  };

  return (
    <Sheet open={!!program} onOpenChange={onClose}>
      <SheetContent side={isMobile ? 'bottom' : 'right'} className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-xl">{program.name}</SheetTitle>
          <SheetDescription>Detail informasi program</SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)] mt-6 pr-4">
          <div className="space-y-6">
            {/* Status and Priority */}
            <div className="flex items-center gap-3">
              <Badge variant={statusConfig.variant} className="text-sm">
                {statusConfig.label}
              </Badge>
              <Badge className={priorityConfig.className}>
                {priorityConfig.label}
              </Badge>
            </div>

            {/* Description */}
            {program.description && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Deskripsi</h3>
                <p className="text-sm leading-relaxed">{program.description}</p>
              </div>
            )}

            <Separator />

            {/* Period */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Periode Program
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Mulai</p>
                  <p className="text-sm font-medium">{formatDate(program.startDate)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Selesai</p>
                  <p className="text-sm font-medium">{formatDate(program.endDate)}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Unit/Division */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Unit/Divisi
              </h3>
              <p className="text-sm font-medium">{program.unit}</p>
            </div>

            <Separator />

            {/* Person in Charge */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Penanggung Jawab
              </h3>
              <div className="space-y-1">
                <p className="text-sm font-medium">{program.personInCharge.name}</p>
                <p className="text-xs text-muted-foreground">
                  {program.personInCharge.role} • {program.personInCharge.division}
                </p>
              </div>
            </div>

            <Separator />

            {/* Progress */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Progress</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{Number(program.progress)}%</span>
                  <span className="text-xs text-muted-foreground">
                    {Number(program.progress) === 100 ? 'Selesai' : 'Dalam Progress'}
                  </span>
                </div>
                <Progress value={Number(program.progress)} className="h-3" />
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t">
          <Button
            onClick={() => onEdit(program)}
            className="w-full"
            size="lg"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Program
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
