import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  format?: string;
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

export interface CloudinaryImageData {
  public_id: string;
  url: string;
  thumbnail_url: string;
  width: number;
  height: number;
  format: string;
  size: number;
  created_at: string;
}

// Generate upload signature for client-side uploads
export function generateUploadSignature(params: {
  folder?: string;
  public_id?: string;
  overwrite?: boolean;
  resource_type?: string;
}) {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder: params.folder || 'texplore-gallery',
      public_id: params.public_id,
      overwrite: params.overwrite || false,
      resource_type: params.resource_type || 'image',
    },
    process.env.CLOUDINARY_API_SECRET!,
  );

  return {
    signature,
    timestamp,
    api_key: process.env.CLOUDINARY_API_KEY,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  };
}

export type CloudinaryResourceType = 'image' | 'raw' | 'video' | 'auto';

// Upload generic file to Cloudinary.
export async function uploadFile(
  file: Buffer | string,
  options: {
    folder?: string;
    public_id?: string;
    transformation?: any;
    tags?: string[];
    resourceType?: CloudinaryResourceType;
  } = {},
): Promise<CloudinaryUploadResult> {
  const uploadOptions = {
    folder: options.folder || 'texplore-gallery',
    public_id: options.public_id,
    transformation: options.transformation,
    tags: options.tags,
    resource_type: options.resourceType || 'auto',
  };

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result as unknown as CloudinaryUploadResult);
        }
      },
    );

    if (typeof file === 'string') {
      uploadStream.end(file);
    } else {
      uploadStream.end(file);
    }
  });
}

// Upload image to Cloudinary
export async function uploadImage(
  file: Buffer | string,
  options: {
    folder?: string;
    public_id?: string;
    transformation?: any;
    tags?: string[];
  } = {},
): Promise<CloudinaryUploadResult> {
  return uploadFile(file, {
    ...options,
    resourceType: 'image',
  });
}

// Generate thumbnail URL
export function getThumbnailUrl(
  publicId: string,
  width: number = 300,
  height: number = 300,
): string {
  return cloudinary.url(publicId, {
    transformation: [
      { width, height, crop: 'fill', gravity: 'auto' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });
}

// Generate optimized image URL
export function getOptimizedUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
  } = {},
): string {
  return cloudinary.url(publicId, {
    transformation: [
      {
        width: options.width,
        height: options.height,
        crop: options.crop || 'scale',
        quality: options.quality || 'auto',
        fetch_format: options.format || 'auto',
      },
    ],
  });
}

// Delete image from Cloudinary
export async function deleteImage(
  publicId: string,
): Promise<{ result: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result as { result: string });
      }
    });
  });
}

// Get image information
export async function getImageInfo(publicId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    cloudinary.api.resource(publicId, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}

// Create folder structure in Cloudinary
export function createFolderPath(folderPath: string): string {
  return `texplore-gallery/${folderPath}`
    .replace(/\/+/g, '/')
    .replace(/\/$/, '');
}

// Extract folder path from public_id
export function extractFolderPath(publicId: string): string {
  const parts = publicId.split('/');
  parts.pop(); // Remove filename
  return parts.join('/').replace('texplore-gallery/', '');
}

export default cloudinary;
