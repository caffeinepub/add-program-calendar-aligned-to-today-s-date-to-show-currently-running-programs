import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { TeamMember } from '../../backend';
import { buildHierarchy, detectHierarchyIssues } from '../../utils/teamHierarchy';
import TeamMemberDetailsPanel from './TeamMemberDetailsPanel';
import TeamStructureNode from './TeamStructureNode';

interface TeamStructureViewProps {
  members: TeamMember[];
  onEdit?: (member: TeamMember) => void;
}

export default function TeamStructureView({ members, onEdit }: TeamStructureViewProps) {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const { root, orphans, warnings } = buildHierarchy(members);
  const issues = detectHierarchyIssues(members);

  if (members.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">No team members</h3>
        <p className="text-sm text-muted-foreground">
          Add team members to see the organizational structure
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Warnings */}
      {(warnings.length > 0 || issues.length > 0) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {warnings.map((warning, i) => (
                <p key={i}>{warning}</p>
              ))}
              {issues.map((issue, i) => (
                <p key={`issue-${i}`}>{issue}</p>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4">
        {/* Org Chart */}
        <div className="flex-1 overflow-x-auto">
          <div className="min-w-max p-6 bg-muted/30 rounded-lg">
            {root ? (
              <TeamStructureNode
                member={root.member}
                children={root.children}
                members={members}
                onSelect={setSelectedMember}
                selectedId={selectedMember?.id}
              />
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No director found. Please assign a team member with no manager.
              </div>
            )}

            {/* Orphans */}
            {orphans.length > 0 && (
              <div className="mt-8 pt-8 border-t">
                <h4 className="text-sm font-semibold text-muted-foreground mb-4">
                  Unassigned Members ({orphans.length})
                </h4>
                <div className="flex flex-wrap gap-4">
                  {orphans.map(orphan => (
                    <TeamStructureNode
                      key={orphan.member.id.toString()}
                      member={orphan.member}
                      children={orphan.children}
                      members={members}
                      onSelect={setSelectedMember}
                      selectedId={selectedMember?.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Details Panel */}
        {selectedMember && (
          <TeamMemberDetailsPanel
            member={selectedMember}
            members={members}
            onClose={() => setSelectedMember(null)}
            onEdit={onEdit}
          />
        )}
      </div>
    </div>
  );
}
