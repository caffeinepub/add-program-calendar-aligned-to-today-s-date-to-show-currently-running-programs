export function getStatusConfig(status: string) {
  const statusMap = {
    planning: { label: 'Planning', variant: 'secondary' as const },
    ongoing: { label: 'Ongoing', variant: 'default' as const },
    completed: { label: 'Completed', variant: 'outline' as const },
  };
  return statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
}

export function getPriorityConfig(priority: string) {
  const priorityMap = {
    high: { 
      label: 'High', 
      className: 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50' 
    },
    middle: { 
      label: 'Medium', 
      className: 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50' 
    },
    low: { 
      label: 'Low', 
      className: 'bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800/50' 
    },
  };
  return priorityMap[priority as keyof typeof priorityMap] || { 
    label: priority, 
    className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-900/40 dark:text-gray-300 border border-gray-200 dark:border-gray-800/50' 
  };
}
