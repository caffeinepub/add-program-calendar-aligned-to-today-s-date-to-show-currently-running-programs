import type { UserProfile } from '../backend';

/**
 * Returns the user's display name.
 * - If the profile has a non-empty name, returns that name.
 * - Otherwise, returns a fallback "User-XXXXX" using the first 5 chars of the principal text.
 * - If no principal is available, returns "Pengguna".
 */
export function getUserDisplayName(
  userProfile: UserProfile | null | undefined,
  principalText: string | null | undefined
): string {
  if (userProfile?.name && userProfile.name.trim().length > 0) {
    return userProfile.name.trim();
  }

  if (principalText) {
    const shortId = principalText.replace(/-/g, '').slice(0, 5).toUpperCase();
    return `User-${shortId}`;
  }

  return 'Pengguna';
}

/**
 * Returns the user's initials for avatar display.
 * Falls back to "US" if no name is available (from the fallback identifier).
 */
export function getUserInitials(
  userProfile: UserProfile | null | undefined,
  principalText: string | null | undefined
): string {
  const displayName = getUserDisplayName(userProfile, principalText);

  if (displayName.startsWith('User-') || displayName === 'Pengguna') {
    return displayName.slice(0, 2).toUpperCase();
  }

  return displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
