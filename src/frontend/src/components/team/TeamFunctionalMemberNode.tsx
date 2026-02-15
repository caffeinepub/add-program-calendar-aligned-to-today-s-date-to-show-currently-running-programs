import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { TeamMember } from '../../backend';
import { isValidUrl } from '../../utils/urlValidation';

interface TeamFunctionalMemberNodeProps {
  member: TeamMember;
  onSelect: (member: TeamMember) => void;
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

  const hasValidAvatar = member.avatar && isValidUrl(member.avatar);

  return (
    <Button
      variant={isSelected ? "default" : "outline"}
      className="flex flex-col items-center gap-2 h-auto p-3 w-full hover:shadow-sm transition-all"
      onClick={() => onSelect(member)}
    >
      <Avatar className="h-10 w-10 border border-background">
        {hasValidAvatar && <AvatarImage src={member.avatar} alt={member.name} />}
        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="text-center w-full">
        <p className="font-medium text-xs truncate">{member.name}</p>
        <p className="text-[10px] text-muted-foreground truncate">{member.role}</p>
      </div>
    </Button>
  );
}
