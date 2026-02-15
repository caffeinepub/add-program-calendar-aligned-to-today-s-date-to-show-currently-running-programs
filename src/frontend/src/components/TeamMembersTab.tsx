import { useState, useMemo } from 'react';
import { useGetAllTeamMembers, useDeleteTeamMember, useGetCallerUserProfile } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Users, Loader2, LayoutGrid, Network } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TeamMemberFormDialog from './TeamMemberFormDialog';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import TeamMemberCard from './team/TeamMemberCard';
import TeamStructureView from './team/TeamStructureView';
import type { TeamMember } from '../backend';

export default function TeamMembersTab() {
  const { data: teamMembers = [], isLoading } = useGetAllTeamMembers();
  const { data: userProfile } = useGetCallerUserProfile();
  const deleteMutation = useDeleteTeamMember();

  const [searchQuery, setSearchQuery] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'structure'>('cards');

  const isReadOnly = userProfile?.role === 'viewer';
  const canEdit = !isReadOnly;

  // Get unique divisions for filter
  const divisions = useMemo(() => {
    const uniqueDivisions = Array.from(new Set(teamMembers.map(m => m.division)));
    return uniqueDivisions.sort();
  }, [teamMembers]);

  // Filter team members
  const filteredMembers = useMemo(() => {
    return teamMembers.filter(member => {
      const matchesSearch = 
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.division.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.role.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDivision = divisionFilter === 'all' || member.division === divisionFilter;

      return matchesSearch && matchesDivision;
    });
  }, [teamMembers, searchQuery, divisionFilter]);

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingMember) return;
    await deleteMutation.mutateAsync(deletingMember.id);
    setDeletingMember(null);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingMember(null);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Team Management</CardTitle>
            </div>
            {canEdit && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Team Member
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* View Mode Toggle */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'cards' | 'structure')}>
            <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
              <TabsTrigger value="cards" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                Cards
              </TabsTrigger>
              <TabsTrigger value="structure" className="flex items-center gap-2">
                <Network className="h-4 w-4" />
                Structure View
              </TabsTrigger>
            </TabsList>

            {/* Search and Filter - only show in cards view */}
            {viewMode === 'cards' && (
              <div className="flex flex-col gap-3 sm:flex-row mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search name, division, or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={divisionFilter} onValueChange={setDivisionFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter Division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Divisions</SelectItem>
                    {divisions.map(division => (
                      <SelectItem key={division} value={division}>
                        {division}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Cards View */}
            <TabsContent value="cards" className="mt-4">
              {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center text-center">
                  <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">No team members</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {searchQuery || divisionFilter !== 'all'
                      ? 'No team members match the current filters'
                      : 'Start by adding your first team member'}
                  </p>
                  {canEdit && !searchQuery && divisionFilter === 'all' && (
                    <Button onClick={() => setIsFormOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Team Member
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredMembers.map((member) => (
                      <TeamMemberCard
                        key={member.id.toString()}
                        member={member}
                        onEdit={canEdit ? handleEdit : undefined}
                        onDelete={canEdit ? setDeletingMember : undefined}
                        canEditPhoto={canEdit}
                      />
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3 text-sm mt-4">
                    <span className="text-muted-foreground">
                      Showing {filteredMembers.length} of {teamMembers.length} team members
                    </span>
                    {divisions.length > 0 && (
                      <span className="text-muted-foreground">
                        {divisions.length} divisions
                      </span>
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Structure View */}
            <TabsContent value="structure" className="mt-4">
              {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <TeamStructureView
                  members={teamMembers}
                  onEdit={canEdit ? handleEdit : undefined}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <TeamMemberFormDialog
        open={isFormOpen}
        onClose={handleFormClose}
        member={editingMember}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deletingMember}
        onClose={() => setDeletingMember(null)}
        onConfirm={handleDelete}
        title="Delete Team Member"
        description={`Are you sure you want to delete ${deletingMember?.name}? This action cannot be undone.`}
      />
    </div>
  );
}
