import { EventStatus, JoinClubApplicationStatus } from '@prisma/client';
import { z } from 'zod';

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const eventsListQuerySchema = z
  .object({
    status: z.nativeEnum(EventStatus).optional(),
    category: z.string().trim().min(1).optional(),
    department: z.string().trim().min(1).optional(),
    offset: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strip();

export const galleryImagesListQuerySchema = paginationSchema
  .extend({
    folderId: z.string().trim().min(1).optional(),
    eventId: z.string().trim().min(1).optional(),
    uploaderId: z.string().trim().min(1).optional(),
    status: z.enum(['all', 'approved', 'pending']).optional(),
    isApproved: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
    search: z.string().trim().min(1).optional(),
    tags: z.string().trim().min(1).optional(),
    sortBy: z
      .enum(['createdAt', 'updatedAt', 'title', 'fileSize'])
      .default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .strip();

export const joinClubListQuerySchema = paginationSchema
  .extend({
    status: z.nativeEnum(JoinClubApplicationStatus).optional(),
    search: z.string().trim().min(1).optional(),
  })
  .strip();

export const aboutListQuerySchema = paginationSchema
  .extend({
    department: z.string().trim().min(1).optional(),
    isPublished: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
    sortBy: z.enum(['sortOrder', 'createdAt', 'displayName']).default('sortOrder'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  })
  .strip();

export const aboutCreateUpdateSchema = z.object({
  displayName: z.string().trim().min(1, 'Name is required').max(255),
  role: z.string().trim().min(1, 'Role is required').max(255),
  department: z.string().trim().min(1).max(255).optional(),
  bio: z.string().trim().max(2000).optional().nullable(),
  resumeUrl: z.string().url().optional().nullable(),
  galleryImageId: z.string().trim().max(255).optional().nullable(),
  imageCloudinaryId: z.string().trim().max(255).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  isPublished: z.boolean().default(true),
  socialLinks: z.record(z.string(), z.string()).optional().nullable(),
});

export const aboutReorderSchema = z.object({
  members: z.array(
    z.object({
      id: z.string().min(1),
      sortOrder: z.number().int().min(0),
    }),
  ),
});

export type EventsListQuery = z.infer<typeof eventsListQuerySchema>;
export type GalleryImagesListQuery = z.infer<typeof galleryImagesListQuerySchema>;
export type JoinClubListQuery = z.infer<typeof joinClubListQuerySchema>;
export type AboutListQuery = z.infer<typeof aboutListQuerySchema>;
export type AboutCreateUpdateInput = z.infer<typeof aboutCreateUpdateSchema>;
export type AboutReorderInput = z.infer<typeof aboutReorderSchema>;

export function parseQuery<T>(
  schema: z.ZodType<T>,
  searchParams: URLSearchParams,
): T {
  return schema.parse(Object.fromEntries(searchParams.entries()));
}
