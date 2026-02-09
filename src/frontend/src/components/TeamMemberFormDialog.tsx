import { useEffect, useState } from 'react';
import { useCreateTeamMember, useUpdateTeamMember } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { TeamMember } from '../backend';

interface TeamMemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: TeamMember | null;
}

export default function TeamMemberFormDialog({ open, onOpenChange, member }: TeamMemberFormDialogProps) {
  const createMutation = useCreateTeamMember();
  const updateMutation = useUpdateTeamMember();

  const [formData, setFormData] = useState({
    name: '',
    division: '',
    role: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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
    setErrors({});
  }, [member, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama wajib diisi';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nama minimal 2 karakter';
    }

    if (!formData.division.trim()) {
      newErrors.division = 'Divisi wajib diisi';
    } else if (formData.division.trim().length < 2) {
      newErrors.division = 'Divisi minimal 2 karakter';
    }

    if (!formData.role.trim()) {
      newErrors.role = 'Peran wajib diisi';
    } else if (formData.role.trim().length < 2) {
      newErrors.role = 'Peran minimal 2 karakter';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (member) {
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
        await createMutation.mutateAsync({
          name: formData.name.trim(),
          division: formData.division.trim(),
          role: formData.role.trim(),
        });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{member ? 'Edit Anggota Tim' : 'Tambah Anggota Tim'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nama <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Masukkan nama anggota tim"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="division">
              Divisi <span className="text-destructive">*</span>
            </Label>
            <Input
              id="division"
              value={formData.division}
              onChange={(e) => setFormData({ ...formData, division: e.target.value })}
              placeholder="Masukkan divisi"
              className={errors.division ? 'border-destructive' : ''}
            />
            {errors.division && <p className="text-sm text-destructive">{errors.division}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">
              Peran <span className="text-destructive">*</span>
            </Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="Masukkan peran"
              className={errors.role ? 'border-destructive' : ''}
            />
            {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {member ? 'Perbarui' : 'Tambah'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
