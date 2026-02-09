import type { Program } from '../../backend';

interface FilterState {
  division: string;
  pic: string;
  status: string;
  priority: string;
}

export function applyProgramFilters(programs: Program[], filters: FilterState): Program[] {
  return programs.filter((program) => {
    if (filters.division && program.unit !== filters.division) {
      return false;
    }
    if (filters.pic && program.personInCharge.name !== filters.pic) {
      return false;
    }
    if (filters.status && program.status !== filters.status) {
      return false;
    }
    if (filters.priority && program.priority !== filters.priority) {
      return false;
    }
    return true;
  });
}

export function countProgramsByDay(programs: Program[], date: Date): number {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  return programs.filter((p) => {
    return (
      Number(p.endDate) >= dayStart.getTime() &&
      Number(p.startDate) <= dayEnd.getTime()
    );
  }).length;
}
