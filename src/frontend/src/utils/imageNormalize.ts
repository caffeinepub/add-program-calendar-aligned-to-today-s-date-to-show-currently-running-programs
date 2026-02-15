/**
 * Client-side image normalization utility
 * Resizes, compresses, and converts images to JPEG for reliable upload
 */

interface NormalizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputFormat?: 'image/jpeg' | 'image/png';
}

const DEFAULT_OPTIONS: Required<NormalizeOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  outputFormat: 'image/jpeg',
};

/**
 * Normalize an image file for upload
 * - Resizes to max dimensions
 * - Compresses to reduce file size
 * - Converts to JPEG (or PNG if specified)
 * - Handles HEIC/HEIF conversion when possible
 * 
 * @param file Original image file
 * @param options Normalization options
 * @returns Promise resolving to normalized File
 * @throws Error with actionable message if normalization fails
 */
export async function normalizeImage(
  file: File,
  options: NormalizeOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check for HEIC/HEIF format
  const isHEIC = file.type === 'image/heic' || 
                 file.type === 'image/heif' || 
                 file.name.toLowerCase().endsWith('.heic') ||
                 file.name.toLowerCase().endsWith('.heif');

  if (isHEIC) {
    // Browser cannot decode HEIC natively - provide clear instructions
    throw new Error(
      'HEIC/HEIF format is not supported. Please use JPEG or PNG instead. ' +
      'On iOS: Open the image in Photos, tap Share, and select "Save as JPEG" or export as "Most Compatible".'
    );
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file (JPEG, PNG, GIF, WebP).');
  }

  // Check for extremely large files before processing
  const MAX_INPUT_SIZE = 50 * 1024 * 1024; // 50MB
  if (file.size > MAX_INPUT_SIZE) {
    throw new Error('Image file is too large to process. Maximum size is 50MB. Please reduce the file size before uploading.');
  }

  try {
    // Load image
    const img = await loadImage(file);

    // Calculate new dimensions maintaining aspect ratio
    let { width, height } = img;
    if (width > opts.maxWidth || height > opts.maxHeight) {
      const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    // Create canvas and draw resized image
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to create canvas context for image processing.');
    }

    // Draw with high quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    // Convert to blob
    const blob = await canvasToBlob(canvas, opts.outputFormat, opts.quality);

    // Check output size
    const MAX_OUTPUT_SIZE = 10 * 1024 * 1024; // 10MB
    if (blob.size > MAX_OUTPUT_SIZE) {
      throw new Error(
        'Image is still too large after compression. Please try a smaller image or reduce the resolution.'
      );
    }

    // Create File from blob
    const extension = opts.outputFormat === 'image/jpeg' ? 'jpg' : 'png';
    const originalName = file.name.replace(/\.[^/.]+$/, '');
    const normalizedFile = new File([blob], `${originalName}.${extension}`, {
      type: opts.outputFormat,
      lastModified: Date.now(),
    });

    return normalizedFile;
  } catch (error) {
    // Re-throw with context if it's already an Error
    if (error instanceof Error) {
      throw error;
    }
    // Generic fallback
    throw new Error('Failed to prepare image for upload. Please try a different image.');
  }
}

/**
 * Load an image file into an HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image. The file may be corrupted or in an unsupported format.'));
    };

    img.src = url;
  });
}

/**
 * Convert canvas to Blob
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert image to uploadable format.'));
        }
      },
      type,
      quality
    );
  });
}
