import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateTeamMember, useUpdateTeamMember } from '../hooks/useQueries';
import type { TeamMember } from '../backend';
import { Loader2 } from 'lucide-react';

interface TeamMemberFormDialogProps {
  open: boolean;
  onClose: () => void;
  member?: TeamMember | null;
}

export default function TeamMemberFormDialog({ open, onClose, member }: TeamMemberFormDialogProps) {
  const createMutation = useCreateTeamMember();
  const updateMutation = useUpdateTeamMember();

  const [formData, setFormData] = useState({
    name: '',
    division: '',
    role: '',
  });

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name,
        division: member.division,
        role: member.role,
      });
    } else {
      setFormData({
        name: '',
        division: '',
        role: '',
      });
    }
  }, [member, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (member) {
      // Update existing member - include id
      await updateMutation.mutateAsync({
        id: member.id,
        member: {
          id: member.id,
          name: formData.name.trim(),
          division: formData.division.trim(),
          role: formData.role.trim(),
        },
      });
    } else {
      // Create new member - backend will assign id, so we pass a placeholder
      await createMutation.mutateAsync({
        id: BigInt(0), // Placeholder, backend will assign the actual id
        name: formData.name.trim(),
        division: formData.division.trim(),
        role: formData.role.trim(),
      });
    }

    onClose();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{member ? 'Edit Anggota Tim' : 'Tambah Anggota Tim Baru'}</DialogTitle>
          <DialogDescription>
            {member ? 'Perbarui informasi anggota tim' : 'Masukkan detail anggota tim baru'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              minLength={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="division">Divisi *</Label>
            <Input
              id="division"
              value={formData.division}
              onChange={(e) => setFormData({ ...formData, division: e.target.value })}
              required
              minLength={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Peran *</Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
              minLength={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {member ? 'Simpan Perubahan' : 'Tambah Anggota'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
