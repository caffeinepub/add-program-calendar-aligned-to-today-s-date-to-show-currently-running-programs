import type { TeamMemberWithAvatar } from '../backend';
import type { HierarchyNode } from './teamHierarchy';

export interface DivisionGroup {
  division: string;
  members: TeamMemberWithAvatar[];
}

/**
 * Collect all members from a hierarchy tree (depth-first)
 */
export function collectStructureMembers(node: HierarchyNode | null): TeamMemberWithAvatar[] {
  if (!node) return [];
  
  const members: TeamMemberWithAvatar[] = [node.member];
  
  node.children.forEach(child => {
    members.push(...collectStructureMembers(child));
  });
  
  return members;
}

/**
 * Group members by their division
 */
export function groupByDivision(members: TeamMemberWithAvatar[]): DivisionGroup[] {
  const divisionMap = new Map<string, TeamMemberWithAvatar[]>();
  
  members.forEach(member => {
    const division = member.division.trim();
    if (!division) return; // Skip empty divisions
    
    if (!divisionMap.has(division)) {
      divisionMap.set(division, []);
    }
    divisionMap.get(division)!.push(member);
  });
  
  // Convert to array and sort by division name
  return Array.from(divisionMap.entries())
    .map(([division, members]) => ({ division, members }))
    .sort((a, b) => a.division.localeCompare(b.division));
}

/**
 * Sort members by name (case-insensitive)
 */
export function sortMembersByName(members: TeamMemberWithAvatar[]): TeamMemberWithAvatar[] {
  return [...members].sort((a, b) => 
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );
}
