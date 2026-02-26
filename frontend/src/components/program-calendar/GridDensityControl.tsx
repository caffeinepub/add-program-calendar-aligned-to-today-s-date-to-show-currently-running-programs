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
    <div className="flex items-center gap-0.5 rounded border bg-background p-0.5">
      <Button
        variant={density === 'comfortable' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onDensityChange('comfortable')}
        className="h-7 px-2"
        title="Comfortable spacing"
      >
        <LayoutGrid className="h-3.5 w-3.5 mr-1" />
        <span className="hidden sm:inline text-xs">Comfortable</span>
      </Button>
      <Button
        variant={density === 'compact' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onDensityChange('compact')}
        className="h-7 px-2"
        title="Compact spacing"
      >
        <LayoutList className="h-3.5 w-3.5 mr-1" />
        <span className="hidden sm:inline text-xs">Compact</span>
      </Button>
    </div>
  );
}
