import { getCategoryColor } from './calendarCategoryUtils';

export default function CalendarCategoryLegend() {
  const categories = [
    { key: 'program' as const, label: 'Programs' },
    { key: 'agenda' as const, label: 'Team Agenda' },
    { key: 'kpi' as const, label: 'KPI Deadlines' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-xs font-medium text-muted-foreground">Categories:</span>
      {categories.map((category) => {
        return (
          <div key={category.key} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getCategoryColor(category.key) }}
            />
            <span className="text-xs">{category.label}</span>
          </div>
        );
      })}
    </div>
  );
}
