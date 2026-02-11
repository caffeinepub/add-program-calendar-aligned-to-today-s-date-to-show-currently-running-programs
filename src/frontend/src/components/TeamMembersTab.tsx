import { useState, useMemo } from 'react';
import { useGetAllTeamMembers, useDeleteTeamMember, useGetCallerUserProfile } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Pencil, Trash2, Users, Loader2 } from 'lucide-react';
import TeamMemberFormDialog from './TeamMemberFormDialog';
import DeleteConfirmDialog from './DeleteConfirmDialog';
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

  const isReadOnly = userProfile?.role === 'viewer';

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
              <CardTitle>Manajemen Tim</CardTitle>
            </div>
            {!isReadOnly && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Anggota Tim
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama, divisi, atau peran..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={divisionFilter} onValueChange={setDivisionFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter Divisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Divisi</SelectItem>
                {divisions.map(division => (
                  <SelectItem key={division} value={division}>
                    {division}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Team Members Table */}
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <Users className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">Tidak ada anggota tim</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {searchQuery || divisionFilter !== 'all'
                  ? 'Tidak ada anggota tim yang sesuai dengan filter'
                  : 'Mulai dengan menambahkan anggota tim pertama'}
              </p>
              {!isReadOnly && !searchQuery && divisionFilter === 'all' && (
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Anggota Tim
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Divisi</TableHead>
                    <TableHead>Peran</TableHead>
                    {!isReadOnly && <TableHead className="text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id.toString()}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{member.division}</Badge>
                      </TableCell>
                      <TableCell>{member.role}</TableCell>
                      {!isReadOnly && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(member)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingMember(member)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Summary */}
          {!isLoading && filteredMembers.length > 0 && (
            <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">
                Menampilkan {filteredMembers.length} dari {teamMembers.length} anggota tim
              </span>
              {divisions.length > 0 && (
                <span className="text-muted-foreground">
                  {divisions.length} divisi
                </span>
              )}
            </div>
          )}
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
        title="Hapus Anggota Tim"
        description={`Apakah Anda yakin ingin menghapus ${deletingMember?.name}? Tindakan ini tidak dapat dibatalkan.`}
      />
    </div>
  );
}
