import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageOff, CheckCircle2 } from 'lucide-react';

interface PhotoUrlPreviewProps {
  url: string;
  name: string;
}

export default function PhotoUrlPreview({ url, name }: PhotoUrlPreviewProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Reset state when URL changes
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [url]);

  // Only show preview if URL is valid
  if (!url || !url.startsWith('https://')) {
    return null;
  }

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
          onLoad={() => setIsLoaded(true)}
        />
        <AvatarFallback className="bg-primary/10 text-primary">
          {hasError ? <ImageOff className="h-5 w-5" /> : initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium flex items-center gap-1.5">
          Preview
          {isLoaded && !hasError && (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-500" />
          )}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {hasError ? 'Unable to load image' : isLoaded ? 'Image loaded successfully' : 'Loading...'}
        </p>
      </div>
    </div>
  );
}
