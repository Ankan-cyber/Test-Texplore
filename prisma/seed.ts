import { existsSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { seedBaseline } from './seeds/baseline';
import { seedDemoData } from './seeds/demo';
import { type GeneratedSeedPasswords } from './seeds/password';

function loadEnvFile(filePath: string) {
  const content = readFileSync(filePath, 'utf8');

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const normalized = line.startsWith('export ')
      ? line.slice('export '.length)
      : line;

    const separatorIndex = normalized.indexOf('=');
    if (separatorIndex < 1) {
      continue;
    }

    const key = normalized.slice(0, separatorIndex).trim();
    if (!key) {
      continue;
    }

    const existingValue = process.env[key];
    if (existingValue !== undefined && existingValue !== '') {
      continue;
    }

    let value = normalized.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function ensureSeedEnvironment() {
  const seedFilePath = fileURLToPath(import.meta.url);
  const seedDir = dirname(seedFilePath);
  const projectRoot = resolve(seedDir, '..');

  const envCandidates = [
    resolve(projectRoot, '.env.local'),
    resolve(projectRoot, '.env'),
    resolve(process.cwd(), '.env.local'),
    resolve(process.cwd(), '.env'),
  ];

  const loaded = new Set<string>();
  for (const envPath of envCandidates) {
    if (!loaded.has(envPath) && existsSync(envPath)) {
      loadEnvFile(envPath);
      loaded.add(envPath);
    }
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is missing. Checked .env.local and .env in the project root.',
    );
  }
}

ensureSeedEnvironment();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  const shouldSeedDemoData = process.env.SEED_DEMO_DATA === 'true';
  const generatedPasswords: GeneratedSeedPasswords = {};

  const baseline = await seedBaseline(prisma, generatedPasswords);

  if (!shouldSeedDemoData) {
    console.log('✅ Baseline seed completed successfully!');
    console.log(
      'ℹ️ Demo seed data skipped. Run with SEED_DEMO_DATA=true to include sample content.',
    );
  } else {
    await seedDemoData({
      prisma,
      adminUser: baseline.adminUser,
      techDepartmentId: baseline.techDepartmentId,
      eventDepartmentId: baseline.eventDepartmentId,
      generatedPasswords,
    });

    console.log('✅ Demo seed data created successfully!');
  }

  if (Object.keys(generatedPasswords).length > 0) {
    console.log('🔐 Generated seed credentials (save securely):');
    for (const [account, password] of Object.entries(generatedPasswords)) {
      console.log(`${account}: ${password}`);
    }
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((error) => {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
