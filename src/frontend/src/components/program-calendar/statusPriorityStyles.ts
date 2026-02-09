export function getStatusConfig(status: string) {
  const statusMap = {
    planning: { label: 'Perencanaan', variant: 'secondary' as const },
    ongoing: { label: 'Berjalan', variant: 'default' as const },
    completed: { label: 'Selesai', variant: 'outline' as const },
  };
  return statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
}

export function getPriorityConfig(priority: string) {
  const priorityMap = {
    high: { 
      label: 'Tinggi', 
      className: 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800' 
    },
    middle: { 
      label: 'Sedang', 
      className: 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800' 
    },
    low: { 
      label: 'Rendah', 
      className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
    },
  };
  return priorityMap[priority as keyof typeof priorityMap] || { 
    label: priority, 
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300' 
  };
}
