import React, { useState } from 'react';
import { useGetAllKPIs, useDeleteKpi, useGetAllPrograms, useGetCallerUserProfile, useIsCallerAdmin } from '../hooks/useQueries';
import { KpiStatus, KpiPeriod } from '../backend';
import type { Kpi } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Loader2, Target } from 'lucide-react';
import KpiFormDialog from './KpiFormDialog';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { toast } from 'sonner';

export default function KPIsTab() {
  const { data: kpis, isLoading: kpisLoading } = useGetAllKPIs();
  const { data: programs } = useGetAllPrograms();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();
  const deleteKpi = useDeleteKpi();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState<Kpi | null>(null);
  const [deletingKpi, setDeletingKpi] = useState<Kpi | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<bigint | null>(null);

  const isCoordinator = userProfile?.role === 'coordinator';

  // Admin can edit/delete any KPI; coordinator can only edit KPIs assigned to their team
  const canEditKpi = (kpi: Kpi): boolean => {
    if (isAdmin) return true;
    if (isCoordinator && userProfile) {
      return kpi.team.name === userProfile.name;
    }
    return false;
  };

  const filteredKpis = (kpis ?? []).filter((kpi) => {
    const matchesSearch =
      kpi.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kpi.team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kpi.team.division.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || getStatusKey(kpi.status) === statusFilter;
    const matchesPeriod = periodFilter === 'all' || getPeriodKey(kpi.period) === periodFilter;

    return matchesSearch && matchesStatus && matchesPeriod;
  });

  function getStatusKey(status: KpiStatus): string {
    if (status === KpiStatus.achieved) return 'achieved';
    if (status === KpiStatus.inProgress) return 'inProgress';
    if (status === KpiStatus.notAchieved) return 'notAchieved';
    return String(status);
  }

  function getPeriodKey(period: KpiPeriod): string {
    if (period === KpiPeriod.monthly) return 'monthly';
    if (period === KpiPeriod.quarterly) return 'quarterly';
    if (period === KpiPeriod.annual) return 'annual';
    return String(period);
  }

  const getStatusBadge = (status: KpiStatus) => {
    const key = getStatusKey(status);
    switch (key) {
      case 'achieved':
        return (
          <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">
            Tercapai
          </Badge>
        );
      case 'inProgress':
        return (
          <Badge className="bg-green-600/20 text-green-700 dark:text-green-300 border-green-600/30">
            Dalam Proses
          </Badge>
        );
      case 'notAchieved':
        return (
          <Badge className="bg-green-800/20 text-green-800 dark:text-green-200 border-green-800/30">
            Belum Tercapai
          </Badge>
        );
      default:
        return <Badge variant="outline">{key}</Badge>;
    }
  };

  const getPeriodLabel = (period: KpiPeriod): string => {
    const key = getPeriodKey(period);
    switch (key) {
      case 'monthly':
        return 'Bulanan';
      case 'quarterly':
        return 'Triwulan';
      case 'annual':
        return 'Tahunan';
      default:
        return key;
    }
  };

  const formatDate = (timestamp: bigint): string => {
    if (!timestamp || timestamp === BigInt(0)) return '-';
    try {
      const ms = Number(timestamp);
      const date = new Date(ms);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  const getProgramName = (programId: bigint): string => {
    const program = (programs ?? []).find((p) => p.id === programId);
    return program?.name ?? `Program #${programId}`;
  };

  const getProgress = (kpi: Kpi): number => {
    if (kpi.targetValue === BigInt(0)) return 0;
    return Math.min(
      100,
      Math.round((Number(kpi.realizationValue) / Number(kpi.targetValue)) * 100)
    );
  };

  const handleEdit = (kpi: Kpi) => {
    setEditingKpi(kpi);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingKpi) return;
    setIsDeletingId(deletingKpi.id);
    try {
      await deleteKpi.mutateAsync(deletingKpi.id);
      toast.success('KPI berhasil dihapus');
      setDeletingKpi(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error('Gagal menghapus KPI: ' + message);
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingKpi(null);
  };

  if (kpisLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Manajemen KPI</h2>
          <p className="text-sm text-muted-foreground">
            {filteredKpis.length} dari {kpis?.length ?? 0} KPI ditampilkan
          </p>
        </div>
        {(isAdmin || isCoordinator) && (
          <Button
            onClick={() => {
              setEditingKpi(null);
              setIsFormOpen(true);
            }}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white border-0 gap-2"
          >
            <Plus className="h-4 w-4" />
            Tambah KPI
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari KPI, tim, atau divisi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-border"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40 border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="achieved">Tercapai</SelectItem>
            <SelectItem value="inProgress">Dalam Proses</SelectItem>
            <SelectItem value="notAchieved">Belum Tercapai</SelectItem>
          </SelectContent>
        </Select>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-full sm:w-40 border-border">
            <SelectValue placeholder="Periode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Periode</SelectItem>
            <SelectItem value="monthly">Bulanan</SelectItem>
            <SelectItem value="quarterly">Triwulan</SelectItem>
            <SelectItem value="annual">Tahunan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold min-w-[180px]">Nama KPI</TableHead>
                <TableHead className="font-semibold min-w-[140px]">Program</TableHead>
                <TableHead className="font-semibold min-w-[140px]">Tim/PIC</TableHead>
                <TableHead className="font-semibold text-center">Target</TableHead>
                <TableHead className="font-semibold text-center">Realisasi</TableHead>
                <TableHead className="font-semibold text-center">Progress</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Periode</TableHead>
                <TableHead className="font-semibold min-w-[100px]">Tgl Mulai</TableHead>
                <TableHead className="font-semibold min-w-[100px]">Tgl Selesai</TableHead>
                <TableHead className="font-semibold text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredKpis.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Target className="h-8 w-8 text-muted-foreground/50" />
                      <p>Belum ada KPI yang ditambahkan</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredKpis.map((kpi) => {
                  const progress = getProgress(kpi);
                  const canEdit = canEditKpi(kpi);
                  return (
                    <TableRow key={String(kpi.id)} className="hover:bg-muted/20">
                      <TableCell className="font-medium">{kpi.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {getProgramName(kpi.relatedProgramId)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{kpi.team.name}</p>
                          <p className="text-xs text-muted-foreground">{kpi.team.division}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {Number(kpi.targetValue).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {Number(kpi.realizationValue).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-sm font-semibold">{progress}%</span>
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(kpi.status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getPeriodLabel(kpi.period)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(kpi.startKpiDate)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(kpi.endKpiDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                            onClick={() => handleEdit(kpi)}
                            disabled={!canEdit}
                            title={
                              canEdit
                                ? 'Edit KPI'
                                : 'Anda tidak memiliki izin untuk mengedit KPI ini'
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setDeletingKpi(kpi)}
                            disabled={!canEdit || isDeletingId === kpi.id}
                            title={
                              canEdit
                                ? 'Hapus KPI'
                                : 'Anda tidak memiliki izin untuk menghapus KPI ini'
                            }
                          >
                            {isDeletingId === kpi.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* KPI Form Dialog */}
      <KpiFormDialog
        open={isFormOpen}
        onClose={handleFormClose}
        editingKpi={editingKpi}
        programs={programs ?? []}
      />

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={!!deletingKpi}
        onClose={() => setDeletingKpi(null)}
        onConfirm={handleDelete}
        title="Hapus KPI"
        description={`Apakah Anda yakin ingin menghapus KPI "${deletingKpi?.name}"? Tindakan ini tidak dapat dibatalkan.`}
      />
    </div>
  );
}
