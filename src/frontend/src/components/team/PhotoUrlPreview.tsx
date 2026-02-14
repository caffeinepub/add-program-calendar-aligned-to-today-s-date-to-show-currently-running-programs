import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageOff } from 'lucide-react';

interface PhotoUrlPreviewProps {
  url: string;
  name: string;
}

export default function PhotoUrlPreview({ url, name }: PhotoUrlPreviewProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error state when URL changes
  useEffect(() => {
    setHasError(false);
  }, [url]);

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
      <Avatar className="h-12 w-12">
        <AvatarImage 
          src={url} 
          alt={name}
          onError={() => setHasError(true)}
        />
        <AvatarFallback className="bg-primary/10 text-primary">
          {hasError ? <ImageOff className="h-5 w-5" /> : initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Preview</p>
        <p className="text-xs text-muted-foreground truncate">
          {hasError ? 'Unable to load image' : 'Image loaded successfully'}
        </p>
      </div>
    </div>
  );
}
