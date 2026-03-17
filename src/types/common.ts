export interface ClubSettings {
  name: string;
  description: string;
  mission: string;
  vision: string;
  foundedYear: number;
  location: string;
  contactEmail: string;
  university_name: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  slug: string;
  startDate: string;
  endDate: string;
  location?: string;
  isOnline: boolean;
  links?: string[];
  maxCapacity?: number;
  isRegistrationOpen: boolean;
  registrationDeadline?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED' | 'ARCHIVED';
  isFeatured: boolean;
  imageUrl?: string;
  tags: string[];
  category?: string;
  departmentId?: string;
  department?: {
    id: string;
    name: string;
    displayName: string;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    registrations: number;
    attendees: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GalleryFolder {
  id: string;
  name: string;
  description?: string;
  slug: string;
  parentId?: string;
  imageCount?: number;
  isPublic: boolean;
  isArchived: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  parent?: GalleryFolder;
  children?: GalleryFolder[];
  _count?: {
    images: number;
  };
}

export interface GalleryImage {
  id: string;
  title?: string;
  description?: string;
  originalName: string;
  fileName: string;
  fileUrl: string;
  thumbnailUrl?: string;
  fileSize: number;
  mimeType: string;
  tags?: string[];
  altText?: string;
  cloudinaryId: string;
  cloudinaryData?: any;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  isPublic: boolean;
  folderId?: string;
  uploadedBy: string;
  eventId?: string;
  createdAt: string;
  updatedAt: string;
  folder?: GalleryFolder;
  uploader?: {
    id: string;
    name: string;
    email: string;
  };
  event?: {
    id: string;
    title: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
  };
}
