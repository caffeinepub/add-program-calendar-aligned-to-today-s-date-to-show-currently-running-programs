import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import type { TeamMemberWithAvatar } from '../../backend';
import type { HierarchyNode } from '../../utils/teamHierarchy';
import { getTeamMemberAvatarSrc } from '../../utils/teamMemberAvatar';

interface TeamStructureNodeProps {
  member: TeamMemberWithAvatar;
  children: HierarchyNode[];
  members: TeamMemberWithAvatar[];
  onSelect: (member: TeamMemberWithAvatar) => void;
  selectedId?: bigint;
}

export default function TeamStructureNode({ 
  member, 
  children, 
  onSelect, 
  selectedId 
}: TeamStructureNodeProps) {
  const initials = member.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isSelected = selectedId !== undefined && selectedId === member.id;

  // Get avatar src using utility
  const avatarSrc = getTeamMemberAvatarSrc(member);

  return (
    <div className="flex flex-col items-center">
      {/* Member Node */}
      <Button
        variant={isSelected ? "default" : "outline"}
        className="flex flex-col items-center gap-2 h-auto py-3 px-4 min-w-[140px] hover:shadow-md transition-shadow"
        onClick={() => onSelect(member)}
      >
        <Avatar className="h-12 w-12 rounded-lg">
          {avatarSrc ? (
            <AvatarImage src={avatarSrc} alt={member.name} className="rounded-lg" />
          ) : (
            <AvatarFallback className="bg-primary/10 text-primary rounded-lg">
              {initials || <User className="h-5 w-5" />}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="text-center space-y-1">
          <p className="text-xs font-medium leading-tight">{member.name}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">{member.role}</p>
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
            {member.division}
          </Badge>
        </div>
      </Button>

      {/* Children */}
      {children.length > 0 && (
        <div className="flex flex-col items-center mt-4">
          {/* Vertical connector */}
          <div className="w-px h-6 bg-border" />
          
          {/* Horizontal line for multiple children */}
          {children.length > 1 && (
            <div className="relative w-full">
              <div className="absolute top-0 left-0 right-0 h-px bg-border" style={{ width: `${(children.length - 1) * 160 + 140}px`, left: '50%', transform: 'translateX(-50%)' }} />
            </div>
          )}

          {/* Child nodes */}
          <div className="flex gap-5 mt-6">
            {children.map((child) => (
              <div key={child.member.id.toString()} className="relative">
                {/* Vertical connector to child */}
                {children.length > 1 && (
                  <div className="absolute -top-6 left-1/2 w-px h-6 bg-border -translate-x-1/2" />
                )}
                <TeamStructureNode
                  member={child.member}
                  children={child.children}
                  members={[]}
                  onSelect={onSelect}
                  selectedId={selectedId}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
