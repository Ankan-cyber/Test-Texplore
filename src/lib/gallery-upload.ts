export interface GalleryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  bytes: number;
  created_at: string;
  etag: string;
  placeholder: boolean;
  url: string;
  version: number;
  version_id: string;
  signature: string;
  original_filename: string;
}

export interface GalleryImageData {
  id: string;
  originalName: string;
  fileName: string;
  fileUrl: string;
  thumbnailUrl: string;
  fileSize: number;
  mimeType: string;
  title: string;
  cloudinaryId: string;
  uploadedBy: {
    id: string;
    name: string;
    email: string;
  };
  folder?: {
    id: string;
    name: string;
    slug: string;
  };
}

export async function uploadGalleryImage(
  file: File,
  folderId?: string,
  onProgress?: (progress: number) => void,
): Promise<GalleryImageData> {
  // Generate unique filename
  const timestamp = Date.now();
  const fileExtension = file.name.split('.').pop();
  const uniqueFileName = `${timestamp}_${Math.random().toString(36).substring(2)}.${fileExtension}`;

  // Step 1: Get upload signature from server
  const signatureResponse = await fetch('/api/gallery/upload-signature', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      folderId,
      fileName: uniqueFileName,
    }),
  });

  if (!signatureResponse.ok) {
    const error = await signatureResponse.json();
    throw new Error(error.error || 'Failed to get upload signature');
  }

  const signature = await signatureResponse.json();

  // Step 2: Upload directly to Cloudinary
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signature.api_key);
  formData.append('timestamp', signature.timestamp.toString());
  formData.append('signature', signature.signature);
  formData.append('public_id', uniqueFileName);

  const uploadResult = await new Promise<GalleryUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Progress tracking
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });
    }

    // Handle response
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const result = JSON.parse(xhr.responseText);
          resolve(result);
        } catch (error) {
          reject(new Error('Invalid response from Cloudinary'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error?.message || 'Upload failed'));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was aborted'));
    });

    // Send the request
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${signature.cloud_name}/image/upload`);
    xhr.send(formData);
  });

  // Step 3: Save to database
  const saveResponse = await fetch('/api/gallery/images', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      originalName: file.name,
      fileName: uniqueFileName,
      fileUrl: uploadResult.secure_url,
      fileSize: uploadResult.bytes,
      mimeType: file.type,
      folderId: folderId || null,
      title: file.name,
      cloudinaryId: uploadResult.public_id,
      cloudinaryData: uploadResult,
    }),
  });

  if (!saveResponse.ok) {
    const error = await saveResponse.json();
    throw new Error(error.error || 'Failed to save image to database');
  }

  const imageData: GalleryImageData = await saveResponse.json();
  return imageData;
}

export async function uploadMultipleGalleryImages(
  files: File[],
  folderId?: string,
  onProgress?: (overallProgress: number, currentFile: number, totalFiles: number) => void,
): Promise<GalleryImageData[]> {
  const results: GalleryImageData[] = [];
  const totalFiles = files.length;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const result = await uploadGalleryImage(
        file,
        folderId,
        (fileProgress) => {
          if (onProgress) {
            const overallProgress = ((i + fileProgress / 100) / totalFiles) * 100;
            onProgress(overallProgress, i + 1, totalFiles);
          }
        }
      );
      results.push(result);
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error);
      // Continue with other files even if one fails
    }
  }

  return results;
}

// Helper function to validate file before upload
export function validateGalleryFile(file: File): { valid: boolean; error?: string } {
  // Check file size (max 50MB for client-side upload)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 50MB' };
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, WebP, and GIF files are allowed' };
  }

  return { valid: true };
}
