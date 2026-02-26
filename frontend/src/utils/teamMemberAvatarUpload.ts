import { ExternalBlob } from '../backend';
import { normalizeImage } from './imageNormalize';

/**
 * Upload a team member avatar to backend blob storage
 * Normalizes the image and converts it to ExternalBlob with progress tracking
 */
export async function uploadTeamMemberAvatar(
  file: File,
  onProgress?: (percentage: number) => void
): Promise<ExternalBlob> {
  try {
    // Report initial progress
    if (onProgress) onProgress(10);

    // Normalize the image (resize, compress, convert to JPEG)
    const normalizedFile = await normalizeImage(file, {
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.85,
      outputFormat: 'image/jpeg',
    });

    // Report progress after normalization
    if (onProgress) onProgress(30);

    // Convert File to ArrayBuffer
    const arrayBuffer = await normalizedFile.arrayBuffer();
    
    // Report progress after reading file
    if (onProgress) onProgress(50);

    // Convert to Uint8Array
    const uint8Array = new Uint8Array(arrayBuffer);

    // Report progress before creating blob
    if (onProgress) onProgress(70);

    // Create ExternalBlob with progress tracking
    const blob = ExternalBlob.fromBytes(uint8Array);
    
    // Attach progress handler if provided
    if (onProgress) {
      const blobWithProgress = blob.withUploadProgress((percentage) => {
        // Map 70-100% to the upload phase
        const mappedProgress = 70 + (percentage * 0.3);
        onProgress(Math.round(mappedProgress));
      });
      
      return blobWithProgress;
    }

    return blob;
  } catch (error) {
    // Provide user-friendly error messages
    if (error instanceof Error) {
      // Re-throw errors from normalizeImage with their messages intact
      throw error;
    }
    
    // Generic fallback for unknown errors
    throw new Error('Failed to prepare photo for upload. Please try again with a different image.');
  }
}
