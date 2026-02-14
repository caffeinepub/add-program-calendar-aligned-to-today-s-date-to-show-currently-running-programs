import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Pencil, Users, User } from 'lucide-react';
import type { TeamMember } from '../../backend';

interface TeamMemberDetailsPanelProps {
  member: TeamMember;
  members: TeamMember[];
  onClose: () => void;
  onEdit?: (member: TeamMember) => void;
}

export default function TeamMemberDetailsPanel({ 
  member, 
  members, 
  onClose, 
  onEdit 
}: TeamMemberDetailsPanelProps) {
  const initials = member.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Find manager
  const manager = member.managerId 
    ? members.find(m => m.id === member.managerId)
    : null;

  // Find direct reports
  const directReports = members.filter(m => m.managerId === member.id);

  return (
    <Card className="w-80 flex-shrink-0 sticky top-4">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Member Details</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Avatar and Name */}
        <div className="flex flex-col items-center text-center space-y-3">
          <Avatar className="h-20 w-20 border-2 border-primary/10">
            <AvatarImage src={member.avatar} alt={member.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-lg">{member.name}</h3>
            <p className="text-sm text-muted-foreground">{member.role}</p>
            <Badge variant="outline" className="mt-2">
              {member.division}
            </Badge>
          </div>
        </div>

        {/* Manager */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <User className="h-4 w-4" />
            Reports To
          </div>
          {manager ? (
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
              <Avatar className="h-8 w-8">
                <AvatarImage src={manager.avatar} alt={manager.name} />
                <AvatarFallback className="text-xs">
                  {manager.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{manager.name}</p>
                <p className="text-xs text-muted-foreground truncate">{manager.role}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Director (No manager)</p>
          )}
        </div>

        {/* Direct Reports */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4" />
            Direct Reports ({directReports.length})
          </div>
          {directReports.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {directReports.map(report => (
                <div 
                  key={report.id.toString()} 
                  className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={report.avatar} alt={report.name} />
                    <AvatarFallback className="text-xs">
                      {report.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{report.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{report.role}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No direct reports</p>
          )}
        </div>

        {/* Edit Button */}
        {onEdit && (
          <Button onClick={() => onEdit(member)} className="w-full">
            <Pencil className="h-4 w-4 mr-2" />
            Edit Member
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
