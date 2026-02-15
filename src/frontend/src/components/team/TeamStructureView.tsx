import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { TeamMember } from '../../backend';
import { buildHierarchy, detectHierarchyIssues } from '../../utils/teamHierarchy';
import { collectStructureMembers, groupByDivision, sortMembersByName } from '../../utils/teamFunctionalStructure';
import TeamMemberDetailsPanel from './TeamMemberDetailsPanel';
import TeamFunctionalMemberNode from './TeamFunctionalMemberNode';

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

  // Collect members in the main structure (excluding orphans)
  const structureMembers = collectStructureMembers(root);
  
  // Group by division (excluding the root/director)
  const rootMember = root?.member;
  const nonRootMembers = structureMembers.filter(m => m.id !== rootMember?.id);
  const divisionGroups = groupByDivision(nonRootMembers);

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
        {/* Functional Org Chart */}
        <div className="flex-1 overflow-x-auto">
          <div className="min-w-max p-6 bg-background rounded-lg border">
            {rootMember ? (
              <div className="flex flex-col items-center">
                {/* Root/Director Node */}
                <div className="flex justify-center mb-4">
                  <div className="w-40">
                    <TeamFunctionalMemberNode
                      member={rootMember}
                      onSelect={setSelectedMember}
                      isSelected={selectedMember?.id === rootMember.id}
                    />
                  </div>
                </div>

                {/* Connector Line */}
                {divisionGroups.length > 0 && (
                  <div className="w-px h-8 bg-border mb-4" />
                )}

                {/* Division Columns */}
                {divisionGroups.length > 0 && (
                  <div className="flex flex-wrap gap-6 justify-center">
                    {divisionGroups.map(group => (
                      <div key={group.division} className="flex flex-col items-center min-w-[140px] max-w-[180px]">
                        {/* Division Header */}
                        <div className="mb-3 text-center">
                          <h4 className="text-sm font-semibold text-foreground">
                            {group.division}
                          </h4>
                        </div>

                        {/* Division Members */}
                        <div className="flex flex-col gap-2 w-full">
                          {sortMembersByName(group.members).map(member => (
                            <TeamFunctionalMemberNode
                              key={member.id.toString()}
                              member={member}
                              onSelect={setSelectedMember}
                              isSelected={selectedMember?.id === member.id}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                <div className="flex flex-wrap gap-3">
                  {orphans.map(orphan => (
                    <div key={orphan.member.id.toString()} className="w-32">
                      <TeamFunctionalMemberNode
                        member={orphan.member}
                        onSelect={setSelectedMember}
                        isSelected={selectedMember?.id === orphan.member.id}
                      />
                    </div>
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
            allMembers={members}
            open={true}
            onClose={() => setSelectedMember(null)}
            onEdit={onEdit}
          />
        )}
      </div>
    </div>
  );
}
