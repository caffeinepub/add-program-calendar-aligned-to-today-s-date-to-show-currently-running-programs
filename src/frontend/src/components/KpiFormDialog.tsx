import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateKpi, useUpdateKpi, useGetAllPrograms, useGetAllTeamMembers } from '../hooks/useQueries';
import { KpiStatus, KpiPeriod, type Kpi, type PersonInCharge } from '../backend';
import { Loader2 } from 'lucide-react';
import RelatedProgramCombobox from './RelatedProgramCombobox';

interface KpiFormDialogProps {
  open: boolean;
  onClose: () => void;
  kpi?: Kpi | null;
}

export default function KpiFormDialog({ open, onClose, kpi }: KpiFormDialogProps) {
  const createKpi = useCreateKpi();
  const updateKpi = useUpdateKpi();
  const { data: programs = [] } = useGetAllPrograms();
  const { data: teamMembers = [] } = useGetAllTeamMembers();

  const [formData, setFormData] = useState({
    name: '',
    relatedProgramId: '',
    teamMemberId: '',
    targetValue: 0,
    realizationValue: 0,
    period: KpiPeriod.monthly,
    status: KpiStatus.notAchieved,
  });

  useEffect(() => {
    if (kpi) {
      setFormData({
        name: kpi.name,
        relatedProgramId: kpi.relatedProgramId.toString(),
        teamMemberId: kpi.team.id.toString(),
        targetValue: Number(kpi.targetValue),
        realizationValue: Number(kpi.realizationValue),
        period: kpi.period,
        status: kpi.status,
      });
    } else {
      setFormData({
        name: '',
        relatedProgramId: programs.length > 0 ? programs[0].id.toString() : '',
        teamMemberId: '',
        targetValue: 0,
        realizationValue: 0,
        period: KpiPeriod.monthly,
        status: KpiStatus.notAchieved,
      });
    }
  }, [kpi, open, programs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.teamMemberId) {
      return;
    }

    const selectedMember = teamMembers.find(m => m.id.toString() === formData.teamMemberId);
    if (!selectedMember) {
      return;
    }

    const team: PersonInCharge = {
      id: selectedMember.id,
      name: selectedMember.name,
      division: selectedMember.division,
      role: selectedMember.role,
    };

    const kpiData = {
      name: formData.name,
      relatedProgramId: BigInt(formData.relatedProgramId),
      team,
      targetValue: BigInt(formData.targetValue),
      realizationValue: BigInt(formData.realizationValue),
      period: formData.period,
      status: formData.status,
    };

    if (kpi) {
      updateKpi.mutate(
        { id: kpi.id, kpi: { ...kpiData, id: kpi.id } as Kpi },
        { onSuccess: onClose }
      );
    } else {
      createKpi.mutate(kpiData as any, { onSuccess: onClose });
    }
  };

  const isPending = createKpi.isPending || updateKpi.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{kpi ? 'Edit KPI' : 'Tambah KPI Baru'}</DialogTitle>
          <DialogDescription>
            {kpi ? 'Perbarui informasi KPI' : 'Masukkan detail KPI baru'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama KPI *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="relatedProgramId">Program Terkait *</Label>
            <RelatedProgramCombobox
              programs={programs}
              value={formData.relatedProgramId}
              onValueChange={(value) => setFormData({ ...formData, relatedProgramId: value })}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team">Tim/PIC *</Label>
            <Select
              value={formData.teamMemberId}
              onValueChange={(value) => setFormData({ ...formData, teamMemberId: value })}
            >
              <SelectTrigger id="team">
                <SelectValue placeholder="Pilih anggota tim" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.length === 0 ? (
                  <SelectItem value="no-members" disabled>
                    Belum ada anggota tim
                  </SelectItem>
                ) : (
                  teamMembers.map((member) => (
                    <SelectItem key={member.id.toString()} value={member.id.toString()}>
                      {member.name} - {member.division} ({member.role})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="targetValue">Target *</Label>
              <Input
                id="targetValue"
                type="number"
                min="0"
                value={formData.targetValue}
                onChange={(e) => setFormData({ ...formData, targetValue: parseInt(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="realizationValue">Realisasi *</Label>
              <Input
                id="realizationValue"
                type="number"
                min="0"
                value={formData.realizationValue}
                onChange={(e) => setFormData({ ...formData, realizationValue: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="period">Periode *</Label>
              <Select value={formData.period} onValueChange={(value) => setFormData({ ...formData, period: value as KpiPeriod })}>
                <SelectTrigger id="period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={KpiPeriod.monthly}>Bulanan</SelectItem>
                  <SelectItem value={KpiPeriod.quarterly}>Triwulan</SelectItem>
                  <SelectItem value={KpiPeriod.annual}>Tahunan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as KpiStatus })}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={KpiStatus.notAchieved}>Belum Tercapai</SelectItem>
                  <SelectItem value={KpiStatus.inProgress}>Dalam Progress</SelectItem>
                  <SelectItem value={KpiStatus.achieved}>Tercapai</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending || !formData.teamMemberId}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : kpi ? (
                'Perbarui'
              ) : (
                'Simpan'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
