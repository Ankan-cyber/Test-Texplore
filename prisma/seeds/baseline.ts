import { PrismaClient, Role, type User } from '@prisma/client';
import { hashPassword } from '../../src/lib/auth';
import { getDefaultPermissions } from '../../src/lib/permissions';
import {
  type GeneratedSeedPasswords,
  resolveSeedPassword,
} from './password';

export interface BaselineSeedResult {
  adminUser: User;
  techDepartmentId: string | null;
  eventDepartmentId: string | null;
}

const departments = [
  {
    name: 'amity_school_engineering_technology_aset',
    displayName: 'Amity School of Engineering & Technology (ASET)',
    description: 'Amity School of Engineering & Technology',
  },
  {
    name: 'amity_institute_information_technology_aiit',
    displayName: 'Amity Institute of Information Technology (AIIT)',
    description: 'Amity Institute of Information Technology',
  },
  {
    name: 'amity_school_business_administration',
    displayName: 'Amity School of Business Administration',
    description: 'Amity School of Business Administration',
  },
  {
    name: 'amity_school_biological_sciences',
    displayName: 'Amity School of Biological Sciences',
    description: 'Amity School of Biological Sciences',
  },
  {
    name: 'amity_school_social_sciences',
    displayName:
      'Amity School of Social Sciences — Arts, Humanities, Culture, Psychology, Economics',
    description:
      'Amity School of Social Sciences — Arts, Humanities, Culture, Psychology, Economics',
  },
  {
    name: 'amity_school_architecture_planning',
    displayName: 'Amity School of Architecture & Planning',
    description: 'Amity School of Architecture & Planning',
  },
  {
    name: 'amity_school_law',
    displayName: 'Amity School of Law',
    description: 'Amity School of Law',
  },
];

export async function seedBaseline(
  prisma: PrismaClient,
  generatedPasswords: GeneratedSeedPasswords,
): Promise<BaselineSeedResult> {
  console.log('📚 Creating baseline departments...');

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    });
  }

  console.log('✅ Baseline departments created');

  const techDept = await prisma.department.findUnique({
    where: { name: 'amity_institute_information_technology_aiit' },
    select: { id: true },
  });

  const eventDept = await prisma.department.findUnique({
    where: { name: 'amity_school_engineering_technology_aset' },
    select: { id: true },
  });

  console.log('👤 Creating baseline admin user...');
  const adminPasswordPlain = resolveSeedPassword(
    'SEED_ADMIN_PASSWORD',
    'Admin',
    generatedPasswords,
  );
  const adminPassword = await hashPassword(adminPasswordPlain);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@texplore.in' },
    update: {},
    create: {
      email: 'admin@texplore.in',
      name: 'Admin User',
      password: adminPassword,
      role: Role.admin,
      permissions: getDefaultPermissions(Role.admin),
      status: 'APPROVED',
      departmentId: techDept?.id,
    },
  });

  console.log('✅ Baseline admin user created');

  return {
    adminUser,
    techDepartmentId: techDept?.id ?? null,
    eventDepartmentId: eventDept?.id ?? null,
  };
}
