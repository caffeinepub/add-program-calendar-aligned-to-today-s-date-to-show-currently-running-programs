import type { TeamMemberWithAvatar } from '../backend';

/**
 * Derive a safe, displayable image src for a team member avatar
 * Supports backend-provided ExternalBlob (prefer direct URL) and legacy https URL strings
 */
export function getTeamMemberAvatarSrc(member: TeamMemberWithAvatar): string | null {
  if (!member.avatar) {
    return null;
  }

  // If avatar is an ExternalBlob, use its direct URL
  if (typeof member.avatar === 'object' && 'getDirectURL' in member.avatar) {
    return member.avatar.getDirectURL();
  }

  return null;
}
