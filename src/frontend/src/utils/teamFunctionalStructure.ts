import type { TeamMember } from '../backend';
import type { HierarchyNode } from './teamHierarchy';

export interface DivisionGroup {
  division: string;
  members: TeamMember[];
}

/**
 * Collect all members reachable from the root hierarchy node
 */
export function collectStructureMembers(root: HierarchyNode | null): TeamMember[] {
  if (!root) return [];
  
  const collected: TeamMember[] = [root.member];
  
  function traverse(node: HierarchyNode) {
    node.children.forEach(child => {
      collected.push(child.member);
      traverse(child);
    });
  }
  
  traverse(root);
  return collected;
}

/**
 * Group members by division, normalizing division labels
 */
export function groupByDivision(members: TeamMember[]): DivisionGroup[] {
  const divisionMap = new Map<string, TeamMember[]>();
  
  members.forEach(member => {
    const normalized = member.division.trim() || 'Unassigned';
    const existing = divisionMap.get(normalized) || [];
    existing.push(member);
    divisionMap.set(normalized, existing);
  });
  
  // Convert to array and sort by division name
  const groups: DivisionGroup[] = Array.from(divisionMap.entries())
    .map(([division, members]) => ({ division, members }))
    .sort((a, b) => a.division.localeCompare(b.division));
  
  return groups;
}

/**
 * Sort members by name without mutating the input array
 */
export function sortMembersByName(members: TeamMember[]): TeamMember[] {
  return [...members].sort((a, b) => a.name.localeCompare(b.name));
}
