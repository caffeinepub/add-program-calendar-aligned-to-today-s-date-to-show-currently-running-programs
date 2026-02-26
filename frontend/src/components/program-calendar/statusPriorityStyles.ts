export function getStatusConfig(status: string) {
  const statusMap = {
    planning: { label: 'Planning', variant: 'secondary' as const },
    ongoing: { label: 'Ongoing', variant: 'default' as const },
    completed: { label: 'Completed', variant: 'outline' as const },
  };
  return statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
}

export function getPriorityConfig(priority: string) {
  // Light mode: use green and blue colors only
  // Dark mode: maintain readability with adjusted colors
  const priorityMap = {
    high: { 
      label: 'High', 
      className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/50' 
    },
    middle: { 
      label: 'Medium', 
      className: 'bg-teal-100 text-teal-800 hover:bg-teal-200 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-300 dark:border-teal-800/50' 
    },
    low: { 
      label: 'Low', 
      className: 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-300 dark:border-blue-800/50' 
    },
  };
  return priorityMap[priority as keyof typeof priorityMap] || { 
    label: priority, 
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/50 dark:text-gray-300 border border-gray-300 dark:border-gray-800/50' 
  };
}
