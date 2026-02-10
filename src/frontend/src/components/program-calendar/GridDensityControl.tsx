import { Button } from '@/components/ui/button';
import { LayoutGrid, LayoutList } from 'lucide-react';

type GridDensity = 'comfortable' | 'compact';

interface GridDensityControlProps {
  density: GridDensity;
  onDensityChange: (density: GridDensity) => void;
}

export default function GridDensityControl({
  density,
  onDensityChange,
}: GridDensityControlProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border bg-background p-1">
      <Button
        variant={density === 'comfortable' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onDensityChange('comfortable')}
        className="h-9 px-3"
        title="Comfortable spacing"
      >
        <LayoutGrid className="h-4 w-4 mr-1.5" />
        <span className="hidden sm:inline">Comfortable</span>
      </Button>
      <Button
        variant={density === 'compact' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onDensityChange('compact')}
        className="h-9 px-3"
        title="Compact spacing"
      >
        <LayoutList className="h-4 w-4 mr-1.5" />
        <span className="hidden sm:inline">Compact</span>
      </Button>
    </div>
  );
}
