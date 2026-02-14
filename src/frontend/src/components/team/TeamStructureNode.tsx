import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { TeamMember } from '../../backend';
import type { HierarchyNode } from '../../utils/teamHierarchy';

interface TeamStructureNodeProps {
  member: TeamMember;
  children: HierarchyNode[];
  members: TeamMember[];
  onSelect: (member: TeamMember) => void;
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

  return (
    <div className="flex flex-col items-center">
      {/* Member Node */}
      <Button
        variant={isSelected ? "default" : "outline"}
        className="flex flex-col items-center gap-2 h-auto p-4 min-w-[160px] hover:shadow-md transition-all"
        onClick={() => onSelect(member)}
      >
        <Avatar className="h-12 w-12 border-2 border-background">
          <AvatarImage src={member.avatar} alt={member.name} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <p className="font-semibold text-sm">{member.name}</p>
          <p className="text-xs text-muted-foreground">{member.role}</p>
          <Badge variant="secondary" className="mt-1 text-xs">
            {member.division}
          </Badge>
        </div>
      </Button>

      {/* Children */}
      {children.length > 0 && (
        <div className="flex flex-col items-center mt-4">
          <div className="h-8 w-px bg-border" />
          <div className="flex gap-8">
            {children.map((child) => (
              <div key={child.member.id.toString()} className="relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-8 w-px bg-border" />
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
