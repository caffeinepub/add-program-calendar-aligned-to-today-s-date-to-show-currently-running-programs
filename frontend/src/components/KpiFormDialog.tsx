import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateKpi, useUpdateKpi } from '../hooks/useQueries';
import { KpiStatus, KpiPeriod } from '../backend';
import type { Kpi, Program } from '../backend';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import RelatedProgramCombobox from './RelatedProgramCombobox';

interface KpiFormDialogProps {
  open: boolean;
  onClose: () => void;
  editingKpi: Kpi | null;
  programs: Program[];
}

const defaultForm = {
  name: '',
  relatedProgramId: '',
  teamName: '',
  teamDivision: '',
  teamRole: '',
  targetValue: '',
  realizationValue: '',
  period: KpiPeriod.monthly as KpiPeriod,
  status: KpiStatus.notAchieved as KpiStatus,
  deadline: '',
  startKpiDate: '',
  endKpiDate: '',
};

export default function KpiFormDialog({ open, onClose, editingKpi, programs }: KpiFormDialogProps) {
  const createKpi = useCreateKpi();
  const updateKpi = useUpdateKpi();
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (editingKpi) {
      const toDateStr = (ts: bigint): string => {
        if (!ts || ts === BigInt(0)) return '';
        try {
          const d = new Date(Number(ts));
          return d.toISOString().split('T')[0];
        } catch {
          return '';
        }
      };
      setForm({
        name: editingKpi.name,
        relatedProgramId: String(editingKpi.relatedProgramId),
        teamName: editingKpi.team.name,
        teamDivision: editingKpi.team.division,
        teamRole: editingKpi.team.role,
        targetValue: String(editingKpi.targetValue),
        realizationValue: String(editingKpi.realizationValue),
        period: editingKpi.period,
        status: editingKpi.status,
        deadline: editingKpi.deadline ? toDateStr(editingKpi.deadline) : '',
        startKpiDate: toDateStr(editingKpi.startKpiDate),
        endKpiDate: toDateStr(editingKpi.endKpiDate),
      });
    } else {
      setForm(defaultForm);
    }
  }, [editingKpi, open]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toTimestamp = (dateStr: string): bigint => {
    if (!dateStr) return BigInt(0);
    try {
      return BigInt(new Date(dateStr).getTime());
    } catch {
      return BigInt(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!form.name.trim()) {
      toast.error('Nama KPI tidak boleh kosong');
      return;
    }
    if (!form.relatedProgramId) {
      toast.error('Program terkait harus dipilih');
      return;
    }
    if (!form.teamName.trim()) {
      toast.error('Nama tim/PIC tidak boleh kosong');
      return;
    }
    if (!form.teamDivision.trim()) {
      toast.error('Divisi tim tidak boleh kosong');
      return;
    }
    if (!form.teamRole.trim()) {
      toast.error('Peran tim tidak boleh kosong');
      return;
    }
    if (!form.targetValue || Number(form.targetValue) <= 0) {
      toast.error('Target nilai harus lebih dari 0');
      return;
    }
    if (Number(form.realizationValue) > Number(form.targetValue)) {
      toast.error('Nilai realisasi tidak boleh melebihi target');
      return;
    }
    if (!form.startKpiDate) {
      toast.error('Tanggal mulai KPI harus diisi');
      return;
    }
    if (!form.endKpiDate) {
      toast.error('Tanggal selesai KPI harus diisi');
      return;
    }

    const kpiData: Kpi = {
      id: editingKpi ? editingKpi.id : BigInt(Date.now()),
      name: form.name.trim(),
      relatedProgramId: BigInt(form.relatedProgramId),
      team: {
        id: editingKpi ? editingKpi.team.id : BigInt(Date.now()),
        name: form.teamName.trim(),
        division: form.teamDivision.trim(),
        role: form.teamRole.trim(),
      },
      targetValue: BigInt(Math.round(Number(form.targetValue))),
      realizationValue: BigInt(Math.round(Number(form.realizationValue) || 0)),
      period: form.period,
      status: form.status,
      deadline: form.deadline ? toTimestamp(form.deadline) : undefined,
      startKpiDate: toTimestamp(form.startKpiDate),
      endKpiDate: toTimestamp(form.endKpiDate),
    };

    try {
      if (editingKpi) {
        await updateKpi.mutateAsync({ id: editingKpi.id, kpi: kpiData });
        toast.success('KPI berhasil diperbarui');
      } else {
        await createKpi.mutateAsync(kpiData);
        toast.success('KPI berhasil ditambahkan');
      }
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('Unauthorized')) {
        toast.error('Anda tidak memiliki izin untuk mengedit KPI ini');
      } else if (message.includes('Program not found')) {
        toast.error('Program terkait tidak ditemukan');
      } else if (message.includes('Realization value must not be higher')) {
        toast.error('Nilai realisasi tidak boleh melebihi target');
      } else {
        toast.error('Gagal menyimpan KPI: ' + message);
      }
    }
  };

  const isPending = createKpi.isPending || updateKpi.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !isPending) onClose();
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {editingKpi ? 'Edit KPI' : 'Tambah KPI Baru'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* KPI Name */}
          <div className="space-y-1.5">
            <Label htmlFor="kpi-name">
              Nama KPI <span className="text-destructive">*</span>
            </Label>
            <Input
              id="kpi-name"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Masukkan nama KPI"
              disabled={isPending}
            />
          </div>

          {/* Related Program */}
          <div className="space-y-1.5">
            <Label>
              Program Terkait <span className="text-destructive">*</span>
            </Label>
            <RelatedProgramCombobox
              programs={programs}
              value={form.relatedProgramId}
              onValueChange={(val) => handleChange('relatedProgramId', val)}
              disabled={isPending}
            />
          </div>

          {/* Team Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="team-name">
                Nama Tim/PIC <span className="text-destructive">*</span>
              </Label>
              <Input
                id="team-name"
                value={form.teamName}
                onChange={(e) => handleChange('teamName', e.target.value)}
                placeholder="Nama tim atau PIC"
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="team-division">
                Divisi <span className="text-destructive">*</span>
              </Label>
              <Input
                id="team-division"
                value={form.teamDivision}
                onChange={(e) => handleChange('teamDivision', e.target.value)}
                placeholder="Divisi tim"
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="team-role">
                Peran <span className="text-destructive">*</span>
              </Label>
              <Input
                id="team-role"
                value={form.teamRole}
                onChange={(e) => handleChange('teamRole', e.target.value)}
                placeholder="Peran dalam tim"
                disabled={isPending}
              />
            </div>
          </div>

          {/* Target & Realization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="target-value">
                Target Nilai <span className="text-destructive">*</span>
              </Label>
              <Input
                id="target-value"
                type="number"
                min="1"
                value={form.targetValue}
                onChange={(e) => handleChange('targetValue', e.target.value)}
                placeholder="Nilai target"
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="realization-value">Nilai Realisasi</Label>
              <Input
                id="realization-value"
                type="number"
                min="0"
                value={form.realizationValue}
                onChange={(e) => handleChange('realizationValue', e.target.value)}
                placeholder="Nilai realisasi saat ini"
                disabled={isPending}
              />
            </div>
          </div>

          {/* Period & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Periode</Label>
              <Select
                value={form.period}
                onValueChange={(v) => handleChange('period', v)}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={KpiPeriod.monthly}>Bulanan</SelectItem>
                  <SelectItem value={KpiPeriod.quarterly}>Triwulan</SelectItem>
                  <SelectItem value={KpiPeriod.annual}>Tahunan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => handleChange('status', v)}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={KpiStatus.notAchieved}>Belum Tercapai</SelectItem>
                  <SelectItem value={KpiStatus.inProgress}>Dalam Proses</SelectItem>
                  <SelectItem value={KpiStatus.achieved}>Tercapai</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start-date">
                Tanggal Mulai <span className="text-destructive">*</span>
              </Label>
              <Input
                id="start-date"
                type="date"
                value={form.startKpiDate}
                onChange={(e) => handleChange('startKpiDate', e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end-date">
                Tanggal Selesai <span className="text-destructive">*</span>
              </Label>
              <Input
                id="end-date"
                type="date"
                value={form.endKpiDate}
                onChange={(e) => handleChange('endKpiDate', e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deadline">Deadline (Opsional)</Label>
              <Input
                id="deadline"
                type="date"
                value={form.deadline}
                onChange={(e) => handleChange('deadline', e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white border-0"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : editingKpi ? (
                'Perbarui KPI'
              ) : (
                'Tambah KPI'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
