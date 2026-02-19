import { useState, useMemo } from 'react';
import { useGetAllKPIs, useGetAllPrograms, useDeleteKpi, useGetCallerUserProfile, useGetUniquePICNames } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Search, Pencil, Trash2, Loader2 } from 'lucide-react';
import { KpiStatus, KpiPeriod } from '../backend';
import KpiFormDialog from './KpiFormDialog';
import DeleteConfirmDialog from './DeleteConfirmDialog';

export default function KPIsTab() {
  const { data: kpis = [], isLoading } = useGetAllKPIs();
  const { data: programs = [] } = useGetAllPrograms();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: picNames = [] } = useGetUniquePICNames();
  const deleteKpi = useDeleteKpi();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [kpiToDelete, setKpiToDelete] = useState<bigint | null>(null);

  const canEdit = userProfile?.role === 'admin' || userProfile?.role === 'coordinator';

  const filteredKpis = useMemo(() => {
    return kpis.filter(kpi => {
      const matchesSearch = kpi.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kpi.team.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || kpi.status === statusFilter;
      const matchesPeriod = periodFilter === 'all' || kpi.period === periodFilter;
      const matchesTeam = teamFilter === 'all' || kpi.team.name === teamFilter;

      return matchesSearch && matchesStatus && matchesPeriod && matchesTeam;
    });
  }, [kpis, searchQuery, statusFilter, periodFilter, teamFilter]);

  const getStatusBadge = (status: KpiStatus) => {
    switch (status) {
      case KpiStatus.notAchieved:
        return <Badge variant="destructive">Belum Tercapai</Badge>;
      case KpiStatus.inProgress:
        return <Badge className="bg-chart-4 text-white">Dalam Progress</Badge>;
      case KpiStatus.achieved:
        return <Badge className="bg-chart-2 text-white">Tercapai</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPeriodLabel = (period: KpiPeriod) => {
    switch (period) {
      case KpiPeriod.monthly: return 'Bulanan';
      case KpiPeriod.quarterly: return 'Triwulan';
      case KpiPeriod.annual: return 'Tahunan';
      default: return period;
    }
  };

  const getProgramName = (programId: bigint) => {
    const program = programs.find(p => p.id === programId);
    return program?.name || 'Program tidak ditemukan';
  };

  const calculateKpiProgress = (targetValue: bigint, realizationValue: bigint): number => {
    const target = Number(targetValue);
    const realization = Number(realizationValue);
    if (target === 0) return 0;
    return Math.min(Math.round((realization / target) * 100), 100);
  };

  const handleEdit = (kpi: any) => {
    setEditingKpi(kpi);
    setIsFormOpen(true);
  };

  const handleDelete = (id: bigint) => {
    setKpiToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (kpiToDelete) {
      deleteKpi.mutate(kpiToDelete);
      setDeleteDialogOpen(false);
      setKpiToDelete(null);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingKpi(null);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Manajemen KPI Tim</CardTitle>
            {canEdit && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah KPI
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
                placeholder="Cari KPI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter Tim/PIC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tim/PIC</SelectItem>
                {picNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
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
                <SelectItem value={KpiStatus.notAchieved}>Belum Tercapai</SelectItem>
                <SelectItem value={KpiStatus.inProgress}>Dalam Progress</SelectItem>
                <SelectItem value={KpiStatus.achieved}>Tercapai</SelectItem>
              </SelectContent>
            </Select>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Periode</SelectItem>
                <SelectItem value={KpiPeriod.monthly}>Bulanan</SelectItem>
                <SelectItem value={KpiPeriod.quarterly}>Triwulan</SelectItem>
                <SelectItem value={KpiPeriod.annual}>Tahunan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredKpis.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              {searchQuery || statusFilter !== 'all' || periodFilter !== 'all' || teamFilter !== 'all' ? 'Tidak ada KPI yang sesuai filter' : 'Belum ada KPI'}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama KPI</TableHead>
                    <TableHead>Program Terkait</TableHead>
                    <TableHead>Tim/PIC</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Realisasi</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Status</TableHead>
                    {canEdit && <TableHead className="text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKpis.map((kpi) => {
                    const progress = calculateKpiProgress(kpi.targetValue, kpi.realizationValue);
                    return (
                      <TableRow key={kpi.id.toString()}>
                        <TableCell className="font-medium">{kpi.name}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {getProgramName(kpi.relatedProgramId)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{kpi.team.name}</div>
                            <div className="text-xs text-muted-foreground">{kpi.team.division}</div>
                          </div>
                        </TableCell>
                        <TableCell>{Number(kpi.targetValue).toLocaleString('id-ID')}</TableCell>
                        <TableCell>{Number(kpi.realizationValue).toLocaleString('id-ID')}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <Progress value={progress} className="h-2 w-16" />
                            <span className="text-sm font-medium">{progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{getPeriodLabel(kpi.period)}</TableCell>
                        <TableCell>{getStatusBadge(kpi.status)}</TableCell>
                        {canEdit && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(kpi)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(kpi.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <KpiFormDialog
        open={isFormOpen}
        onClose={handleFormClose}
        kpi={editingKpi}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Hapus KPI"
        description="Apakah Anda yakin ingin menghapus KPI ini? Tindakan ini tidak dapat dibatalkan."
      />
    </div>
  );
}
