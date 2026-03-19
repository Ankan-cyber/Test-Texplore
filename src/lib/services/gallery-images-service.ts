import { type Prisma } from '@prisma/client';
import { type User } from '@/lib/auth';
import { type GalleryImagesListQuery } from '@/lib/api-schemas';
import { deleteImage } from '@/lib/cloudinary';
import { prisma } from '@/lib/db';
import { assertCanManageGalleryImage } from '@/lib/policies';
import { z } from 'zod';
import { ServiceError } from './service-error';

export const createImageSchema = z.object({
  originalName: z.string().min(1),
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  fileSize: z.number().positive(),
  mimeType: z.string().min(1),
  cloudinaryId: z.string().min(1),
  cloudinaryData: z.any().optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  altText: z.string().optional(),
  folderId: z.string().optional(),
  eventId: z.string().optional(),
});

export const updateImageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  altText: z.string().optional(),
  folderId: z.string().optional(),
  eventId: z.string().optional(),
});

type CreateImageInput = z.infer<typeof createImageSchema>;
type UpdateImageInput = z.infer<typeof updateImageSchema>;

function buildImageWhere(query: GalleryImagesListQuery): Prisma.GalleryImageWhereInput {
  const where: Prisma.GalleryImageWhereInput = {};

  if (query.folderId) {
    where.folderId = query.folderId;
  }

  if (query.eventId) {
    where.eventId = query.eventId;
  }

  if (query.uploaderId) {
    where.uploadedBy = query.uploaderId;
  }

  if (query.status && query.status !== 'all') {
    where.isApproved = query.status === 'approved';
  } else if (query.isApproved !== undefined) {
    where.isApproved = query.isApproved;
  }

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
      { originalName: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.tags) {
    where.tags = {
      hasSome: query.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    };
  }

  return where;
}

export async function listGalleryImages(query: GalleryImagesListQuery) {
  const where = buildImageWhere(query);
  const skip = (query.page - 1) * query.limit;

  const [images, total] = await Promise.all([
    prisma.galleryImage.findMany({
      where,
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        [query.sortBy]: query.sortOrder,
      },
      skip,
      take: query.limit,
    }),
    prisma.galleryImage.count({ where }),
  ]);

  return {
    images,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    },
  };
}

export async function createGalleryImage(user: User, input: CreateImageInput) {
  if (input.folderId) {
    const folder = await prisma.galleryFolder.findUnique({
      where: { id: input.folderId },
      select: { id: true },
    });

    if (!folder) {
      throw new ServiceError('Folder not found', 404);
    }
  }

  if (input.eventId) {
    const event = await prisma.event.findUnique({
      where: { id: input.eventId },
      select: { id: true },
    });

    if (!event) {
      throw new ServiceError('Event not found', 404);
    }
  }

  const image = await prisma.galleryImage.create({
    data: {
      ...input,
      uploadedBy: user.id,
    },
    include: {
      uploader: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      folder: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      event: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  return image;
}

export async function getGalleryImageById(imageId: string) {
  const image = await prisma.galleryImage.findUnique({
    where: {
      id: imageId,
    },
    include: {
      uploader: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      folder: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      event: {
        select: {
          id: true,
          title: true,
          description: true,
          startDate: true,
          endDate: true,
          location: true,
        },
      },
    },
  });

  if (!image) {
    throw new ServiceError('Image not found', 404);
  }

  return image;
}

export async function updateGalleryImage(
  imageId: string,
  user: User,
  input: UpdateImageInput,
) {
  const existingImage = await prisma.galleryImage.findUnique({
    where: { id: imageId },
  });

  if (!existingImage) {
    throw new ServiceError('Image not found', 404);
  }

  assertCanManageGalleryImage(user, { uploadedBy: existingImage.uploadedBy });

  if (input.folderId) {
    const folder = await prisma.galleryFolder.findUnique({
      where: { id: input.folderId },
      select: { id: true },
    });

    if (!folder) {
      throw new ServiceError('Folder not found', 404);
    }
  }

  if (input.eventId) {
    const event = await prisma.event.findUnique({
      where: { id: input.eventId },
      select: { id: true },
    });

    if (!event) {
      throw new ServiceError('Event not found', 404);
    }
  }

  const updatedImage = await prisma.galleryImage.update({
    where: { id: imageId },
    data: {
      ...input,
      updatedAt: new Date(),
    },
    include: {
      uploader: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      folder: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      event: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  return updatedImage;
}

export async function deleteGalleryImageById(imageId: string, user: User) {
  const image = await prisma.galleryImage.findUnique({
    where: { id: imageId },
  });

  if (!image) {
    throw new ServiceError('Image not found', 404);
  }

  assertCanManageGalleryImage(user, { uploadedBy: image.uploadedBy });

  try {
    await deleteImage(image.cloudinaryId);
  } catch (cloudinaryError) {
    console.error('Error deleting from Cloudinary:', cloudinaryError);
  }

  await prisma.galleryImage.delete({
    where: { id: imageId },
  });
}
