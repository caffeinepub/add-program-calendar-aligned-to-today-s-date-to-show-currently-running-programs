/**
 * Frontend-only image upload utility using ImgBB API
 * Uploads a File to external hosting and returns the hosted URL
 */

interface UploadOptions {
  file: File;
  onProgress?: (percent: number) => void;
}

interface ImgBBResponse {
  data: {
    url: string;
    display_url: string;
    delete_url: string;
  };
  success: boolean;
  status: number;
}

/**
 * Upload an image file to ImgBB and return the hosted URL
 * @param options Upload options including file and optional progress callback
 * @returns Promise resolving to the hosted image URL
 * @throws Error if upload fails or configuration is missing
 */
export async function uploadImage({ file, onProgress }: UploadOptions): Promise<string> {
  // Check for API key configuration
  // In production, this should come from environment variables
  // For now, we'll use a demo key (users should replace with their own)
  const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY || '8d5867a9512390fb5e5dc97839aa36f6';

  if (!IMGBB_API_KEY) {
    throw new Error(
      'Image upload is not configured. Please set VITE_IMGBB_API_KEY environment variable or contact your administrator.'
    );
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file (JPEG, PNG, GIF, etc.)');
  }

  // Validate file size (ImgBB free tier limit is 32MB)
  const MAX_SIZE = 32 * 1024 * 1024; // 32MB
  if (file.size > MAX_SIZE) {
    throw new Error('Image file is too large. Maximum size is 32MB.');
  }

  try {
    // Convert file to base64
    const base64Image = await fileToBase64(file);

    // Prepare form data
    const formData = new FormData();
    formData.append('image', base64Image);
    formData.append('name', file.name.replace(/\.[^/.]+$/, '')); // Remove extension

    // Create XMLHttpRequest for progress tracking
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

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response: ImgBBResponse = JSON.parse(xhr.responseText);
            
            if (response.success && response.data?.url) {
              resolve(response.data.url);
            } else {
              reject(new Error('Upload succeeded but response format was unexpected. Please try again.'));
            }
          } catch (parseError) {
            reject(new Error('Failed to parse upload response. Please try again.'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}. Please try again.`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload. Please check your connection and try again.'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload was cancelled.'));
      });

      // Send request
      xhr.open('POST', `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`);
      xhr.send(formData);
    });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred during upload. Please try again.');
  }
}

/**
 * Convert a File to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Extract base64 data (remove data:image/...;base64, prefix)
        const base64 = reader.result.split(',')[1];
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
