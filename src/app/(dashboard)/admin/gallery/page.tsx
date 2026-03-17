import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { canUploadPhotos, canReadGallery } from '@/lib/permissions';
import { GalleryManager } from '@/components/GalleryManagement';

export default async function GalleryPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  // Check if user can access gallery (read or upload)
  if (!canReadGallery(user.permissions) && !canUploadPhotos(user.permissions)) {
    redirect('/admin/unauthorized');
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gallery Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Upload, organize, and manage club media and images with folder
            structure
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <GalleryManager user={user} />
      </div>
    </div>
  );
}
