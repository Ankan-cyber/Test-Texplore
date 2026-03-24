/**
 * Migration Script: Move images from public folder to Cloudinary
 * 
 * This script:
 * 1. Reads all JPEG files from public/leadership and public/departments
 * 2. Uploads them to Cloudinary under texplore/about/{leadership,departments}
 * 3. Upserts records in GalleryImage so they are manageable from admin UI
 * 
 * Usage: npx ts-node scripts/migrate-public-images-to-cloudinary.ts
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { uploadImage } from '../src/lib/cloudinary';

const prisma = new PrismaClient();

type SourceType = 'leadership' | 'departments';

function inferMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();

  if (ext === '.png') {
    return 'image/png';
  }

  if (ext === '.webp') {
    return 'image/webp';
  }

  return 'image/jpeg';
}

function toTitle(fileName: string): string {
  const base = path.parse(fileName).name;
  return base
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function findMigrationUploaderId(): Promise<string> {
  const preferredEmail = process.env.MIGRATION_UPLOADER_EMAIL?.trim();

  if (preferredEmail) {
    const byEmail = await prisma.user.findUnique({
      where: { email: preferredEmail },
      select: { id: true, email: true },
    });

    if (byEmail) {
      console.log(`Using uploader from MIGRATION_UPLOADER_EMAIL: ${byEmail.email}`);
      return byEmail.id;
    }

    throw new Error(
      `No user found for MIGRATION_UPLOADER_EMAIL=${preferredEmail}`,
    );
  }

  const adminUser = await prisma.user.findFirst({
    where: { role: 'admin' },
    select: { id: true, email: true },
    orderBy: { createdAt: 'asc' },
  });

  if (adminUser) {
    console.log(`Using admin uploader: ${adminUser.email}`);
    return adminUser.id;
  }

  const anyUser = await prisma.user.findFirst({
    select: { id: true, email: true },
    orderBy: { createdAt: 'asc' },
  });

  if (anyUser) {
    console.log(`Using first available uploader: ${anyUser.email}`);
    return anyUser.id;
  }

  throw new Error(
    'No users found. Create at least one user before running this migration.',
  );
}

async function ensureGalleryFolders(sourceType: SourceType): Promise<string> {
  const aboutFolder = await prisma.galleryFolder.upsert({
    where: { slug: 'about' },
    update: {
      isArchived: false,
      isPublic: false,
    },
    create: {
      name: 'About',
      slug: 'about',
      description: 'About section media',
      isPublic: false,
      isArchived: false,
      createdBy: migrationUploaderId,
    },
    select: { id: true },
  });

  const sourceName = sourceType === 'leadership' ? 'Leadership' : 'Departments';
  const sourceSlug = `about-${sourceType}`;

  const sourceFolder = await prisma.galleryFolder.upsert({
    where: { slug: sourceSlug },
    update: {
      parentId: aboutFolder.id,
      isArchived: false,
      isPublic: false,
    },
    create: {
      name: sourceName,
      slug: sourceSlug,
      description: `Migrated ${sourceName.toLowerCase()} images`,
      parentId: aboutFolder.id,
      isPublic: false,
      isArchived: false,
      createdBy: migrationUploaderId,
    },
    select: { id: true },
  });

  return sourceFolder.id;
}

let migrationUploaderId = '';

async function getFilesFromDirectory(dir: string): Promise<string[]> {
  try {
    const files = fs.readdirSync(dir);
    return files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return ext === '.jpg' || ext === '.jpeg';
    });
  } catch (error) {
    console.log(`Directory ${dir} does not exist or is empty`);
    return [];
  }
}

async function migrateImagesFromDirectory(
  sourceDir: string,
  sourceType: SourceType,
): Promise<void> {
  console.log(`\n📁 Processing ${sourceType} images from ${sourceDir}...`);

  const galleryFolderId = await ensureGalleryFolders(sourceType);

  const files = await getFilesFromDirectory(sourceDir);
  if (files.length === 0) {
    console.log(`  ✓ No images found in ${sourceDir}`);
    return;
  }

  console.log(`  Found ${files.length} images to migrate`);

  for (const file of files) {
    const filePath = path.join(sourceDir, file);
    try {
      console.log(`  Uploading: ${file}...`);

      // Read file buffer
      const fileBuffer = fs.readFileSync(filePath);

      // Upload to Cloudinary
      const result = await uploadImage(fileBuffer, {
        folder: `texplore-gallery/about/${sourceType}`,
        public_id: path.parse(file).name, // Use filename without extension as public_id
        tags: ['about', sourceType, 'migrated'],
      });

      // Ensure image is visible in Gallery Management and can be managed from admin panel
      await prisma.galleryImage.upsert({
        where: { cloudinaryId: result.public_id },
        update: {
          folderId: galleryFolderId,
          fileUrl: result.secure_url,
          thumbnailUrl: result.secure_url,
          fileSize: result.bytes ?? fs.statSync(filePath).size,
          mimeType: inferMimeType(file),
          title: toTitle(file),
          tags: ['about', sourceType, 'migrated'],
          isApproved: true,
          isPublic: true,
          cloudinaryData: JSON.parse(JSON.stringify(result)),
        },
        create: {
          originalName: file,
          fileName: path.parse(file).name,
          fileUrl: result.secure_url,
          thumbnailUrl: result.secure_url,
          fileSize: result.bytes ?? fs.statSync(filePath).size,
          mimeType: inferMimeType(file),
          folderId: galleryFolderId,
          title: toTitle(file),
          tags: ['about', sourceType, 'migrated'],
          cloudinaryId: result.public_id,
          cloudinaryData: JSON.parse(JSON.stringify(result)),
          uploadedBy: migrationUploaderId,
          isApproved: true,
          isPublic: true,
        },
      });

      console.log(`    ✓ Synced gallery image: ${result.public_id}`);
    } catch (error) {
      console.error(`    ✗ Error uploading ${file}:`, error);
    }
  }
}

async function main(): Promise<void> {
  console.log('🚀 Starting image migration to Cloudinary...');

  try {
    migrationUploaderId = await findMigrationUploaderId();

    // Migrate leadership images
    await migrateImagesFromDirectory(
      path.join(process.cwd(), 'public/leadership'),
      'leadership',
    );

    // Migrate department images
    await migrateImagesFromDirectory(
      path.join(process.cwd(), 'public/departments'),
      'departments',
    );

    // Get summary
    const leadership = await prisma.galleryImage.count({
      where: {
        tags: {
          hasEvery: ['about', 'leadership', 'migrated'],
        },
      },
    });
    const departments = await prisma.galleryImage.count({
      where: {
        tags: {
          hasEvery: ['about', 'departments', 'migrated'],
        },
      },
    });
    const galleryImages = await prisma.galleryImage.count({
      where: { tags: { has: 'migrated' } },
    });
    const galleryFolders = await prisma.galleryFolder.count({
      where: { slug: { in: ['about', 'about-leadership', 'about-departments'] } },
    });

    console.log('\n✅ Migration complete!');
    console.log(`  Total migrated gallery images: ${galleryImages}`);
    console.log(`  Leadership images: ${leadership}`);
    console.log(`  Department images: ${departments}`);
    console.log(`  Gallery folders ready: ${galleryFolders}`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
