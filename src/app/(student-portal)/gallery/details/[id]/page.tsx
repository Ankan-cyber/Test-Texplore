'use client';
import { useParams } from 'next/navigation';
import FolderDetailsBySlug from '@/components/GalleryFolderDetails';

export default function GalleryFolderDetailsByIdPage() {
  const params = useParams();
  const id = params.id as string;
  // Reuse folder-by-slug component by letting the API handle id lookup via the id route
  // We will call folder by ID inside the component if slug API is not present
  return <FolderDetailsBySlug slug={id} />;
}
