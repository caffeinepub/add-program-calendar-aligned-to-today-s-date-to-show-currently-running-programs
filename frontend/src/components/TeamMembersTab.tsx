import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Grid3x3, Network } from 'lucide-react';
import { useGetAllTeamMembers, useDeleteTeamMember } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import type { TeamMemberWithAvatar, UserRole } from '../backend';
import TeamMemberCard from './team/TeamMemberCard';
import TeamMemberFormDialog from './TeamMemberFormDialog';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import TeamStructureView from './team/TeamStructureView';

interface TeamMembersTabProps {
  userRole?: UserRole;
}

export default function TeamMembersTab({ userRole }: TeamMembersTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMemberWithAvatar | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMemberWithAvatar | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'structure'>('cards');

  const { data: teamMembers = [], isLoading } = useGetAllTeamMembers();
  const deleteMutation = useDeleteTeamMember();
  const { identity } = useInternetIdentity();

  const isAuthenticated = !!identity;
  const canEdit = userRole === 'admin' || userRole === 'coordinator';
  const canEditPhoto = canEdit && isAuthenticated;

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return teamMembers;
    const query = searchQuery.toLowerCase();
    return teamMembers.filter(
      (member) =>
        member.name.toLowerCase().includes(query) ||
        member.division.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query)
    );
  }, [teamMembers, searchQuery]);

  const handleAddMember = () => {
    setSelectedMember(null);
    setIsFormOpen(true);
  };

  const handleEditMember = (member: TeamMemberWithAvatar) => {
    setSelectedMember(member);
    setIsFormOpen(true);
  };

  const handleDeleteMember = (member: TeamMemberWithAvatar) => {
    setMemberToDelete(member);
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;
    try {
      await deleteMutation.mutateAsync(memberToDelete.id);
      setMemberToDelete(null);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading team members...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team Members</h2>
          <p className="text-sm text-muted-foreground">
            {teamMembers.length} {teamMembers.length === 1 ? 'member' : 'members'}
          </p>
        </div>
        {canEdit && (
          <Button onClick={handleAddMember}>
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        )}
      </div>

      {/* View Toggle */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'cards' | 'structure')}>
        <TabsList>
          <TabsTrigger value="cards">
            <Grid3x3 className="h-4 w-4 mr-2" />
            Cards View
          </TabsTrigger>
          <TabsTrigger value="structure">
            <Network className="h-4 w-4 mr-2" />
            Structure View
          </TabsTrigger>
        </TabsList>

        {/* Cards View */}
        <TabsContent value="cards" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, division, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Members Grid */}
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? 'No members found matching your search' : 'No team members yet'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMembers.map((member) => (
                <TeamMemberCard
                  key={member.id.toString()}
                  member={member}
                  onEdit={canEdit ? handleEditMember : undefined}
                  onDelete={canEdit ? handleDeleteMember : undefined}
                  canEditPhoto={canEditPhoto}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Structure View */}
        <TabsContent value="structure">
          <TeamStructureView
            members={teamMembers}
            onEdit={canEdit ? handleEditMember : undefined}
          />
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <TeamMemberFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        member={selectedMember}
        allMembers={teamMembers}
        isAuthenticated={isAuthenticated}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!memberToDelete}
        onClose={() => setMemberToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Team Member"
        description={`Are you sure you want to delete ${memberToDelete?.name}? This action cannot be undone.`}
      />
    </div>
  );
}
