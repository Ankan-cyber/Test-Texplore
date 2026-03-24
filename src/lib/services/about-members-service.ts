import { aboutCreateUpdateSchema } from '@/lib/api-schemas';
import { z } from 'zod';
import { prisma } from '@/lib/db';

export interface AboutMemberWithUser {
  id: string;
  userId: string;
  displayName: string;
  bio: string | null;
  role: string | null;
  department: string | null;
  imageCloudinaryId: string | null;
  imageUrl: string | null;
  galleryImageId: string | null;
  socialLinks: Record<string, string> | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  galleryImage?: {
    id: string;
    fileUrl: string;
    thumbnailUrl: string | null;
    cloudinaryId: string;
  } | null;
}

export class AboutMembersService {
  private static get aboutMember() {
    const model = (prisma as unknown as { aboutMember?: any }).aboutMember;
    if (!model) {
      throw new Error('AboutMember model is not available in Prisma client. Run `npm run db:generate`.');
    }
    return model;
  }

  private static getUnknownUser(userId: string) {
    return {
      id: userId,
      email: 'unknown@local',
      name: 'Unknown User',
    };
  }

  private static async withResolvedUsers<T extends { userId: string }>(
    members: T[],
  ) {
    const userIds = Array.from(new Set(members.map((member) => member.userId)));

    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    const userMap = new Map(users.map((user) => [user.id, user]));

    return members.map((member) => ({
      ...member,
      user: userMap.get(member.userId) || this.getUnknownUser(member.userId),
    }));
  }

