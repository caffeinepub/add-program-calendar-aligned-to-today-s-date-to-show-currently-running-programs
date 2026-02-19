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
    // Normalize the image (resize, compress, convert to JPEG)
    const normalizedFile = await normalizeImage(file, {
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.85,
      outputFormat: 'image/jpeg',
    });

    // Convert to ArrayBuffer
    const arrayBuffer = await normalizedFile.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Create ExternalBlob from bytes
    let blob = ExternalBlob.fromBytes(bytes);

    // Add progress tracking if callback provided
    if (onProgress) {
      blob = blob.withUploadProgress(onProgress);
    }

    return blob;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to prepare avatar for upload');
  }
}
