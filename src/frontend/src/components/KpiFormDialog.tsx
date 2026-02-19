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

interface ValidationErrors {
  name?: string;
  relatedProgramId?: string;
  teamMemberId?: string;
  targetValue?: string;
  realizationValue?: string;
  period?: string;
  status?: string;
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
    targetValue: '',
    realizationValue: '',
    period: '',
    status: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    if (kpi) {
      setFormData({
        name: kpi.name,
        relatedProgramId: kpi.relatedProgramId.toString(),
        teamMemberId: kpi.team.id.toString(),
        targetValue: kpi.targetValue.toString(),
        realizationValue: kpi.realizationValue.toString(),
        period: kpi.period,
        status: kpi.status,
      });
      setErrors({});
    } else {
      setFormData({
        name: '',
        relatedProgramId: programs.length > 0 ? programs[0].id.toString() : '',
        teamMemberId: '',
        targetValue: '',
        realizationValue: '',
        period: '',
        status: '',
      });
      setErrors({});
    }
  }, [kpi, open, programs]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Nama KPI wajib diisi';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nama KPI minimal 2 karakter';
    }

    // Validate related program
    if (!formData.relatedProgramId) {
      newErrors.relatedProgramId = 'Program terkait wajib dipilih';
    }

    // Validate team member
    if (!formData.teamMemberId) {
      newErrors.teamMemberId = 'Tim/PIC wajib dipilih';
    }

    // Validate target value
    if (!formData.targetValue || formData.targetValue === '') {
      newErrors.targetValue = 'Nilai target wajib diisi';
    } else {
      const targetNum = Number(formData.targetValue);
      if (isNaN(targetNum) || targetNum < 0 || !Number.isInteger(targetNum)) {
        newErrors.targetValue = 'Nilai target harus berupa angka bulat positif';
      }
    }

    // Validate realization value
    if (!formData.realizationValue || formData.realizationValue === '') {
      newErrors.realizationValue = 'Nilai realisasi wajib diisi';
    } else {
      const realizationNum = Number(formData.realizationValue);
      if (isNaN(realizationNum) || realizationNum < 0 || !Number.isInteger(realizationNum)) {
        newErrors.realizationValue = 'Nilai realisasi harus berupa angka bulat positif';
      }
    }

    // Validate period
    if (!formData.period) {
      newErrors.period = 'Periode wajib dipilih';
    }

    // Validate status
    if (!formData.status) {
      newErrors.status = 'Status wajib dipilih';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      console.error('Form validation failed:', errors);
      return;
    }

    // Find selected team member
    const selectedMember = teamMembers.find(m => m.id.toString() === formData.teamMemberId);
    if (!selectedMember) {
      setErrors({ ...errors, teamMemberId: 'Anggota tim tidak ditemukan' });
      console.error('Team member not found:', formData.teamMemberId);
      return;
    }

    // Parse and validate numeric values
    const targetNum = parseInt(formData.targetValue, 10);
    const realizationNum = parseInt(formData.realizationValue, 10);
    const programId = parseInt(formData.relatedProgramId, 10);

    if (isNaN(targetNum) || isNaN(realizationNum) || isNaN(programId)) {
      console.error('Invalid numeric values:', { targetNum, realizationNum, programId });
      setErrors({ 
        targetValue: isNaN(targetNum) ? 'Nilai target tidak valid' : undefined,
        realizationValue: isNaN(realizationNum) ? 'Nilai realisasi tidak valid' : undefined,
        relatedProgramId: isNaN(programId) ? 'Program ID tidak valid' : undefined,
      });
      return;
    }

    // Construct PersonInCharge object with all required fields
    const team: PersonInCharge = {
      id: selectedMember.id,
      name: selectedMember.name,
      division: selectedMember.division,
      role: selectedMember.role,
    };

    // Construct KPI data with proper types
    const kpiData = {
      name: formData.name.trim(),
      relatedProgramId: BigInt(programId),
      team,
      targetValue: BigInt(targetNum),
      realizationValue: BigInt(realizationNum),
      period: formData.period as KpiPeriod,
      status: formData.status as KpiStatus,
      deadline: null,
    };

    // Log the payload for debugging
    console.log('Submitting KPI data:', {
      ...kpiData,
      relatedProgramId: kpiData.relatedProgramId.toString(),
      targetValue: kpiData.targetValue.toString(),
      realizationValue: kpiData.realizationValue.toString(),
    });

    if (kpi) {
      updateKpi.mutate(
        { id: kpi.id, kpi: { ...kpiData, id: kpi.id, deadline: kpi.deadline } as Kpi },
        { onSuccess: onClose }
      );
    } else {
      createKpi.mutate(kpiData as any, { onSuccess: onClose });
    }
  };

  const clearFieldError = (field: keyof ValidationErrors) => {
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const isPending = createKpi.isPending || updateKpi.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{kpi ? 'Edit KPI' : 'Tambah KPI Baru'}</DialogTitle>
          <DialogDescription>
            {kpi ? 'Perbarui informasi KPI' : 'Masukkan detail KPI baru. Semua field wajib diisi.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama KPI *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                clearFieldError('name');
              }}
              className={errors.name ? 'border-red-500' : ''}
              placeholder="Masukkan nama KPI"
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="relatedProgramId">Program Terkait *</Label>
            <RelatedProgramCombobox
              programs={programs}
              value={formData.relatedProgramId}
              onValueChange={(value) => {
                setFormData({ ...formData, relatedProgramId: value });
                clearFieldError('relatedProgramId');
              }}
              disabled={isPending}
            />
            {errors.relatedProgramId && <p className="text-sm text-red-500">{errors.relatedProgramId}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="team">Tim/PIC *</Label>
            <Select
              value={formData.teamMemberId}
              onValueChange={(value) => {
                setFormData({ ...formData, teamMemberId: value });
                clearFieldError('teamMemberId');
              }}
            >
              <SelectTrigger id="team" className={errors.teamMemberId ? 'border-red-500' : ''}>
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
            {errors.teamMemberId && <p className="text-sm text-red-500">{errors.teamMemberId}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="targetValue">Nilai Target *</Label>
              <Input
                id="targetValue"
                type="number"
                min="0"
                step="1"
                value={formData.targetValue}
                onChange={(e) => {
                  setFormData({ ...formData, targetValue: e.target.value });
                  clearFieldError('targetValue');
                }}
                className={errors.targetValue ? 'border-red-500' : ''}
                placeholder="0"
              />
              {errors.targetValue && <p className="text-sm text-red-500">{errors.targetValue}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="realizationValue">Nilai Realisasi *</Label>
              <Input
                id="realizationValue"
                type="number"
                min="0"
                step="1"
                value={formData.realizationValue}
                onChange={(e) => {
                  setFormData({ ...formData, realizationValue: e.target.value });
                  clearFieldError('realizationValue');
                }}
                className={errors.realizationValue ? 'border-red-500' : ''}
                placeholder="0"
              />
              {errors.realizationValue && <p className="text-sm text-red-500">{errors.realizationValue}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="period">Periode *</Label>
              <Select
                value={formData.period}
                onValueChange={(value) => {
                  setFormData({ ...formData, period: value });
                  clearFieldError('period');
                }}
              >
                <SelectTrigger id="period" className={errors.period ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Pilih periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={KpiPeriod.monthly}>Bulanan</SelectItem>
                  <SelectItem value={KpiPeriod.quarterly}>Triwulan</SelectItem>
                  <SelectItem value={KpiPeriod.annual}>Tahunan</SelectItem>
                </SelectContent>
              </Select>
              {errors.period && <p className="text-sm text-red-500">{errors.period}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => {
                  setFormData({ ...formData, status: value });
                  clearFieldError('status');
                }}
              >
                <SelectTrigger id="status" className={errors.status ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={KpiStatus.notAchieved}>Belum Tercapai</SelectItem>
                  <SelectItem value={KpiStatus.inProgress}>Dalam Progress</SelectItem>
                  <SelectItem value={KpiStatus.achieved}>Tercapai</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
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