  /**
   * List all about members with filtering and sorting
   */
  static async listMembers(options: {
    isPublished?: boolean;
    department?: string;
    page?: number;
    limit?: number;
    sortBy?: 'sortOrder' | 'createdAt' | 'displayName';
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const {
      isPublished,
      department,
      page = 1,
      limit = 20,
      sortBy = 'sortOrder',
      sortOrder = 'asc',
    } = options;

    const skip = (page - 1) * limit;

    const where = {
      ...(isPublished !== undefined && { isPublished }),
      ...(department && { department }),
    };

    const orderBy =
      sortBy === 'sortOrder'
        ? { sortOrder }
        : sortBy === 'createdAt'
          ? { createdAt: sortOrder }
          : { displayName: sortOrder };

    const [members, total] = await Promise.all([
      this.aboutMember.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          galleryImage: {
            select: {
              id: true,
              fileUrl: true,
              thumbnailUrl: true,
              cloudinaryId: true,
            },
          },
        },
      }),
      this.aboutMember.count({ where }),
    ]);

    const membersWithUsers = await this.withResolvedUsers(members);

    return {
      data: membersWithUsers as AboutMemberWithUser[],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single about member by ID
   */
  static async getMemberById(id: string) {
    const member = await this.aboutMember.findUnique({
      where: { id },
      include: {
        galleryImage: {
          select: {
            id: true,
            fileUrl: true,
            thumbnailUrl: true,
            cloudinaryId: true,
          },
        },
      },
    });

    if (!member) {
      return null;
    }

    const [memberWithUser] = await this.withResolvedUsers([member]);
    return memberWithUser as AboutMemberWithUser;
  }

  /**
   * Get about member by user ID
   */
  static async getMemberByUserId(userId: string) {
    const member = await this.aboutMember.findUnique({
      where: { userId },
      include: {
        galleryImage: {
          select: {
            id: true,
            fileUrl: true,
            thumbnailUrl: true,
            cloudinaryId: true,
          },
        },
      },
    });

    if (!member) {
      return null;
    }

    const [memberWithUser] = await this.withResolvedUsers([member]);
    return memberWithUser as AboutMemberWithUser;
  }

  /**
   * Create a new about member
   */
  static async createMember(
    userId: string,
    data: z.infer<typeof aboutCreateUpdateSchema>,
  ) {
    const validated = aboutCreateUpdateSchema.parse(data);

    const resolvedMedia = await this.resolveGalleryImageMedia(validated);

    const member = await this.aboutMember.create({
      data: {
        userId,
        ...validated,
        ...resolvedMedia,
      },
      include: {
        galleryImage: {
          select: {
            id: true,
            fileUrl: true,
            thumbnailUrl: true,
            cloudinaryId: true,
          },
        },
      },
    });

    const [memberWithUser] = await this.withResolvedUsers([member]);
    return memberWithUser as AboutMemberWithUser;
  }

  /**
   * Update an about member
   */
  static async updateMember(
    id: string,
    data: Partial<z.infer<typeof aboutCreateUpdateSchema>>,
  ) {
    const validated = aboutCreateUpdateSchema.partial().parse(data);

    const resolvedMedia = await this.resolveGalleryImageMedia(validated);

    const member = await this.aboutMember.update({
      where: { id },
      data: {
        ...validated,
        ...resolvedMedia,
      },
      include: {
        galleryImage: {
          select: {
            id: true,
            fileUrl: true,
            thumbnailUrl: true,
            cloudinaryId: true,
          },
        },
      },
    });

    const [memberWithUser] = await this.withResolvedUsers([member]);
    return memberWithUser as AboutMemberWithUser;
  }

  /**
   * Delete an about member
   */
  static async deleteMember(id: string) {
    await this.aboutMember.delete({
      where: { id },
    });
  }

  /**
   * Reorder members
   */
  static async reorderMembers(
    updates: Array<{ id: string; sortOrder: number }>,
  ) {
    const results = await Promise.all(
      updates.map((update) =>
        this.aboutMember.update({
          where: { id: update.id },
          data: { sortOrder: update.sortOrder },
        }),
      ),
    );

    return results;
  }

  /**
   * Get all published members for public display
   */
  static async getPublishedMembers(options: {
    department?: string;
    sortBy?: 'sortOrder' | 'createdAt' | 'displayName';
  } = {}) {
    const { department, sortBy = 'sortOrder' } = options;

    const orderBy =
      sortBy === 'sortOrder'
        ? { sortOrder: 'asc' }
        : sortBy === 'createdAt'
          ? { createdAt: 'desc' }
          : { displayName: 'asc' };

    const members = await this.aboutMember.findMany({
      where: {
        isPublished: true,
        ...(department && { department }),
      },
      orderBy,
      select: {
        id: true,
        displayName: true,
        bio: true,
        role: true,
        department: true,
        galleryImageId: true,
        imageUrl: true,
        imageCloudinaryId: true,
        socialLinks: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
        galleryImage: {
          select: {
            id: true,
            fileUrl: true,
            thumbnailUrl: true,
            cloudinaryId: true,
          },
        },
      },
    });

    return members;
  }

  private static async resolveGalleryImageMedia(
    data: Partial<z.infer<typeof aboutCreateUpdateSchema>>,
  ): Promise<{
    galleryImageId?: string | null;
    imageUrl?: string | null;
    imageCloudinaryId?: string | null;
  }> {
    if (data.galleryImageId) {
      const image = await prisma.galleryImage.findUnique({
        where: { id: data.galleryImageId },
        select: { id: true, fileUrl: true, cloudinaryId: true },
      });

      if (!image) {
        throw new Error('Gallery image not found');
      }

      return {
        galleryImageId: image.id,
        imageUrl: image.fileUrl,
        imageCloudinaryId: image.cloudinaryId,
      };
    }

    if (!data.galleryImageId && data.imageCloudinaryId) {
      const image = await prisma.galleryImage.findFirst({
        where: { cloudinaryId: data.imageCloudinaryId },
        select: { id: true, fileUrl: true, cloudinaryId: true },
      });

      if (image) {
        return {
          galleryImageId: image.id,
          imageUrl: image.fileUrl,
          imageCloudinaryId: image.cloudinaryId,
        };
      }
    }

    return {};
  }
}
