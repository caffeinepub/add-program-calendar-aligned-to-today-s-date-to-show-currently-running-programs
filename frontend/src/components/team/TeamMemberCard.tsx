import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, Trash2, Camera, Loader2, Lock } from 'lucide-react';
import type { TeamMemberWithAvatar } from '../../backend';
import { useSetTeamMemberAvatar } from '../../hooks/useQueries';
import { toast } from 'sonner';
import { getTeamMemberAvatarSrc } from '../../utils/teamMemberAvatar';
import { uploadTeamMemberAvatar } from '../../utils/teamMemberAvatarUpload';

interface TeamMemberCardProps {
  member: TeamMemberWithAvatar;
  onEdit?: (member: TeamMemberWithAvatar) => void;
  onDelete?: (member: TeamMemberWithAvatar) => void;
  onClick?: (member: TeamMemberWithAvatar) => void;
  canEditPhoto?: boolean;
  isAuthenticated?: boolean;
}

export default function TeamMemberCard({ 
  member, 
  onEdit, 
  onDelete, 
  onClick,
  canEditPhoto = false,
  isAuthenticated = false
}: TeamMemberCardProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setAvatarMutation = useSetTeamMemberAvatar();

  const initials = member.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Get avatar src using utility
  const avatarSrc = getTeamMemberAvatarSrc(member);

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check authentication first
    if (!isAuthenticated) {
      toast.error('Silakan login untuk mengubah foto');
      return;
    }

    // Prevent multiple opens and don't open during upload
    if (canEditPhoto && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAuthenticated) {
      toast.error('Silakan login untuk mengubah foto');
      e.target.value = '';
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan JPEG, PNG, GIF, atau WebP');
      e.target.value = '';
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Ukuran file terlalu besar. Maksimal 10MB');
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload to backend blob storage with progress tracking
      const avatarBlob = await uploadTeamMemberAvatar(file, (percentage) => {
        setUploadProgress(Math.round(percentage));
      });

      // Save to backend
      await setAvatarMutation.mutateAsync({
        memberId: member.id,
        avatar: avatarBlob,
      });

      setUploadProgress(100);
      toast.success('Foto berhasil diupload');
    } catch (error) {
      console.error('Avatar upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengupload foto';
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      // Reset progress after a short delay
      setTimeout(() => setUploadProgress(0), 1000);
      e.target.value = '';
    }
  };

  const showActions = onEdit || onDelete;

  return (
    <Card 
      className={`group relative overflow-hidden transition-all hover:shadow-md ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick ? () => onClick(member) : undefined}
    >
      <CardContent className="p-4">
        <div className="flex flex-col items-center gap-3">
          {/* Avatar with upload overlay */}
          <div 
            className="relative"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <Avatar 
              className={`h-20 w-20 rounded-lg transition-all ${
                canEditPhoto && isAuthenticated ? 'cursor-pointer' : ''
              }`}
              onClick={handleAvatarClick}
            >
              {avatarSrc ? (
                <AvatarImage src={avatarSrc} alt={member.name} className="object-cover" />
              ) : (
                <AvatarFallback className="rounded-lg bg-primary/10 text-lg font-semibold">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>

            {/* Upload overlay - shows on hover or during upload */}
            {canEditPhoto && (isHovering || isUploading) && (
              <div
                className={`absolute inset-0 flex items-center justify-center rounded-lg bg-black/60 transition-opacity ${
                  isUploading || isHovering ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={handleAvatarClick}
                style={{ cursor: isAuthenticated && !isUploading ? 'pointer' : 'default' }}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-1">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                    <span className="text-xs font-medium text-white">{uploadProgress}%</span>
                  </div>
                ) : !isAuthenticated ? (
                  <Lock className="h-6 w-6 text-white" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Camera className="h-6 w-6 text-white" />
                    <span className="text-xs font-medium text-white">Upload</span>
                  </div>
                )}
              </div>
            )}

            {/* Hidden file input */}
            {canEditPhoto && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading || !isAuthenticated}
              />
            )}
          </div>

          {/* Member info */}
          <div className="w-full text-center">
            <h3 className="font-semibold text-foreground truncate">{member.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{member.role}</p>
            <Badge variant="secondary" className="mt-1 text-xs">
              {member.division}
            </Badge>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex w-full gap-2 pt-2 border-t">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(member);
                  }}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(member);
                  }}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
