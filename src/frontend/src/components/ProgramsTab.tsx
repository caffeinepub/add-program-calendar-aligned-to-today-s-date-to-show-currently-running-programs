import { useState, useMemo } from 'react';
import { useGetAllPrograms, useDeleteProgram, useGetCallerUserProfile, useGetUniqueDivisions } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Loader2 } from 'lucide-react';
import { ProgramStatus, ProgramPriority } from '../backend';
import ProgramFormDialog from './ProgramFormDialog';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import ProgramListItemCard from './programs/ProgramListItemCard';
import ProgramDetailDrawer from './program-calendar/ProgramDetailDrawer';

export default function ProgramsTab() {
  const { data: programs = [], isLoading } = useGetAllPrograms();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: divisions = [] } = useGetUniqueDivisions();
  const deleteProgram = useDeleteProgram();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<bigint | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);

  const canEdit = userProfile?.role === 'admin' || userProfile?.role === 'coordinator';

  const filteredPrograms = useMemo(() => {
    return programs.filter(program => {
      const matchesSearch = program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        program.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        program.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        program.personInCharge.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || program.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || program.priority === priorityFilter;
      const matchesDivision = divisionFilter === 'all' || program.unit === divisionFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesDivision;
    }).sort((a, b) => {
      // Sort by priority: high -> middle -> low
      const priorityOrder = { high: 0, middle: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by status: planning -> ongoing -> completed
      const statusOrder = { planning: 0, ongoing: 1, completed: 2 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      
      // Finally by start date
      return Number(a.startDate) - Number(b.startDate);
    });
  }, [programs, searchQuery, statusFilter, priorityFilter, divisionFilter]);

  const handleView = (program: any) => {
    setSelectedProgram(program);
  };

  const handleEdit = (program: any) => {
    setEditingProgram(program);
    setIsFormOpen(true);
    setSelectedProgram(null);
  };

  const handleDelete = (id: bigint) => {
    setProgramToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (programToDelete) {
      deleteProgram.mutate(programToDelete);
      setDeleteDialogOpen(false);
      setProgramToDelete(null);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingProgram(null);
  };

  const handleDetailDrawerClose = () => {
    setSelectedProgram(null);
  };

  return (
    <div className="space-y-4 overflow-x-hidden">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Manajemen Program</CardTitle>
            {canEdit && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Program
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari program..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select value={divisionFilter} onValueChange={setDivisionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter Divisi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Divisi</SelectItem>
                  {divisions.map((division) => (
                    <SelectItem key={division} value={division}>
                      {division}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value={ProgramStatus.planning}>Perencanaan</SelectItem>
                  <SelectItem value={ProgramStatus.ongoing}>Berjalan</SelectItem>
                  <SelectItem value={ProgramStatus.completed}>Selesai</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter Prioritas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Prioritas</SelectItem>
                  <SelectItem value={ProgramPriority.high}>Tinggi</SelectItem>
                  <SelectItem value={ProgramPriority.middle}>Sedang</SelectItem>
                  <SelectItem value={ProgramPriority.low}>Rendah</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Program List */}
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || divisionFilter !== 'all' ? 'Tidak ada program yang sesuai filter' : 'Belum ada program'}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredPrograms.map((program) => (
                <ProgramListItemCard
                  key={program.id.toString()}
                  program={program}
                  canEdit={canEdit}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ProgramFormDialog
        open={isFormOpen}
        onClose={handleFormClose}
        program={editingProgram}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Hapus Program"
        description="Apakah Anda yakin ingin menghapus program ini? Tindakan ini tidak dapat dibatalkan."
      />

      <ProgramDetailDrawer
        program={selectedProgram}
        onClose={handleDetailDrawerClose}
        onEdit={handleEdit}
        canEdit={canEdit}
      />
    </div>
  );
}
