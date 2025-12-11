/**
 * Image optimization utilities
 * Compresses and resizes images before upload
 */

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  maxSizeKB?: number; // Maximum file size in KB
}

/**
 * Optimize an image file by compressing and resizing it
 * @param file - The original image file
 * @param options - Optimization options
 * @returns A Promise that resolves to an optimized Blob
 */
export async function optimizeImage(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<Blob> {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Image optimization can only be used in the browser');
  }

  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    maxSizeKB = 500, // Default max 500KB
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          if (width > height) {
            width = Math.min(width, maxWidth);
            height = width / aspectRatio;
          } else {
            height = Math.min(height, maxHeight);
            width = height * aspectRatio;
          }
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Use high-quality image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw the image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        let currentQuality = quality;
        let attempts = 0;
        const maxAttempts = 5;

        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob'));
                return;
              }

              const sizeKB = blob.size / 1024;

              // If file is still too large, reduce quality and try again
              if (sizeKB > maxSizeKB && currentQuality > 0.3 && attempts < maxAttempts) {
                currentQuality -= 0.1;
                attempts++;
                tryCompress();
              } else {
                resolve(blob);
              }
            },
            file.type || 'image/jpeg',
            currentQuality
          );
        };

        tryCompress();
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Get image dimensions
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

