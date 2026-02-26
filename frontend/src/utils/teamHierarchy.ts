import type { TeamMemberWithAvatar } from '../backend';

export interface HierarchyNode {
  member: TeamMemberWithAvatar;
  children: HierarchyNode[];
}

export interface HierarchyResult {
  root: HierarchyNode | null;
  orphans: HierarchyNode[];
  warnings: string[];
}

/**
 * Build a hierarchy tree from a flat list of team members
 */
export function buildHierarchy(members: TeamMemberWithAvatar[]): HierarchyResult {
  const warnings: string[] = [];
  const nodeMap = new Map<bigint, HierarchyNode>();
  
  // Create nodes for all members
  members.forEach(member => {
    nodeMap.set(member.id, { member, children: [] });
  });

  let root: HierarchyNode | null = null;
  const orphans: HierarchyNode[] = [];

  // Build parent-child relationships
  members.forEach(member => {
    const node = nodeMap.get(member.id)!;
    
    if (member.managerId === undefined) {
      // This is a root node (no manager)
      if (root !== null) {
        warnings.push(`Multiple root nodes detected: ${root.member.name} and ${member.name}`);
      } else {
        root = node;
      }
    } else {
      // Has a manager - try to attach to parent
      const parentNode = nodeMap.get(member.managerId);
      if (parentNode) {
        parentNode.children.push(node);
      } else {
        warnings.push(`Manager not found for ${member.name} (manager ID: ${member.managerId})`);
        orphans.push(node);
      }
    }
  });

  return { root, orphans, warnings };
}

/**
 * Detect circular references and other hierarchy issues
 */
export function detectHierarchyIssues(members: TeamMemberWithAvatar[]): string[] {
  const issues: string[] = [];
  
  members.forEach(member => {
    if (member.managerId === undefined) return;
    
    // Check for self-reference
    if (member.managerId === member.id) {
      issues.push(`${member.name} is set as their own manager`);
      return;
    }

    // Check for circular references by traversing up the chain
    const visited = new Set<bigint>();
    let currentId: bigint | undefined = member.managerId;
    
    while (currentId !== undefined) {
      if (visited.has(currentId)) {
        issues.push(`Circular manager reference detected involving ${member.name}`);
        break;
      }
      
      visited.add(currentId);
      const manager = members.find(m => m.id === currentId);
      
      if (!manager) break;
      currentId = manager.managerId;
      
      // Prevent infinite loops
      if (visited.size > members.length) {
        issues.push(`Infinite loop detected in manager chain for ${member.name}`);
        break;
      }
    }
  });

  return issues;
}
