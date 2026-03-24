/**
 * Backfill Script: Create AboutMember records from hardcoded data
 * 
 * This script:
 * 1. Creates AboutMember records for leadership members
 * 2. Creates AboutMember records for department heads
 * 3. Ensures GalleryImage records exist for profile photos and links them
 * 4. Sets proper sort order for display
 * 
 * Usage: npx tsx scripts/backfill-about-members.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const db = prisma as any;
const defaultAboutPassword = process.env.ABOUT_MEMBER_DEFAULT_PASSWORD || 'ChangeMe123!';

interface LeaderData {
  name: string;
  role: string;
  additionalRole?: string;
  image: string;
  sortOrder: number;
  department?: string;
}

interface DepartmentHeadData {
  name: string;
  title: string;
  departmentName: string;
  image: string;
  sortOrder: number;
}

const leaders: LeaderData[] = [
  {
    name: 'Sukhmanjeet Singh',
    role: 'President',
    image: '/leadership/president.jpeg',
    sortOrder: 0,
  },
  {
    name: 'Pallavi Sharma',
    role: 'Vice President',
    image: '/leadership/vice-president.jpeg',
    sortOrder: 1,
  },
  {
    name: 'Prof. (Dr.) Rajni Mohana',
    role: 'Faculty Advisor',
    additionalRole: 'Dean of ASET',
    image: '/leadership/faculty5.jpeg',
    sortOrder: 2,
  },
  {
    name: 'Prof. (Dr.) Sachin Sharma',
    role: 'Faculty Coordinator',
    additionalRole: 'Head of School of ASET',
    image: '/leadership/faculty3.jpeg',
    sortOrder: 3,
  },
  {
    name: 'Dr. Himanshu Jindal',
    role: 'Faculty Coordinator',
    additionalRole: 'Head of Department of ASET',
    image: '/leadership/faculty2.jpeg',
    sortOrder: 4,
  },
  {
    name: 'Prof. (Dr.) Puneet Mittal',
    role: 'Faculty Coordinator',
    additionalRole: 'Placement Coordinator of ASET',
    image: '/leadership/faculty4.jpeg',
    sortOrder: 5,
  },
  {
    name: 'Dr. Monika Bharti',
    role: 'Faculty Coordinator',
    additionalRole: 'Program Coordinator of ASET',
    image: '/leadership/faculty1.jpeg',
    sortOrder: 6,
  },
];

const departmentHeads: DepartmentHeadData[] = [
  {
    name: 'Tejveer Singh',
    title: 'Event Management Lead',
    departmentName: 'Event Management Team',
    image: '/departments/Event-head.jpeg',
    sortOrder: 7,
  },
  {
    name: 'Sahajdeep Singh',
    title: 'Technology Lead',
    departmentName: 'Technology & Development Team',
    image: '/departments/Sahaj.jpg',
    sortOrder: 8,
  },
  {
    name: 'Abhinandan Sambyal',
    title: 'Marketing Lead',
    departmentName: 'Marketing Team',
    image: '/departments/marketing-head.jpeg',
    sortOrder: 9,
  },
  {
    name: 'Sifat Singh',
    title: 'Design Lead',
    departmentName: 'Design & Creative Team',
    image: '/departments/design-head.jpeg',
    sortOrder: 10,
  },
  {
    name: 'Vanshika Rastogi',
    title: 'HR Lead',
    departmentName: 'Human Resources Team',
    image: '/departments/hr-head.jpg',
    sortOrder: 11,
  },
  {
    name: 'Aryan Sharma',
    title: 'Event Coordinator',
    departmentName: 'Event Management Team',
    image: '/departments/Event-head3.jpeg',
    sortOrder: 12,
  },
  {
    name: 'Jasleen Walia',
    title: 'Event Coordinator',
    departmentName: 'Event Management Team',
    image: '/departments/Event-head2.jpeg',
    sortOrder: 13,
  },
];

async function findMediaAssetByFileName(fileName: string): Promise<string | null> {
  const image = await findGalleryImageByFileName(fileName);
  return image?.fileUrl || null;
}

async function findGalleryImageByFileName(fileName: string) {
  const actualFileName = fileName.split('/').pop();
  const baseName = actualFileName
    ? actualFileName.replace(/\.[^.]+$/, '')
    : null;

  if (!actualFileName) {
    return null;
  }

  return prisma.galleryImage.findFirst({
    where: {
      OR: [
        { originalName: actualFileName },
        { fileName: actualFileName },
        ...(baseName
          ? [
              { cloudinaryId: { contains: baseName } },
              { title: { contains: baseName.replace(/[-_]+/g, ' ') } },
            ]
          : []),
      ],
    },
    select: {
      id: true,
      fileUrl: true,
      cloudinaryId: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

function inferMimeType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

async function ensureGalleryImageForProfile(
  fileName: string,
  _uploadedByUserId: string,
  title: string,
): Promise<{
  galleryImageId: string | null;
  fileUrl: string | null;
  cloudinaryId: string | null;
}> {
  const existing = await findGalleryImageByFileName(fileName);
  if (!existing) {
    console.warn(
      `  ⚠ No gallery image found for ${fileName}. Upload/migrate it before running backfill.`,
    );
    return {
      galleryImageId: null,
      fileUrl: null,
      cloudinaryId: null,
    };
  }

  return {
    galleryImageId: existing.id,
    fileUrl: existing.fileUrl,
    cloudinaryId: existing.cloudinaryId,
  };
}

async function getOrCreateUser(name: string, role: string): Promise<string> {
  // Generate email from name (as a fallback for users with no proper email)
  const email = name
    .toLowerCase()
    .split(' ')
    .join('.')
    .concat(`@texplore.example.com`)
    .replace(/[^a-z0-9.@_-]/g, '');

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    const updateData: Record<string, unknown> = {};

    if (!(existing as any).isAboutProfileOnly) {
      updateData.isAboutProfileOnly = true;
    }

    if (!existing.password) {
      updateData.password = await bcrypt.hash(defaultAboutPassword, 12);
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: existing.id },
        data: updateData as any,
      });
    }

    return existing.id;
  }

  const hashedPassword = await bcrypt.hash(defaultAboutPassword, 12);

  // Create a new user record
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: 'member', // Default role
      permissions: [
        'about:self:update',
        'about:read',
        'settings:access',
        'gallery:upload',
      ],
      isAboutProfileOnly: true,
      status: 'APPROVED',
      profile: {
        create: {
          fullName: name,
        },
      },
    } as any,
  });

  return user.id;
}

async function backfillLeaders(): Promise<void> {
  console.log('\n👥 Backfilling leadership members...');

  for (const leader of leaders) {
    try {
      const userId = await getOrCreateUser(leader.name, leader.role);
      
      // Check if AboutMember already exists
      const existing = await db.aboutMember.findUnique({
        where: { userId },
      });

      if (existing) {
        console.log(`  ✓ Already exists: ${leader.name}`);
        continue;
      }

      // Find image URL
      const media = await ensureGalleryImageForProfile(
        leader.image,
        userId,
        `${leader.name} profile photo`,
      );

      // Create AboutMember record
      const aboutMember = await db.aboutMember.create({
        data: {
          userId,
          displayName: leader.name,
          bio: leader.additionalRole || leader.role,
          role: leader.role,
          department: 'LEADERSHIP',
          galleryImageId: media.galleryImageId || undefined,
          imageUrl: media.fileUrl || undefined,
          imageCloudinaryId: media.cloudinaryId || undefined,
          sortOrder: leader.sortOrder,
          isPublished: true,
          socialLinks: {},
        },
      });

      console.log(`  ✓ Created: ${leader.name} (${leader.role})`);
    } catch (error) {
      console.error(
        `  ✗ Error creating AboutMember for ${leader.name}:`,
        error,
      );
    }
  }
}

async function backfillDepartmentHeads(): Promise<void> {
  console.log('\n🏢 Backfilling department heads...');

  for (const head of departmentHeads) {
    try {
      const userId = await getOrCreateUser(head.name, head.title);
      
      // Check if AboutMember already exists
      const existing = await db.aboutMember.findUnique({
        where: { userId },
      });

      if (existing) {
        console.log(`  ✓ Already exists: ${head.name}`);
        continue;
      }

      const media = await ensureGalleryImageForProfile(
        head.image,
        userId,
        `${head.name} profile photo`,
      );

      // Create AboutMember record
      const aboutMember = await db.aboutMember.create({
        data: {
          userId,
          displayName: head.name,
          bio: head.title,
          role: head.title,
          department: 'DEPARTMENT',
          galleryImageId: media.galleryImageId || undefined,
          imageUrl: media.fileUrl || undefined,
          imageCloudinaryId: media.cloudinaryId || undefined,
          sortOrder: head.sortOrder,
          isPublished: true,
          socialLinks: {},
        },
      });

      console.log(`  ✓ Created: ${head.name} (${head.title})`);
    } catch (error) {
      console.error(`  ✗ Error creating AboutMember for ${head.name}:`, error);
    }
  }
}

async function main(): Promise<void> {
  console.log('🚀 Starting AboutMember backfill...');
  console.log(
    `ℹ Default About member password source: ${process.env.ABOUT_MEMBER_DEFAULT_PASSWORD ? 'ABOUT_MEMBER_DEFAULT_PASSWORD env' : 'fallback value'}`,
  );

  try {
    await backfillLeaders();
    await backfillDepartmentHeads();

    // Get summary
    const total = await db.aboutMember.count();
    const published = await db.aboutMember.count({
      where: { isPublished: true },
    });

    console.log('\n✅ Backfill complete!');
    console.log(`  Total AboutMembers: ${total}`);
    console.log(`  Published: ${published}`);
  } catch (error) {
    console.error('❌ Backfill failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
