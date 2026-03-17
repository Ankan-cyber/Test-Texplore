export interface UploadResult {
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

export async function uploadToCloudinary(
  file: File,
  folder: string = 'texplore-events',
  onProgress?: (progress: number) => void,
): Promise<UploadResult> {
  // Step 1: Get upload signature from server
  const signatureResponse = await fetch('/api/events/upload-signature', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      folder,
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
  formData.append('folder', folder);

  return new Promise((resolve, reject) => {
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
}

// Helper function to validate file before upload
export function validateFile(file: File): { valid: boolean; error?: string } {
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
