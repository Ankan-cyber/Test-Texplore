import { PrismaClient, Role, EventStatus } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';
import { getDefaultPermissions } from '../src/lib/permissions';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create departments (RBAC only)
  console.log('📚 Creating departments...');
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
      displayName: 'Amity School of Social Sciences — Arts, Humanities, Culture, Psychology, Economics',
      description: 'Amity School of Social Sciences — Arts, Humanities, Culture, Psychology, Economics',
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

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    });
  }

  console.log('✅ Departments created successfully');

  // Get department IDs for user assignment
  const techDept = await prisma.department.findUnique({
    where: { name: 'amity_institute_information_technology_aiit' },
  });
  const eventDept = await prisma.department.findUnique({
    where: { name: 'amity_school_engineering_technology_aset' },
  });

  // Create admin user
  console.log('👤 Creating admin user...');
  const adminPassword = await hashPassword('admin123');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@texplore-amity.com' },
    update: {},
    create: {
      email: 'admin@texplore-amity.com',
      name: 'Admin User',
      password: adminPassword,
      role: Role.admin,
      permissions: getDefaultPermissions(Role.admin),
      status: 'APPROVED',
      departmentId: techDept?.id,
    },
  });

  // Create president user
  console.log('👤 Creating president user...');
  const presidentPassword = await hashPassword('president123');
  const presidentUser = await prisma.user.upsert({
    where: { email: 'president@texplore-amity.com' },
    update: {},
    create: {
      email: 'president@texplore-amity.com',
      name: 'President User',
      password: presidentPassword,
      role: Role.president,
      permissions: getDefaultPermissions(Role.president),
      status: 'APPROVED',
      departmentId: techDept?.id,
      assignedById: adminUser.id,
    },
  });

  // Create vice president user
  console.log('👤 Creating vice president user...');
  const vpPassword = await hashPassword('vp123');
  const vpUser = await prisma.user.upsert({
    where: { email: 'vp@texplore-amity.com' },
    update: {},
    create: {
      email: 'vp@texplore-amity.com',
      name: 'Vice President User',
      password: vpPassword,
      role: Role.vice_president,
      permissions: getDefaultPermissions(Role.vice_president),
      status: 'APPROVED',
      departmentId: techDept?.id,
      assignedById: adminUser.id,
    },
  });

  // Create coordinator user
  console.log('👤 Creating coordinator user...');
  const coordinatorPassword = await hashPassword('coordinator123');
  const coordinatorUser = await prisma.user.upsert({
    where: { email: 'coordinator@texplore-amity.com' },
    update: {},
    create: {
      email: 'coordinator@texplore-amity.com',
      name: 'Coordinator User',
      password: coordinatorPassword,
      role: Role.coordinator,
      permissions: getDefaultPermissions(Role.coordinator),
      status: 'APPROVED',
      departmentId: techDept?.id,
      assignedById: adminUser.id,
    },
  });

  // Create member user
  console.log('👤 Creating member user...');
  const memberPassword = await hashPassword('member123');
  const memberUser = await prisma.user.upsert({
    where: { email: 'member@texplore-amity.com' },
    update: {},
    create: {
      email: 'member@texplore-amity.com',
      name: 'Member User',
      password: memberPassword,
      role: Role.member,
      permissions: getDefaultPermissions(Role.member),
      status: 'APPROVED',
      departmentId: techDept?.id,
      assignedById: adminUser.id,
    },
  });

  console.log('✅ All users created successfully');

  // Create sample events
  console.log('📅 Creating sample events...');
  const sampleEvents = [
    {
      title: 'Welcome to Texplore Amity',
      description:
        'Join us for an exciting introduction to our club and its activities.',
      slug: 'welcome-texplore-amity',
      startDate: new Date('2024-03-15T10:00:00Z'),
      endDate: new Date('2024-03-15T12:00:00Z'),
      location: 'Main Auditorium',
      isOnline: false,
      maxCapacity: 100,
      isRegistrationOpen: true,
      registrationDeadline: new Date('2024-03-14T23:59:59Z'),
      status: EventStatus.PUBLISHED,
      isFeatured: true,
      tags: ['welcome', 'introduction', 'club'],
      category: 'General',
      departmentId: eventDept?.id,
      createdById: adminUser.id,
    },
    {
      title: 'Tech Workshop: Web Development',
      description:
        'Learn the basics of web development with hands-on practice.',
      slug: 'tech-workshop-web-development',
      startDate: new Date('2024-03-20T14:00:00Z'),
      endDate: new Date('2024-03-20T17:00:00Z'),
      location: 'Computer Lab 1',
      isOnline: false,
      maxCapacity: 30,
      isRegistrationOpen: true,
      registrationDeadline: new Date('2024-03-19T23:59:59Z'),
      status: EventStatus.PUBLISHED,
      isFeatured: false,
      tags: ['workshop', 'web-development', 'hands-on'],
      category: 'Workshop',
      departmentId: eventDept?.id,
      createdById: coordinatorUser.id,
    },
  ];

  for (const eventData of sampleEvents) {
    await prisma.event.upsert({
      where: { slug: eventData.slug },
      update: {},
      create: eventData,
    });
  }

  console.log('✅ Sample events created successfully');

  // Create sample gallery folders with nested structure
  console.log('📁 Creating sample gallery folders...');

  // Create parent folders
  const parentFolder1 = await prisma.galleryFolder.upsert({
    where: { slug: 'events-2024' },
    update: {},
    create: {
      name: 'Events 2024',
      slug: 'events-2024',
      description: 'All events from 2024',
      createdBy: adminUser.id,
      isPublic: true,
    },
  });

  const parentFolder2 = await prisma.galleryFolder.upsert({
    where: { slug: 'workshops' },
    update: {},
    create: {
      name: 'Workshops',
      slug: 'workshops',
      description: 'Workshop photos and materials',
      createdBy: adminUser.id,
      isPublic: true,
    },
  });

  // Create nested folders
  const nestedFolder1 = await prisma.galleryFolder.upsert({
    where: { slug: 'events-2024-welcome' },
    update: {},
    create: {
      name: 'Welcome Event',
      slug: 'events-2024-welcome',
      description: 'Photos from the welcome event',
      parentId: parentFolder1.id,
      createdBy: adminUser.id,
      isPublic: true,
    },
  });

  const nestedFolder2 = await prisma.galleryFolder.upsert({
    where: { slug: 'events-2024-web-dev' },
    update: {},
    create: {
      name: 'Web Development Workshop',
      slug: 'events-2024-web-dev',
      description: 'Photos from web development workshop',
      parentId: parentFolder1.id,
      createdBy: adminUser.id,
      isPublic: true,
    },
  });

  const nestedFolder3 = await prisma.galleryFolder.upsert({
    where: { slug: 'workshops-basic' },
    update: {},
    create: {
      name: 'Basic Workshops',
      slug: 'workshops-basic',
      description: 'Basic level workshops',
      parentId: parentFolder2.id,
      createdBy: adminUser.id,
      isPublic: true,
    },
  });

  // Create a third-level folder
  const thirdLevelFolder = await prisma.galleryFolder.upsert({
    where: { slug: 'workshops-basic-html-css' },
    update: {},
    create: {
      name: 'HTML & CSS Basics',
      slug: 'workshops-basic-html-css',
      description: 'HTML and CSS fundamentals workshop',
      parentId: nestedFolder3.id,
      createdBy: adminUser.id,
      isPublic: true,
    },
  });

  console.log('✅ Sample gallery folders created successfully');

  // Create sample gallery images
  console.log('🖼️ Creating sample gallery images...');

  const sampleImages = [
    {
      title: 'Welcome Event 2024 - Group Photo',
      description: 'Students and faculty gathered for the annual welcome event',
      originalName: 'welcome-event-group.jpg',
      fileName: 'welcome-event-group-2024.jpg',
      fileUrl:
        'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=600&fit=crop',
      fileSize: 2048576, // 2MB
      mimeType: 'image/jpeg',
      cloudinaryId: 'sample_welcome_event',
      isApproved: true,
      isPublic: true,
      folderId: nestedFolder1.id,
      uploadedBy: adminUser.id,
      tags: ['welcome', 'group', '2024'],
    },
    {
      title: 'Web Development Workshop - Coding Session',
      description: 'Students working on hands-on web development projects',
      originalName: 'web-dev-workshop.jpg',
      fileName: 'web-dev-workshop-2024.jpg',
      fileUrl:
        'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop',
      fileSize: 1536000, // 1.5MB
      mimeType: 'image/jpeg',
      cloudinaryId: 'sample_web_dev_workshop',
      isApproved: true,
      isPublic: true,
      folderId: nestedFolder2.id,
      uploadedBy: adminUser.id,
      tags: ['workshop', 'coding', 'web-development'],
    },
    {
      title: 'HTML & CSS Basics - Learning Session',
      description: 'Students learning the fundamentals of HTML and CSS',
      originalName: 'html-css-basics.jpg',
      fileName: 'html-css-basics-2024.jpg',
      fileUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
      fileSize: 1843200, // 1.8MB
      mimeType: 'image/jpeg',
      cloudinaryId: 'sample_html_css_basics',
      isApproved: true,
      isPublic: true,
      folderId: thirdLevelFolder.id,
      uploadedBy: adminUser.id,
      tags: ['html', 'css', 'basics', 'learning'],
    },
    {
      title: 'Tech Ideathon 2024 - Team Presentations',
      description: 'Final presentations from 24-hour hackathon participants',
      originalName: 'tech-ideathon-presentations.jpg',
      fileName: 'tech-ideathon-presentations-2024.jpg',
      fileUrl:
        'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop',
      fileSize: 2560000, // 2.5MB
      mimeType: 'image/jpeg',
      cloudinaryId: 'sample_tech_ideathon',
      isApproved: true,
      isPublic: true,
      folderId: parentFolder1.id,
      uploadedBy: adminUser.id,
      tags: ['ideathon', 'presentations', 'hackathon'],
    },
    {
      title: 'IEEE Innovation Meetup - Panel Discussion',
      description: 'Industry experts discussing emerging technologies',
      originalName: 'ieee-meetup-panel.jpg',
      fileName: 'ieee-meetup-panel-2024.jpg',
      fileUrl:
        'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop',
      fileSize: 1920000, // 1.9MB
      mimeType: 'image/jpeg',
      cloudinaryId: 'sample_ieee_meetup',
      isApproved: true,
      isPublic: true,
      folderId: parentFolder1.id,
      uploadedBy: adminUser.id,
      tags: ['ieee', 'panel', 'innovation'],
    },
    {
      title: 'AI & ML Workshop - Hands-on Session',
      description: 'Students working on practical machine learning projects',
      originalName: 'ai-ml-workshop.jpg',
      fileName: 'ai-ml-workshop-2024.jpg',
      fileUrl:
        'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop',
      fileSize: 2200000, // 2.2MB
      mimeType: 'image/jpeg',
      cloudinaryId: 'sample_ai_ml_workshop',
      isApproved: true,
      isPublic: true,
      folderId: parentFolder2.id,
      uploadedBy: adminUser.id,
      tags: ['ai', 'ml', 'workshop', 'machine-learning'],
    },
    {
      title: 'Startup Pitch Competition - Finals',
      description: 'Finalist teams presenting their startup ideas',
      originalName: 'startup-pitch-finals.jpg',
      fileName: 'startup-pitch-finals-2024.jpg',
      fileUrl:
        'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
      fileSize: 2750000, // 2.75MB
      mimeType: 'image/jpeg',
      cloudinaryId: 'sample_startup_pitch',
      isApproved: true,
      isPublic: true,
      folderId: parentFolder1.id,
      uploadedBy: adminUser.id,
      tags: ['startup', 'pitch', 'competition'],
    },
    {
      title: 'Networking Night - Alumni Connect',
      description: 'Current students networking with successful alumni',
      originalName: 'networking-night.jpg',
      fileName: 'networking-night-2024.jpg',
      fileUrl:
        'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop',
      fileSize: 1980000, // 1.98MB
      mimeType: 'image/jpeg',
      cloudinaryId: 'sample_networking_night',
      isApproved: true,
      isPublic: true,
      folderId: parentFolder1.id,
      uploadedBy: adminUser.id,
      tags: ['networking', 'alumni', 'connect'],
    },
    {
      title: 'Design Thinking Workshop - Prototyping',
      description:
        'Students creating prototypes using design thinking methodology',
      originalName: 'design-thinking-prototype.jpg',
      fileName: 'design-thinking-prototype-2024.jpg',
      fileUrl:
        'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
      fileSize: 2100000, // 2.1MB
      mimeType: 'image/jpeg',
      cloudinaryId: 'sample_design_thinking',
      isApproved: true,
      isPublic: true,
      folderId: parentFolder2.id,
      uploadedBy: adminUser.id,
      tags: ['design-thinking', 'prototyping', 'workshop'],
    },
    {
      title: 'IEEE Day Celebration - Technical Presentations',
      description: 'Students showcasing their research projects',
      originalName: 'ieee-day-presentations.jpg',
      fileName: 'ieee-day-presentations-2024.jpg',
      fileUrl:
        'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=600&fit=crop',
      fileSize: 2400000, // 2.4MB
      mimeType: 'image/jpeg',
      cloudinaryId: 'sample_ieee_day',
      isApproved: true,
      isPublic: true,
      folderId: parentFolder1.id,
      uploadedBy: adminUser.id,
      tags: ['ieee', 'day', 'presentations', 'research'],
    },
    {
      title: 'Blockchain Summit - Expert Talks',
      description: 'Leading experts discussing blockchain technology trends',
      originalName: 'blockchain-summit.jpg',
      fileName: 'blockchain-summit-2024.jpg',
      fileUrl:
        'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop',
      fileSize: 2600000, // 2.6MB
      mimeType: 'image/jpeg',
      cloudinaryId: 'sample_blockchain_summit',
      isApproved: true,
      isPublic: true,
      folderId: parentFolder1.id,
      uploadedBy: adminUser.id,
      tags: ['blockchain', 'summit', 'expert-talks'],
    },
    {
      title: 'Women in Tech Leadership Panel',
      description: 'Empowering discussion with successful women leaders',
      originalName: 'women-tech-leadership.jpg',
      fileName: 'women-tech-leadership-2024.jpg',
      fileUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
      fileSize: 1850000, // 1.85MB
      mimeType: 'image/jpeg',
      cloudinaryId: 'sample_women_tech',
      isApproved: true,
      isPublic: true,
      folderId: parentFolder1.id,
      uploadedBy: adminUser.id,
      tags: ['women-in-tech', 'leadership', 'panel'],
    },
  ];

  for (const imageData of sampleImages) {
    await prisma.galleryImage.upsert({
      where: { cloudinaryId: imageData.cloudinaryId },
      update: {},
      create: imageData,
    });
  }

  console.log('✅ Sample gallery images created successfully');

  // Create sample join club applications
  console.log('📝 Creating sample join club applications...');

  const sampleApplications = [
    {
      name: 'John Doe',
      email: 'john.doe@student.amity.edu',
      phoneNumber: '9876543210',
      branch: 'Computer Science Engineering',
      year: '2nd Year',
      departments: ['Technical Department', 'Event Management'],
      whyJoin:
        "I am passionate about technology and innovation. I want to learn from experienced members and contribute to the club's success through technical projects and event organization.",
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@student.amity.edu',
      phoneNumber: '9876543211',
      branch: 'Information Technology',
      year: '3rd Year',
      departments: ['Content Creation', 'Marketing'],
      whyJoin:
        "I have experience in digital marketing and content creation. I want to help promote the club's activities and create engaging content for our community.",
    },
    {
      name: 'Mike Johnson',
      email: 'mike.johnson@student.amity.edu',
      phoneNumber: '9876543212',
      branch: 'Electronics & Communication',
      year: '1st Year',
      departments: ['Technical Department'],
      whyJoin:
        'As a first-year student, I want to learn from seniors and gain hands-on experience in technical projects. I am excited to be part of this innovative community.',
    },
  ];

  for (const appData of sampleApplications) {
    await prisma.joinClubApplication.create({
      data: appData,
    });
  }

  console.log('✅ Sample join club applications created successfully');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('Admin: admin@texplore-amity.com / admin123');
  console.log('President: president@texplore-amity.com / president123');
  console.log('Vice President: vp@texplore-amity.com / vp123');
  console.log('Coordinator: coordinator@texplore-amity.com / coordinator123');
  console.log('Member: member@texplore-amity.com / member123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
