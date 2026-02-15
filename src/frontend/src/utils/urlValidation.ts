/**
 * Validates if a string is a valid HTTP/HTTPS URL
 * @param url The URL string to validate
 * @returns true if the URL is valid and uses http or https protocol
 */
export function isValidUrl(url: string): boolean {
  if (!url || url.trim() === '') {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates if a string is a valid HTTPS URL (secure only)
 * @param url The URL string to validate
 * @returns true if the URL is valid and uses https protocol
 */
export function isValidHttpsUrl(url: string): boolean {
  if (!url || url.trim() === '') {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
