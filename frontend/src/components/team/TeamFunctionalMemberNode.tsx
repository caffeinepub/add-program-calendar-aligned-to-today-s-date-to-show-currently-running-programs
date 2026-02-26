import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { TeamMemberWithAvatar } from '../../backend';
import { getTeamMemberAvatarSrc } from '../../utils/teamMemberAvatar';

interface TeamFunctionalMemberNodeProps {
  member: TeamMemberWithAvatar;
  onSelect: (member: TeamMemberWithAvatar) => void;
  isSelected: boolean;
}

export default function TeamFunctionalMemberNode({ 
  member, 
  onSelect, 
  isSelected 
}: TeamFunctionalMemberNodeProps) {
  const initials = member.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const avatarSrc = getTeamMemberAvatarSrc(member);

  return (
    <Button
      variant={isSelected ? "default" : "outline"}
      className="w-full flex items-center gap-2 h-auto py-2 px-3 justify-start hover:shadow-sm transition-shadow"
      onClick={() => onSelect(member)}
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        {avatarSrc ? (
          <AvatarImage src={avatarSrc} alt={member.name} />
        ) : (
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {initials}
          </AvatarFallback>
        )}
      </Avatar>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-xs font-medium truncate">{member.name}</p>
        <p className="text-[10px] text-muted-foreground truncate">{member.role}</p>
      </div>
    </Button>
  );
}
