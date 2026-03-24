/**
 * Helper to get or create gallery folders for specific use cases
 */

export const ABOUT_PROFILE_FOLDER_NAME = 'About Member Profiles';

interface GalleryFolderNode {
  id: string;
  name: string;
  path?: string[];
  children?: GalleryFolderNode[];
}

function flattenFolderTree(nodes: GalleryFolderNode[]): GalleryFolderNode[] {
  const result: GalleryFolderNode[] = [];

  for (const node of nodes) {
    result.push(node);
    if (node.children?.length) {
      result.push(...flattenFolderTree(node.children));
    }
  }

  return result;
}

/**
 * Get all folder IDs that belong to the About Member Profiles section,
 * including nested child folders.
 */
export async function getAllAboutProfileFolderIds(): Promise<string[]> {
  try {
    const response = await fetch('/api/gallery/folders/tree');
    if (!response.ok) {
      return [];
    }

    const result = await response.json();
    const rootFolders = (result?.folders || []) as GalleryFolderNode[];
    const flatFolders = flattenFolderTree(rootFolders);

    return flatFolders
      .filter((folder) => {
        if (folder.name === ABOUT_PROFILE_FOLDER_NAME) {
          return true;
        }

        return (folder.path || []).includes(ABOUT_PROFILE_FOLDER_NAME);
      })
      .map((folder) => folder.id);
  } catch (error) {
    console.error('Error resolving About profile folder IDs:', error);
    return [];
  }
}

/**
 * Get or create the "About Member Profiles" folder for tracking member photo uploads
 */
export async function getOrCreateAboutProfileFolder(): Promise<string | null> {
  try {
    // First, try to get existing folder from visible folders
    const response = await fetch('/api/gallery/folders', {
      method: 'GET',
    });

    if (response.ok) {
      const result = await response.json();
      const folders = result.data || [];
      const existingFolder = folders.find(
        (f: any) => f.name === ABOUT_PROFILE_FOLDER_NAME,
      );

      if (existingFolder) {
        return existingFolder.id;
      }
    }

    // If folder doesn't exist, create it
    const createResponse = await fetch('/api/gallery/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: ABOUT_PROFILE_FOLDER_NAME,
        description: 'Profile photos uploaded by About members',
        isPublic: false,
      }),
    });

    if (createResponse.ok) {
      const result = await createResponse.json();
      return result.data?.id || null;
    }

    // Backward compatibility: if API still returns conflict for existing folder,
    // try fetching again and resolve by name.
    if (createResponse.status === 409) {
      const retryResponse = await fetch('/api/gallery/folders', {
        method: 'GET',
      });

      if (retryResponse.ok) {
        const retryResult = await retryResponse.json();
        const folders = retryResult.data || [];
        const existingFolder = folders.find(
          (f: any) => f.name === ABOUT_PROFILE_FOLDER_NAME,
        );

        if (existingFolder) {
          return existingFolder.id;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting or creating About profile folder:', error);
    return null;
  }
}
