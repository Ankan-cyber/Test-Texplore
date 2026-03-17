export interface UploadProgressCallback {
  (progress: number): void;
}

export interface UploadResult {
  success: boolean;
  data?: any;
  error?: string;
}

export const uploadFileWithProgress = (
  url: string,
  formData: FormData,
  onProgress?: UploadProgressCallback,
): Promise<UploadResult> => {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    // Handle response
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({ success: true, data });
        } catch (error) {
          resolve({ success: true, data: xhr.responseText });
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          resolve({ success: false, error: error.message || 'Upload failed' });
        } catch (error) {
          resolve({
            success: false,
            error: `Upload failed with status ${xhr.status}`,
          });
        }
      }
    });

    // Handle network errors
    xhr.addEventListener('error', () => {
      resolve({ success: false, error: 'Network error occurred' });
    });

    // Handle timeout
    xhr.addEventListener('timeout', () => {
      resolve({ success: false, error: 'Upload timed out' });
    });

    // Open and send request
    xhr.open('POST', url);
    xhr.send(formData);
  });
};

export const createFilePreview = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const validateImageFile = (
  file: File,
): { valid: boolean; error?: string } => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File must be an image' };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  return { valid: true };
};
