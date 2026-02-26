import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateProgram, useUpdateProgram, useGetUniqueDivisions, useGetTeamMembersByDivision } from '../hooks/useQueries';
import { ProgramStatus, ProgramPriority, type Program, type PersonInCharge } from '../backend';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProgramFormDialogProps {
  open: boolean;
  onClose: () => void;
  program?: Program | null;
}

export default function ProgramFormDialog({ open, onClose, program }: ProgramFormDialogProps) {
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();
  const { data: divisions = [] } = useGetUniqueDivisions();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    division: '',
    personInChargeId: '',
    startDate: '',
    endDate: '',
    status: ProgramStatus.planning,
    progress: 0,
    priority: ProgramPriority.middle,
  });

  const { data: teamMembers = [] } = useGetTeamMembersByDivision(formData.division);

  useEffect(() => {
    if (program) {
      setFormData({
        name: program.name,
        description: program.description,
        division: program.personInCharge.division,
        personInChargeId: program.personInCharge.id.toString(),
        startDate: new Date(Number(program.startDate)).toISOString().split('T')[0],
        endDate: new Date(Number(program.endDate)).toISOString().split('T')[0],
        status: program.status,
        progress: Number(program.progress),
        priority: program.priority,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        division: '',
        personInChargeId: '',
        startDate: '',
        endDate: '',
        status: ProgramStatus.planning,
        progress: 0,
        priority: ProgramPriority.middle,
      });
    }
  }, [program, open]);

  // Reset PIC when division changes (only in create mode)
  useEffect(() => {
    if (!program) {
      setFormData(prev => ({ ...prev, personInChargeId: '' }));
    }
  }, [formData.division, program]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.division || !formData.personInChargeId) {
      toast.error('Pilih divisi dan penanggung jawab terlebih dahulu');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error('Tanggal mulai dan selesai wajib diisi');
      return;
    }

    const selectedMember = teamMembers.find(m => m.id.toString() === formData.personInChargeId);
    if (!selectedMember) {
      toast.error('Anggota tim tidak ditemukan, silakan pilih ulang');
      return;
    }

    // Ensure personInCharge.id is a valid BigInt
    const picId: bigint = typeof selectedMember.id === 'bigint'
      ? selectedMember.id
      : BigInt(Number(selectedMember.id));

    const personInCharge: PersonInCharge = {
      id: picId,
      name: selectedMember.name,
      division: selectedMember.division,
      role: selectedMember.role,
    };

    // Convert dates to BigInt millisecond timestamps
    const startDateMs = new Date(formData.startDate).getTime();
    const endDateMs = new Date(formData.endDate).getTime();

    if (isNaN(startDateMs) || isNaN(endDateMs)) {
      toast.error('Format tanggal tidak valid');
      return;
    }

    if (program) {
      // EDIT MODE: use existing program id
      const programData: Program = {
        id: program.id,
        name: formData.name,
        description: formData.description,
        unit: formData.division,
        personInCharge,
        startDate: BigInt(startDateMs),
        endDate: BigInt(endDateMs),
        status: formData.status,
        progress: BigInt(formData.progress),
        priority: formData.priority,
      };

      updateProgram.mutate(
        { id: program.id, program: programData },
        { onSuccess: onClose }
      );
    } else {
      // CREATE MODE: generate a placeholder id (backend will override with nextProgramId)
      const programData: Program = {
        id: BigInt(Date.now()),
        name: formData.name,
        description: formData.description,
        unit: formData.division,
        personInCharge,
        startDate: BigInt(startDateMs),
        endDate: BigInt(endDateMs),
        status: formData.status,
        progress: BigInt(formData.progress),
        priority: formData.priority,
      };

      createProgram.mutate(programData, { onSuccess: onClose });
    }
  };

  const isPending = createProgram.isPending || updateProgram.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{program ? 'Edit Program' : 'Tambah Program Baru'}</DialogTitle>
          <DialogDescription>
            {program ? 'Perbarui informasi program' : 'Masukkan detail program baru'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Program *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              required
              disabled={isPending}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="division">Unit/Divisi *</Label>
              <Select
                value={formData.division}
                onValueChange={(value) => setFormData({ ...formData, division: value })}
                disabled={isPending}
              >
                <SelectTrigger id="division">
                  <SelectValue placeholder="Pilih divisi" />
                </SelectTrigger>
                <SelectContent>
                  {divisions.length === 0 ? (
                    <SelectItem value="no-divisions" disabled>
                      Belum ada divisi
                    </SelectItem>
                  ) : (
                    divisions.map((division) => (
                      <SelectItem key={division} value={division}>
                        {division}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="personInCharge">Penanggung Jawab *</Label>
              <Select
                value={formData.personInChargeId}
                onValueChange={(value) => setFormData({ ...formData, personInChargeId: value })}
                disabled={!formData.division || isPending}
              >
                <SelectTrigger id="personInCharge">
                  <SelectValue placeholder={formData.division ? 'Pilih PIC' : 'Pilih divisi dulu'} />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.length === 0 ? (
                    <SelectItem value="no-members" disabled>
                      Tidak ada anggota
                    </SelectItem>
                  ) : (
                    teamMembers.map((member) => (
                      <SelectItem key={member.id.toString()} value={member.id.toString()}>
                        {member.name} - {member.role}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Tanggal Mulai *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Tanggal Selesai *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as ProgramStatus })}
                disabled={isPending}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ProgramStatus.planning}>Perencanaan</SelectItem>
                  <SelectItem value={ProgramStatus.ongoing}>Berjalan</SelectItem>
                  <SelectItem value={ProgramStatus.completed}>Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioritas *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as ProgramPriority })}
                disabled={isPending}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ProgramPriority.high}>Tinggi</SelectItem>
                  <SelectItem value={ProgramPriority.middle}>Sedang</SelectItem>
                  <SelectItem value={ProgramPriority.low}>Rendah</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="progress">Progress (%) *</Label>
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                required
                disabled={isPending}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending || !formData.division || !formData.personInChargeId}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : program ? (
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
