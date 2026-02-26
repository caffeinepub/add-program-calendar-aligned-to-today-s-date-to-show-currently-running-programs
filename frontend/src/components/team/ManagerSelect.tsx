import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TeamMemberWithAvatar } from '../../backend';

interface ManagerSelectProps {
  value: bigint | undefined;
  onChange: (value: bigint | undefined) => void;
  members: TeamMemberWithAvatar[];
  currentMemberId?: bigint;
}

export default function ManagerSelect({ value, onChange, members, currentMemberId }: ManagerSelectProps) {
  // Filter out the current member from the list
  const availableManagers = members.filter(m => 
    currentMemberId === undefined || m.id !== currentMemberId
  );

  const handleValueChange = (stringValue: string) => {
    if (stringValue === 'none') {
      onChange(undefined);
    } else {
      onChange(BigInt(stringValue));
    }
  };

  const selectedValue = value === undefined ? 'none' : value.toString();

  return (
    <Select value={selectedValue} onValueChange={handleValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select manager" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No manager (Director)</SelectItem>
        {availableManagers.map(member => (
          <SelectItem key={member.id.toString()} value={member.id.toString()}>
            {member.name} - {member.role}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
