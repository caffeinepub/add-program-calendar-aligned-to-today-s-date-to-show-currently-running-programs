import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Upload, X, Lock } from 'lucide-react';
import type { TeamMemberWithAvatar } from '../backend';
import { useCreateTeamMember, useUpdateTeamMember, useSetTeamMemberAvatar } from '../hooks/useQueries';
import { toast } from 'sonner';
import ManagerSelect from './team/ManagerSelect';
import { getTeamMemberAvatarSrc } from '../utils/teamMemberAvatar';
import { uploadTeamMemberAvatar } from '../utils/teamMemberAvatarUpload';

interface TeamMemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: TeamMemberWithAvatar | null;
  allMembers: TeamMemberWithAvatar[];
  isAuthenticated?: boolean;
}

export default function TeamMemberFormDialog({
  open,
  onOpenChange,
  member,
  allMembers,
  isAuthenticated = false
}: TeamMemberFormDialogProps) {
  const isEditing = !!member;
  const [name, setName] = useState('');
  const [division, setDivision] = useState('');
  const [role, setRole] = useState('');
  const [managerId, setManagerId] = useState<bigint | undefined>(undefined);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [photoUploadProgress, setPhotoUploadProgress] = useState(0);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createMutation = useCreateTeamMember();
  const updateMutation = useUpdateTeamMember();
  const setAvatarMutation = useSetTeamMemberAvatar();

  useEffect(() => {
    if (member) {
      setName(member.name);
      setDivision(member.division);
      setRole(member.role);
      setManagerId(member.managerId);
    } else {
      setName('');
      setDivision('');
      setRole('');
      setManagerId(undefined);
    }
    setPhotoUploadError(null);
    setIsPhotoUploading(false);
    setPhotoUploadProgress(0);
  }, [member, open]);

  const avatarSrc = member ? getTeamMemberAvatarSrc(member) : null;

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const handleChoosePhoto = () => {
    if (!isAuthenticated) {
      toast.error('Silakan login untuk mengubah foto');
      return;
    }

    if (!member) {
      toast.error('Simpan anggota tim terlebih dahulu sebelum mengupload foto');
      return;
    }

    if (isPhotoUploading) return;

    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAuthenticated) {
      toast.error('Silakan login untuk mengubah foto');
      e.target.value = '';
      return;
    }

    if (!member) {
      toast.error('Simpan anggota tim terlebih dahulu sebelum mengupload foto');
      e.target.value = '';
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      const errorMsg = 'Format file tidak didukung. Gunakan JPEG, PNG, GIF, atau WebP';
      setPhotoUploadError(errorMsg);
      toast.error(errorMsg);
      e.target.value = '';
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      const errorMsg = 'Ukuran file terlalu besar. Maksimal 10MB';
      setPhotoUploadError(errorMsg);
      toast.error(errorMsg);
      e.target.value = '';
      return;
    }

    setIsPhotoUploading(true);
    setPhotoUploadProgress(0);
    setPhotoUploadError(null);

    try {
      // Upload to backend blob storage with progress tracking
      const avatarBlob = await uploadTeamMemberAvatar(file, (percentage) => {
        setPhotoUploadProgress(Math.round(percentage));
      });

      // Save to backend
      await setAvatarMutation.mutateAsync({
        memberId: member.id,
        avatar: avatarBlob,
      });

      setPhotoUploadProgress(100);
      setPhotoUploadError(null);
    } catch (error) {
      console.error('Photo upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengupload foto';
      setPhotoUploadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsPhotoUploading(false);
      setTimeout(() => {
        if (photoUploadError === null) {
          setPhotoUploadProgress(0);
        }
      }, 1000);
      e.target.value = '';
    }
  };

  const handleClearPhotoError = () => {
    setPhotoUploadError(null);
    setPhotoUploadProgress(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !division.trim() || !role.trim()) {
      toast.error('Mohon isi semua field yang wajib diisi');
      return;
    }

    if (isPhotoUploading) {
      toast.error('Mohon tunggu upload foto selesai');
      return;
    }

    const memberData: TeamMemberWithAvatar = {
      id: member?.id || BigInt(0),
      name: name.trim(),
      division: division.trim(),
      role: role.trim(),
      managerId,
      avatar: member?.avatar,
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: member.id, member: memberData });
      } else {
        await createMutation.mutateAsync(memberData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const canSubmit = !isSaving && !isPhotoUploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Anggota Tim' : 'Tambah Anggota Tim'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Section */}
          <div className="flex flex-col items-center gap-3 py-2">
            <Avatar className="h-24 w-24 rounded-lg">
              {avatarSrc ? (
                <AvatarImage src={avatarSrc} alt={name || 'Team member'} />
              ) : (
                <AvatarFallback className="rounded-lg bg-primary/10 text-2xl font-semibold">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>

            <div className="flex flex-col items-center gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleChoosePhoto}
                disabled={!isEditing || isPhotoUploading || !isAuthenticated}
                className="w-full max-w-xs"
              >
                {!isAuthenticated ? (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Login Diperlukan untuk Upload Foto
                  </>
                ) : isPhotoUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Mengupload... {photoUploadProgress}%
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {isEditing ? 'Pilih dari Perangkat' : 'Simpan anggota dulu untuk tambah foto'}
                  </>
                )}
              </Button>

              {photoUploadError && (
                <div className="flex items-start gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive w-full max-w-xs">
                  <span className="flex-1">{photoUploadError}</span>
                  <button
                    type="button"
                    onClick={handleClearPhotoError}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {!isAuthenticated && (
                <p className="text-xs text-muted-foreground text-center max-w-xs">
                  Silakan login dengan Internet Identity untuk upload foto
                </p>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
              disabled={!isEditing || isPhotoUploading || !isAuthenticated}
            />
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="name">Nama *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama lengkap"
                required
              />
            </div>

            <div>
              <Label htmlFor="division">Divisi *</Label>
              <Input
                id="division"
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                placeholder="Contoh: Akademik, Media, HRD"
                required
              />
            </div>

            <div>
              <Label htmlFor="role">Peran *</Label>
              <Input
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Contoh: Koordinator, Anggota"
                required
              />
            </div>

            <div>
              <Label htmlFor="manager">Manager</Label>
              <ManagerSelect
                value={managerId}
                onChange={setManagerId}
                members={allMembers}
                currentMemberId={member?.id}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                isEditing ? 'Simpan Perubahan' : 'Tambah Anggota'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
