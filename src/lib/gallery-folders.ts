import { createFolderPath } from './cloudinary';
import { prisma } from './db';

export const DEFAULT_GALLERY_FOLDER_PATH = 'texplore-gallery';

export class GalleryFolderNotFoundError extends Error {
  constructor(folderId: string) {
    super(`Folder not found: ${folderId}`);
    this.name = 'GalleryFolderNotFoundError';
  }
}

export async function getFolderHierarchy(folderId: string): Promise<string[]> {
  const hierarchy: string[] = [];
  let currentFolderId = folderId;

  while (currentFolderId) {
    const folder = await prisma.galleryFolder.findUnique({
      where: { id: currentFolderId },
      select: { name: true, parentId: true },
    });

    if (!folder) {
      break;
    }

    hierarchy.unshift(folder.name);
    currentFolderId = folder.parentId || '';
  }

  return hierarchy;
}

export async function getCloudinaryFolderPath(
  folderId?: string | null,
): Promise<string> {
  if (!folderId) {
    return DEFAULT_GALLERY_FOLDER_PATH;
  }

  const folder = await prisma.galleryFolder.findUnique({
    where: { id: folderId },
    select: { id: true },
  });

  if (!folder) {
    throw new GalleryFolderNotFoundError(folderId);
  }

  const folderHierarchy = await getFolderHierarchy(folder.id);
  return createFolderPath(folderHierarchy.join('/'));
}
