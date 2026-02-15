import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, Trash2, User, Upload, Loader2 } from 'lucide-react';
import type { TeamMember } from '../../backend';
import { uploadImage } from '../../utils/imageUpload';
import { isValidUrl } from '../../utils/urlValidation';
import { useUpdateTeamMember } from '../../hooks/useQueries';
import { toast } from 'sonner';

interface TeamMemberCardProps {
  member: TeamMember;
  onEdit?: (member: TeamMember) => void;
  onDelete?: (member: TeamMember) => void;
  onClick?: (member: TeamMember) => void;
  canEditPhoto?: boolean;
}

export default function TeamMemberCard({ 
  member, 
  onEdit, 
  onDelete, 
  onClick,
  canEditPhoto = false 
}: TeamMemberCardProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateMutation = useUpdateTeamMember();

  const initials = member.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Validate avatar URL before using - must be https
  const hasValidAvatar = member.avatar && isValidUrl(member.avatar) && member.avatar.startsWith('https://');

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canEditPhoto && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload the image
      const uploadedUrl = await uploadImage({
        file,
        onProgress: (percent) => setUploadProgress(percent),
      });

      // Validate the uploaded URL
      if (!uploadedUrl || !uploadedUrl.startsWith('https://')) {
        throw new Error('Invalid URL returned from upload service');
      }

      // Update the team member with the new avatar
      await updateMutation.mutateAsync({
        id: member.id,
        member: {
          ...member,
          avatar: uploadedUrl,
        },
      });

      toast.success('Photo updated successfully');
    } catch (error) {
      console.error('Photo upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload photo';
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset file input to allow re-selecting the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick?.(member)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar with click-to-upload */}
          <div className="relative flex-shrink-0">
            <Avatar 
              className={`h-20 w-20 rounded-lg ${canEditPhoto && !isUploading ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
              onClick={handleAvatarClick}
            >
              {hasValidAvatar ? (
                <AvatarImage src={member.avatar} alt={member.name} className="rounded-lg" />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary rounded-lg text-lg">
                {initials || <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            
            {/* Upload indicator overlay */}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                <div className="text-center text-white">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-1" />
                  <span className="text-xs font-medium">{uploadProgress}%</span>
                </div>
              </div>
            )}

            {/* Upload hint icon */}
            {canEditPhoto && !isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 rounded-lg transition-colors opacity-0 hover:opacity-100">
                <Upload className="h-6 w-6 text-white drop-shadow-lg" />
              </div>
            )}

            {/* Hidden file input */}
            {canEditPhoto && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{member.name}</h3>
            <p className="text-xs text-muted-foreground truncate">{member.role}</p>
            <Badge variant="secondary" className="mt-1.5 text-xs">
              {member.division}
            </Badge>
          </div>

          {(onEdit || onDelete) && (
            <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(member)}
                  title="Edit member"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => onDelete(member)}
                  title="Delete member"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
