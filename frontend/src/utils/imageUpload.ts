import { normalizeImage } from './imageNormalize';

/**
 * Provider-light image upload utility with automatic client-side normalization
 * Note: This utility is deprecated for team member photos. Use backend blob storage instead.
 * Kept for backward compatibility with other features.
 */

interface UploadOptions {
  onProgress?: (percentage: number) => void;
}

interface UploadResult {
  url: string;
  provider: 'imgbb' | 'none';
}

/**
 * Upload an image file to external hosting
 * @deprecated For team member photos, use backend blob storage via useSetTeamMemberAvatar
 */
export async function uploadImage(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { onProgress } = options;

  try {
    // Normalize image first
    onProgress?.(10);
    const normalizedFile = await normalizeImage(file);
    onProgress?.(30);

    // Check if ImgBB is configured
    const imgbbKey = import.meta.env.VITE_IMGBB_API_KEY;
    
    if (!imgbbKey) {
      throw new Error(
        'Image upload is not configured. Please use backend blob storage for team member photos.'
      );
    }

    // Upload to ImgBB
    const formData = new FormData();
    formData.append('image', normalizedFile);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = 30 + Math.round((e.loaded / e.total) * 70);
          onProgress?.(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.data?.url) {
              onProgress?.(100);
              resolve({
                url: response.data.url,
                provider: 'imgbb',
              });
            } else {
              reject(new Error('Invalid response from image hosting service'));
            }
          } catch (error) {
            reject(new Error('Failed to parse upload response'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      xhr.open('POST', `https://api.imgbb.com/1/upload?key=${imgbbKey}`);
      xhr.send(formData);
    });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to upload image');
  }
}
