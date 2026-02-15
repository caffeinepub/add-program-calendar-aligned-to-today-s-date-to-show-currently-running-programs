import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Pencil, User, Users } from 'lucide-react';
import type { TeamMember } from '../../backend';

interface TeamMemberDetailsPanelProps {
  member: TeamMember | null;
  allMembers: TeamMember[];
  open: boolean;
  onClose: () => void;
  onEdit?: (member: TeamMember) => void;
}

export default function TeamMemberDetailsPanel({ 
  member, 
  allMembers, 
  open, 
  onClose,
  onEdit 
}: TeamMemberDetailsPanelProps) {
  if (!member) return null;

  const manager = member.managerId 
    ? allMembers.find(m => m.id === member.managerId)
    : null;

  const directReports = allMembers.filter(m => m.managerId === member.id);

  const initials = member.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Validate avatar URL before using
  const hasValidAvatar = member.avatar && member.avatar.startsWith('https://');

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Team Member Details</SheetTitle>
          <SheetDescription>View complete information about this team member</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Avatar and Basic Info */}
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 flex-shrink-0">
              {hasValidAvatar ? (
                <AvatarImage src={member.avatar} alt={member.name} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {initials || <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold">{member.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{member.role}</p>
              <Badge variant="secondary" className="mt-2">
                {member.division}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Manager Info */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Reports To
            </h3>
            {manager ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                <Avatar className="h-10 w-10">
                  {manager.avatar && manager.avatar.startsWith('https://') ? (
                    <AvatarImage src={manager.avatar} alt={manager.name} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {manager.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{manager.name}</p>
                  <p className="text-xs text-muted-foreground">{manager.role}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No manager (Director level)</p>
            )}
          </div>

          {/* Direct Reports */}
          {directReports.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Direct Reports ({directReports.length})
                </h3>
                <div className="space-y-2">
                  {directReports.map(report => {
                    const hasValidReportAvatar = report.avatar && report.avatar.startsWith('https://');
                    return (
                      <div key={report.id.toString()} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                        <Avatar className="h-10 w-10">
                          {hasValidReportAvatar ? (
                            <AvatarImage src={report.avatar} alt={report.name} />
                          ) : null}
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {report.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{report.name}</p>
                          <p className="text-xs text-muted-foreground">{report.role}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Edit Button */}
          {onEdit && (
            <>
              <Separator />
              <Button 
                onClick={() => {
                  onEdit(member);
                  onClose();
                }}
                className="w-full"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Member
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
