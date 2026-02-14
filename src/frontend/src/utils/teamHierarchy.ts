import type { TeamMember } from '../backend';

export interface HierarchyNode {
  member: TeamMember;
  children: HierarchyNode[];
}

export interface HierarchyResult {
  root: HierarchyNode | null;
  orphans: HierarchyNode[];
  warnings: string[];
}

export function buildHierarchy(members: TeamMember[]): HierarchyResult {
  const warnings: string[] = [];
  const nodeMap = new Map<string, HierarchyNode>();
  
  // Create nodes for all members
  members.forEach(member => {
    nodeMap.set(member.id.toString(), {
      member,
      children: [],
    });
  });

  // Find roots (members with no manager)
  const roots: HierarchyNode[] = [];
  const orphans: HierarchyNode[] = [];

  members.forEach(member => {
    const node = nodeMap.get(member.id.toString());
    if (!node) return;

    if (member.managerId === undefined) {
      // This is a root (director)
      roots.push(node);
    } else {
      // Find parent and add as child
      const parentNode = nodeMap.get(member.managerId.toString());
      if (parentNode) {
        // Check for cycles
        if (!hasCycle(member, members, new Set())) {
          parentNode.children.push(node);
        } else {
          warnings.push(`Cycle detected for ${member.name}`);
          orphans.push(node);
        }
      } else {
        // Manager not found
        warnings.push(`Manager not found for ${member.name}`);
        orphans.push(node);
      }
    }
  });

  // Validate hierarchy
  if (roots.length === 0) {
    warnings.push('No director found. Please assign at least one member with no manager.');
    return { root: null, orphans: Array.from(nodeMap.values()), warnings };
  }

  if (roots.length > 1) {
    warnings.push(`Multiple directors found (${roots.length}). Consider having a single top-level director.`);
  }

  return {
    root: roots[0] || null,
    orphans: roots.length > 1 ? roots.slice(1).concat(orphans) : orphans,
    warnings,
  };
}

function hasCycle(member: TeamMember, allMembers: TeamMember[], visited: Set<string>): boolean {
  if (visited.has(member.id.toString())) {
    return true;
  }

  if (member.managerId === undefined) {
    return false;
  }

  visited.add(member.id.toString());
  const manager = allMembers.find(m => m.id === member.managerId);
  
  if (!manager) {
    return false;
  }

  return hasCycle(manager, allMembers, visited);
}

export function detectHierarchyIssues(members: TeamMember[]): string[] {
  const issues: string[] = [];

  members.forEach(member => {
    // Check for self-reference
    if (member.managerId !== undefined && member.managerId === member.id) {
      issues.push(`${member.name} is set as their own manager`);
    }

    // Check for invalid manager reference
    if (member.managerId !== undefined) {
      const managerExists = members.some(m => m.id === member.managerId);
      if (!managerExists) {
        issues.push(`${member.name} has an invalid manager reference`);
      }
    }
  });

  return issues;
}
