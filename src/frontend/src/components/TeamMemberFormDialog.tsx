import { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateTeamMember, useUpdateTeamMember, useGetAllTeamMembers } from '../hooks/useQueries';
import type { TeamMember } from '../backend';
import { Loader2, Upload, X } from 'lucide-react';
import PhotoUrlPreview from './team/PhotoUrlPreview';
import ManagerSelect from './team/ManagerSelect';
import { uploadImage } from '../utils/imageUpload';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface TeamMemberFormDialogProps {
  open: boolean;
  onClose: () => void;
  member?: TeamMember | null;
}

export default function TeamMemberFormDialog({ open, onClose, member }: TeamMemberFormDialogProps) {
  const createMutation = useCreateTeamMember();
  const updateMutation = useUpdateTeamMember();
  const { data: allMembers = [] } = useGetAllTeamMembers();
  const queryClient = useQueryClient();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFileInputOpen, setIsFileInputOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    division: '',
    role: '',
    avatar: '',
    managerId: undefined as bigint | undefined,
  });

  const [errors, setErrors] = useState({
    avatar: '',
    managerId: '',
  });

  const [uploadState, setUploadState] = useState({
    isUploading: false,
    progress: 0,
  });

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name,
        division: member.division,
        role: member.role,
        avatar: member.avatar || '',
        managerId: member.managerId,
      });
    } else {
      setFormData({
        name: '',
        division: '',
        role: '',
        avatar: '',
        managerId: undefined,
      });
    }
    setErrors({ avatar: '', managerId: '' });
    setUploadState({ isUploading: false, progress: 0 });
    setIsFileInputOpen(false);
  }, [member, open]);

  const handleChooseFile = () => {
    // Prevent multiple opens and don't open during upload
    if (!uploadState.isUploading && !isFileInputOpen && fileInputRef.current) {
      setIsFileInputOpen(true);
      fileInputRef.current.click();
      // Reset flag after a short delay
      setTimeout(() => setIsFileInputOpen(false), 500);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear any previous avatar and errors
    setFormData({ ...formData, avatar: '' });
    setUploadState({ isUploading: true, progress: 0 });
    setErrors({ ...errors, avatar: '' });

    try {
      const url = await uploadImage({
        file,
        onProgress: (percent) => {
          setUploadState({ isUploading: true, progress: percent });
        },
      });

      // Validate that we got a proper https URL
      if (!url || !url.startsWith('https://')) {
        throw new Error('Upload did not return a valid URL');
      }

      setFormData({ ...formData, avatar: url });
      setUploadState({ isUploading: false, progress: 100 });
      toast.success('Image uploaded successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      setErrors({ ...errors, avatar: errorMessage });
      setUploadState({ isUploading: false, progress: 0 });
      setFormData({ ...formData, avatar: '' }); // Clear partial avatar
      toast.error(errorMessage);
    }

    // Reset file input to allow re-selecting the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearPhoto = () => {
    setFormData({ ...formData, avatar: '' });
    setErrors({ ...errors, avatar: '' });
    setUploadState({ isUploading: false, progress: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleManagerChange = (value: bigint | undefined) => {
    // Prevent self-selection
    if (member && value !== undefined && value === member.id) {
      setErrors({ ...errors, managerId: 'A team member cannot be their own manager' });
      return;
    }
    setFormData({ ...formData, managerId: value });
    setErrors({ ...errors, managerId: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Block submit if upload is in progress
    if (uploadState.isUploading) {
      toast.error('Please wait for the image upload to complete');
      return;
    }

    // Validate manager selection
    if (member && formData.managerId !== undefined && formData.managerId === member.id) {
      setErrors({ ...errors, managerId: 'A team member cannot be their own manager' });
      return;
    }

    const memberData: TeamMember = {
      id: member?.id || BigInt(0),
      name: formData.name.trim(),
      division: formData.division.trim(),
      role: formData.role.trim(),
      avatar: formData.avatar.trim() || undefined,
      managerId: formData.managerId,
    };

    if (member) {
      await updateMutation.mutateAsync({
        id: member.id,
        member: memberData,
      });
      
      // Manually update the cache to reflect the change immediately
      queryClient.setQueryData<TeamMember[]>(['teamMembers'], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(m => 
          m.id === member.id ? memberData : m
        );
      });
    } else {
      await createMutation.mutateAsync(memberData);
    }

    onClose();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isSubmitDisabled = 
    isPending || 
    uploadState.isUploading || 
    !!errors.avatar || 
    !!errors.managerId ||
    !formData.name.trim() ||
    !formData.division.trim() ||
    !formData.role.trim();

  // Only show preview if we have a valid https URL
  const showPreview = formData.avatar && formData.avatar.startsWith('https://') && !errors.avatar && !uploadState.isUploading;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{member ? 'Edit Team Member' : 'Add New Team Member'}</DialogTitle>
          <DialogDescription>
            {member ? 'Update team member information' : 'Enter details for the new team member'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              minLength={2}
              placeholder="Enter full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="division">Division *</Label>
            <Input
              id="division"
              value={formData.division}
              onChange={(e) => setFormData({ ...formData, division: e.target.value })}
              required
              minLength={2}
              placeholder="e.g., Engineering, Marketing"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
              minLength={2}
              placeholder="e.g., Manager, Developer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar">Photo</Label>
            <div className="space-y-3">
              {/* File Upload Button */}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="photo-file-input"
                  disabled={uploadState.isUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleChooseFile}
                  disabled={uploadState.isUploading}
                  className="flex-1"
                >
                  {uploadState.isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading... {uploadState.progress}%
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Choose from Device
                    </>
                  )}
                </Button>
                {formData.avatar && !uploadState.isUploading && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleClearPhoto}
                    title="Clear photo"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Upload Progress */}
              {uploadState.isUploading && (
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${uploadState.progress}%` }}
                  />
                </div>
              )}

              {/* Error Message - persistent until next attempt or clear */}
              {errors.avatar && (
                <p className="text-sm text-destructive">{errors.avatar}</p>
              )}

              {/* Preview - only when valid URL exists */}
              {showPreview && (
                <PhotoUrlPreview url={formData.avatar} name={formData.name || 'Team Member'} />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager">Manager</Label>
            <ManagerSelect
              value={formData.managerId}
              onChange={handleManagerChange}
              members={allMembers}
              currentMemberId={member?.id}
            />
            {errors.managerId && (
              <p className="text-sm text-destructive">{errors.managerId}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Select "No manager (Director)" for the top-level position
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending || uploadState.isUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {member ? 'Save Changes' : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
