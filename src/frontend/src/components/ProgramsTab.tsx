import { useState, useMemo } from 'react';
import { useGetAllPrograms, useDeleteProgram, useGetCallerUserProfile, useGetUniqueDivisions } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Pencil, Trash2, Loader2 } from 'lucide-react';
import { ProgramStatus, ProgramPriority } from '../backend';
import ProgramFormDialog from './ProgramFormDialog';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

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

  const getStatusBadge = (status: ProgramStatus) => {
    switch (status) {
      case ProgramStatus.planning:
        return <Badge variant="outline">Perencanaan</Badge>;
      case ProgramStatus.ongoing:
        return <Badge className="bg-chart-2 text-white">Berjalan</Badge>;
      case ProgramStatus.completed:
        return <Badge className="bg-chart-3 text-white">Selesai</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: ProgramPriority) => {
    switch (priority) {
      case ProgramPriority.high:
        return <Badge className="bg-destructive text-white">Tinggi</Badge>;
      case ProgramPriority.middle:
        return <Badge className="bg-yellow-500 text-white">Sedang</Badge>;
      case ProgramPriority.low:
        return <Badge className="bg-green-600 text-white">Rendah</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const handleEdit = (program: any) => {
    setEditingProgram(program);
    setIsFormOpen(true);
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

  return (
    <div className="space-y-4">
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
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari program..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={divisionFilter} onValueChange={setDivisionFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
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
              <SelectTrigger className="w-full sm:w-[180px]">
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
              <SelectTrigger className="w-full sm:w-[180px]">
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

          {/* Table */}
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || divisionFilter !== 'all' ? 'Tidak ada program yang sesuai filter' : 'Belum ada program'}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Program</TableHead>
                    <TableHead>Unit/Divisi</TableHead>
                    <TableHead>Penanggung Jawab</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Prioritas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    {canEdit && <TableHead className="text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrograms.map((program) => (
                    <TableRow key={program.id.toString()}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{program.name}</div>
                          <div className="text-xs text-muted-foreground">{program.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>{program.unit}</TableCell>
                      <TableCell>
                        <div>
                          <div>{program.personInCharge.name}</div>
                          <div className="text-xs text-muted-foreground">{program.personInCharge.role}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(new Date(Number(program.startDate)), 'dd MMM yyyy', { locale: idLocale })}</div>
                          <div className="text-muted-foreground">
                            s/d {format(new Date(Number(program.endDate)), 'dd MMM yyyy', { locale: idLocale })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(program.priority)}</TableCell>
                      <TableCell>{getStatusBadge(program.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full bg-chart-2"
                              style={{ width: `${program.progress}%` }}
                            />
                          </div>
                          <span className="text-sm">{program.progress}%</span>
                        </div>
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(program)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(program.id)}
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
    </div>
  );
}
