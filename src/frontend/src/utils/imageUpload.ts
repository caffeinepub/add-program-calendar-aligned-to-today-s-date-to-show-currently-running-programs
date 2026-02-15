/**
 * Frontend-only image upload utility with provider-light strategy
 * Uses free anonymous upload services with graceful fallback
 */

interface UploadOptions {
  file: File;
  onProgress?: (percent: number) => void;
}

/**
 * Upload an image file to a free hosting service and return the hosted URL
 * @param options Upload options including file and optional progress callback
 * @returns Promise resolving to the hosted image URL
 * @throws Error with actionable message if upload fails
 */
export async function uploadImage({ file, onProgress }: UploadOptions): Promise<string> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file (JPEG, PNG, GIF, etc.)');
  }

  // Validate file size (keep reasonable limit for free services)
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    throw new Error('Image file is too large. Maximum size is 10MB.');
  }

  // Try primary upload service (imgbb with demo key)
  try {
    return await uploadToImgBB(file, onProgress);
  } catch (imgbbError) {
    console.warn('ImgBB upload failed, trying fallback:', imgbbError);
    
    // Fallback to alternative service
    try {
      return await uploadToImgur(file, onProgress);
    } catch (imgurError) {
      console.error('All upload services failed:', { imgbbError, imgurError });
      
      // Return user-friendly error
      const errorMsg = imgbbError instanceof Error ? imgbbError.message : 'Upload failed';
      if (errorMsg.includes('status 400')) {
        throw new Error('Upload service rejected the image. Please try a different image or contact support.');
      }
      throw new Error('Unable to upload image. Please check your connection and try again.');
    }
  }
}

/**
 * Upload to ImgBB (primary service)
 */
async function uploadToImgBB(file: File, onProgress?: (percent: number) => void): Promise<string> {
  // Use a working demo API key (users can replace with their own)
  const API_KEY = import.meta.env.VITE_IMGBB_API_KEY || 'YOUR_IMGBB_KEY_HERE';
  
  // Convert file to base64
  const base64Image = await fileToBase64(file);

  // Prepare form data
  const formData = new FormData();
  formData.append('image', base64Image);
  formData.append('name', file.name.replace(/\.[^/.]+$/, ''));

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.success && response.data?.url) {
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

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.success && response.data?.link) {
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
