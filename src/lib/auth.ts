import { prisma } from './db';
import bcrypt from 'bcryptjs';
import { createSession, getSession, destroySession } from './session';
import { hasPermission as checkPermission } from './permissions';

// Simplified User type for the new schema
export interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
  emailVerified?: Date;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  role: 'member' | 'coordinator' | 'vice_president' | 'president' | 'admin';
  permissions: string[];
  departmentId?: string;
  profile?: {
    id: string;
    userId: string;
    fullName?: string;
    bio?: string;
    department?: string;
    year?: number;
    phone?: string;
    linkedin?: string;
    github?: string;
    joinDate: Date;
    skills: string[];
    projects: string[];
    createdAt: Date;
    updatedAt: Date;
  };
}

// Convert Prisma user to simplified User
function convertPrismaUserToUser(prismaUser: any): User {
  return {
    id: prismaUser.id,
    email: prismaUser.email,
    name: prismaUser.name,
    password: prismaUser.password,
    emailVerified: prismaUser.emailVerified,
    image: prismaUser.image,
    createdAt: prismaUser.createdAt,
    updatedAt: prismaUser.updatedAt,
    status: prismaUser.status,
    role: prismaUser.role,
    permissions: prismaUser.permissions || [],
    departmentId: prismaUser.departmentId,
    profile: prismaUser.profile,
  };
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Create user
export async function createUser(
  email: string,
  name: string,
  password: string,
): Promise<User> {
  const hashedPassword = await hashPassword(password);
  const normalizedEmail = email.trim().toLowerCase();

  const prismaUser = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name,
      password: hashedPassword,
      role: 'member',
      permissions: [
        'event:read',
        'gallery:read',
        'contact:submit',
        'join-club:submit',
      ],
      status: 'PENDING',
    },
    include: {
      profile: true,
    },
  });

  return convertPrismaUserToUser(prismaUser);
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  const normalizedEmail = email.trim().toLowerCase();

  const prismaUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      profile: true,
    },
  });

  return prismaUser ? convertPrismaUserToUser(prismaUser) : null;
}

// Get user by ID
export async function getUserById(id: string): Promise<User | null> {
  const prismaUser = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
    },
  });

  return prismaUser ? convertPrismaUserToUser(prismaUser) : null;
}

// Login user
export async function loginUser(
  email: string,
  password: string,
): Promise<User | null> {
  const user = await getUserByEmail(email);
  if (!user || !user.password) return null;

  const isValid = await verifyPassword(password, user.password);
  return isValid ? user : null;
}

// Get current user from session
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session?.userId) return null;

  return getUserById(session.userId);
}

// Logout user
export async function logoutUser(): Promise<void> {
  await destroySession();
}

// Require authentication
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

// Check if user has a specific role
export function hasRole(user: User, role: string): boolean {
  return user.role === role;
}

// Require specific role
export function requireRole(user: User, role: string): void {
  if (!hasRole(user, role)) {
    throw new Error(`Role '${role}' required`);
  }
}

// Check if user has permission
export function hasPermission(user: User, permission: string): boolean {
  return checkPermission(user.permissions, permission as any);
}

// Require specific permission
export function requirePermission(user: User, permission: string): void {
  if (!hasPermission(user, permission)) {
    throw new Error(`Permission '${permission}' required`);
  }
}

// Check if user can access admin panel
export function canAccessAdmin(user: User): boolean {
  return hasPermission(user, 'admin:dashboard') || user.role === 'admin';
}

// Get the first accessible admin route for a user
export function getFirstAccessibleAdminRoute(user: User): string | null {
  // Check if user has any admin access at all
  const hasAnyAdminAccess =
    hasPermission(user, 'admin:dashboard') ||
    hasPermission(user, 'user:create') ||
    hasPermission(user, 'user:update') ||
    hasPermission(user, 'user:delete') ||
    hasPermission(user, 'user:approve') ||
    hasPermission(user, 'event:read') ||
    hasPermission(user, 'event:create') ||
    hasPermission(user, 'event:update') ||
    hasPermission(user, 'event:delete') ||
    hasPermission(user, 'event:approve') ||
    hasPermission(user, 'gallery:read') ||
    hasPermission(user, 'gallery:upload') ||
    hasPermission(user, 'gallery:moderate') ||
    hasPermission(user, 'gallery:delete') ||
    hasPermission(user, 'contact:read') ||
    hasPermission(user, 'contact:update') ||
    hasPermission(user, 'contact:delete') ||
    hasPermission(user, 'join-club:view') ||
    hasPermission(user, 'join-club:manage') ||
    hasPermission(user, 'join-club:delete') ||
    hasPermission(user, 'about:read') ||
    hasPermission(user, 'about:manage') ||
    hasPermission(user, 'about:self:update') ||
    user.role === 'admin';

  if (!hasAnyAdminAccess) {
    return null;
  }

  // Route about-profile users to their own profile first.
  if (hasPermission(user, 'about:self:update')) {
    return '/admin/about/my-profile';
  }

  if (hasPermission(user, 'about:manage')) {
    return '/admin/about';
  }

  // Check each route in order of sidebar items
  if (hasPermission(user, 'admin:dashboard') || user.role === 'admin') {
    return '/admin';
  }

  if (
    hasAnyPermission(user.permissions, [
      'user:create',
      'user:update',
      'user:delete',
      'user:approve',
    ])
  ) {
    return '/admin/users';
  }

  // Check for event management permissions first, then fall back to read permission
  if (
    hasAnyPermission(user.permissions, [
      'event:create',
      'event:update',
      'event:delete',
      'event:approve',
    ]) ||
    hasPermission(user, 'event:read')
  ) {
    return '/admin/events';
  }

  // Check for gallery management permissions first, then fall back to read permission
  if (
    hasAnyPermission(user.permissions, [
      'gallery:upload',
      'gallery:moderate',
      'gallery:delete',
    ]) ||
    hasPermission(user, 'gallery:read')
  ) {
    return '/admin/gallery';
  }

  if (
    hasAnyPermission(user.permissions, [
      'contact:read',
      'contact:update',
      'contact:delete',
    ])
  ) {
    return '/admin/contact';
  }

  // Settings now gated by admin role only via sidebar features

  return null;
}

// Check if user can manage users
export function canManageUsers(user: User): boolean {
  return hasPermission(user, 'user:create') || user.role === 'admin';
}

// Check if user can manage events
export function canManageEvents(user: User): boolean {
  return hasAnyPermission(user.permissions, [
    'event:create',
    'event:update',
    'event:delete',
    'event:approve',
  ]);
}

// Check if user can read events
export function canReadEvents(user: User): boolean {
  return checkPermission(user.permissions, 'event:read' as any);
}

// Check if user can manage gallery
export function canManageGallery(user: User): boolean {
  return hasAnyPermission(user.permissions, [
    'gallery:upload',
    'gallery:moderate',
    'gallery:delete',
  ]);
}

// Check if user can manage contact
export function canManageContact(user: User): boolean {
  return hasAnyPermission(user.permissions, [
    'contact:read',
    'contact:update',
    'contact:delete',
  ]);
}

// Check if user can manage website settings
export function canManageWebsiteSettings(user: User): boolean {
  return hasAnyPermission(user.permissions, [
    'website:settings:update',
    'website:content:update',
  ]);
}

// Helper function to check if user has any of the given permissions
function hasAnyPermission(
  userPermissions: string[],
  permissions: string[],
): boolean {
  return permissions.some((permission) =>
    checkPermission(userPermissions, permission as any),
  );
}
