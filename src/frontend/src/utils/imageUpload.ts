/**
 * Frontend-only image upload utility with provider-light strategy
 * Uses free anonymous upload services with graceful fallback
 * Includes client-side normalization for better compatibility
 */

import { normalizeImage } from './imageNormalize';

interface UploadOptions {
  file: File;
  onProgress?: (percent: number) => void;
}

/**
 * Upload an image file to a free hosting service and return the hosted URL
 * Automatically normalizes images (resize, compress, convert to JPEG) before upload
 * 
 * @param options Upload options including file and optional progress callback
 * @returns Promise resolving to the hosted image URL
 * @throws Error with actionable message if upload fails
 */
export async function uploadImage({ file, onProgress }: UploadOptions): Promise<string> {
  // Step 1: Normalize the image (resize, compress, convert to JPEG)
  let normalizedFile: File;
  try {
    onProgress?.(5); // Show initial progress
    normalizedFile = await normalizeImage(file, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.85,
      outputFormat: 'image/jpeg',
    });
    onProgress?.(10); // Normalization complete
  } catch (error) {
    // Normalization errors are already user-friendly
    throw error;
  }

  // Step 2: Validate normalized file size
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (normalizedFile.size > MAX_SIZE) {
    throw new Error('Image is too large even after compression. Please try a smaller image.');
  }

  // Step 3: Check if ImgBB is configured
  const imgbbKey = import.meta.env.VITE_IMGBB_API_KEY;
  const hasImgBBKey = imgbbKey && 
                      imgbbKey !== 'YOUR_IMGBB_KEY_HERE' && 
                      imgbbKey.trim().length > 0;

  // Step 4: Try upload with appropriate provider(s)
  if (hasImgBBKey) {
    // Try ImgBB first, then fallback to Imgur
    try {
      return await uploadToImgBB(normalizedFile, onProgress);
    } catch (imgbbError) {
      console.warn('ImgBB upload failed, trying Imgur fallback:', imgbbError);
      
      try {
        return await uploadToImgur(normalizedFile, onProgress);
      } catch (imgurError) {
        console.error('All upload services failed:', { imgbbError, imgurError });
        throw new Error('Unable to upload image. Please check your connection and try again.');
      }
    }
  } else {
    // Skip ImgBB, use Imgur directly
    try {
      return await uploadToImgur(normalizedFile, onProgress);
    } catch (imgurError) {
      console.error('Imgur upload failed:', imgurError);
      
      // Provide specific error messages based on failure type
      const errorMsg = imgurError instanceof Error ? imgurError.message : '';
      if (errorMsg.includes('status 400') || errorMsg.includes('status 403')) {
        throw new Error('Upload service rejected the image. Please try a different image.');
      } else if (errorMsg.includes('network') || errorMsg.includes('Network')) {
        throw new Error('Network error. Please check your connection and try again.');
      } else {
        throw new Error('Unable to upload image. Please try again or contact support.');
      }
    }
  }
}

/**
 * Upload to ImgBB (primary service when configured)
 */
async function uploadToImgBB(file: File, onProgress?: (percent: number) => void): Promise<string> {
  const API_KEY = import.meta.env.VITE_IMGBB_API_KEY || '';
  
  // Convert file to base64
  const base64Image = await fileToBase64(file);

  // Prepare form data
  const formData = new FormData();
  formData.append('image', base64Image);
  formData.append('name', file.name.replace(/\.[^/.]+$/, ''));

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress (starts from 10% after normalization)
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const uploadPercent = Math.round((e.loaded / e.total) * 90); // 10-100%
          onProgress(10 + uploadPercent);
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.success && response.data?.url) {
            onProgress?.(100);
            resolve(response.data.url);
          } else {
            reject(new Error('ImgBB response format unexpected'));
          }
        } catch (e) {
          reject(new Error('Failed to parse ImgBB response'));
        }
      } else {
        reject(new Error(`ImgBB upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('ImgBB network error'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    xhr.open('POST', `https://api.imgbb.com/1/upload?key=${API_KEY}`);
    xhr.send(formData);
  });
}

/**
 * Upload to Imgur (fallback service - no API key required for anonymous uploads)
 */
async function uploadToImgur(file: File, onProgress?: (percent: number) => void): Promise<string> {
  // Imgur allows anonymous uploads with their public client ID
  const CLIENT_ID = 'c898c0bb848ca39';

  // Convert file to base64
  const base64Image = await fileToBase64(file);

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress (starts from 10% after normalization)
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const uploadPercent = Math.round((e.loaded / e.total) * 90); // 10-100%
          onProgress(10 + uploadPercent);
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.success && response.data?.link) {
            onProgress?.(100);
            resolve(response.data.link);
          } else {
            reject(new Error('Imgur response format unexpected'));
          }
        } catch (e) {
          reject(new Error('Failed to parse Imgur response'));
        }
      } else {
        let errorDetail = '';
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          errorDetail = errorResponse.data?.error || '';
        } catch (e) {
          // Ignore parse error
        }
        reject(new Error(`Imgur upload failed with status ${xhr.status}${errorDetail ? ': ' + errorDetail : ''}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Imgur network error'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    xhr.open('POST', 'https://api.imgur.com/3/image');
    xhr.setRequestHeader('Authorization', `Client-ID ${CLIENT_ID}`);
    
    const formData = new FormData();
    formData.append('image', base64Image);
    formData.append('type', 'base64');
    
    xhr.send(formData);
  });
}

/**
 * Convert a File to base64 string (without data URI prefix)
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Extract base64 data (remove data:image/...;base64, prefix)
        const base64 = reader.result.split(',')[1];
        if (!base64) {
          reject(new Error('Failed to extract base64 data'));
          return;
        }
        resolve(base64);
      } else {
        reject(new Error('Failed to read file as base64'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}
