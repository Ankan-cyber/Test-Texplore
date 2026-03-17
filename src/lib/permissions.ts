import { Role } from '@prisma/client';

// Permission Types
export type Permission =
  // User Management
  | 'user:read'
  | 'user:create'
  | 'user:update'
  | 'user:delete'
  | 'user:approve'
  // Department Management
  | 'department:read'
  | 'department:create'
  | 'department:update'
  | 'department:delete'
  // Event Management
  | 'event:read'
  | 'event:create'
  | 'event:update'
  | 'event:delete'
  | 'event:approve'
  // Announcement Management (removed - unused)
  // Gallery Management
  | 'gallery:read'
  | 'gallery:upload'
  | 'gallery:moderate'
  | 'gallery:delete'
  // Contact Management
  | 'contact:submit'
  | 'contact:read'
  | 'contact:update'
  | 'contact:delete'
  // Join Club Management
  | 'join-club:submit'
  | 'join-club:view'
  | 'join-club:manage'
  | 'join-club:delete'
  // Settings Management
  | 'settings:access'
  // Website Management (removed - unused)
  // Admin Features
  | 'admin:dashboard';

// All available permissions
export const ALL_PERMISSIONS: Permission[] = [
  // User Management
  'user:read',
  'user:create',
  'user:update',
  'user:delete',
  'user:approve',
  // Department Management
  'department:read',
  'department:create',
  'department:update',
  'department:delete',
  // Event Management
  'event:read',
  'event:create',
  'event:update',
  'event:delete',
  'event:approve',
  // Announcement Management (removed)
  // Gallery Management
  'gallery:read',
  'gallery:upload',
  'gallery:moderate',
  'gallery:delete',
  // Contact Management
  'contact:submit',
  'contact:read',
  'contact:update',
  'contact:delete',
  // Join Club Management
  'join-club:submit',
  'join-club:view',
  'join-club:manage',
  'join-club:delete',
  // Settings Management
  'settings:access',
  // Website Management (removed)
  // Admin Features
  'admin:dashboard',
];

// Permission Groups for UI Organization
export const PERMISSION_GROUPS = {
  'User Management': [
    'user:read',
    'user:create',
    'user:update',
    'user:delete',
    'user:approve',
  ],
  'Department Management': [
    'department:read',
    'department:create',
    'department:update',
    'department:delete',
  ],
  'Event Management': [
    'event:read',
    'event:create',
    'event:update',
    'event:delete',
    'event:approve',
  ],
  // 'Announcement Management': [],
  'Gallery Management': [
    'gallery:read',
    'gallery:upload',
    'gallery:moderate',
    'gallery:delete',
  ],
  'Contact Management': [
    'contact:submit',
    'contact:read',
    'contact:update',
    'contact:delete',
  ],
  'Join Club Management': [
    'join-club:submit',
    'join-club:view',
    'join-club:manage',
    'join-club:delete',
  ],
  'Settings Management': [
    'settings:access',
  ],
  // 'Website Management': [],
  'Admin Features': ['admin:dashboard'],
} as const;

// Role Hierarchy (higher number = higher authority)
export const ROLE_HIERARCHY: Record<Role, number> = {
  member: 1,
  coordinator: 2,
  vice_president: 3,
  president: 4,
  admin: 5,
};

// Default permissions for each role
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  member: [
    'event:read',
    'gallery:read',
    'contact:submit',
    'join-club:submit',
    'settings:access',
  ],
  coordinator: [
    'event:read',
    'event:create',
    'event:update',
    'gallery:read',
    'gallery:upload',
    'contact:read',
    'contact:update',
    'join-club:view',
    'join-club:manage',
    'settings:access',
    'user:read',
  ],
  vice_president: [
    'event:read',
    'event:create',
    'event:update',
    'event:delete',
    'gallery:read',
    'gallery:upload',
    'gallery:moderate',
    'contact:read',
    'contact:update',
    'contact:delete',
    'join-club:view',
    'join-club:manage',
    'join-club:delete',
    'user:read',
    'user:create',
    'user:update',
    'department:read',
    'settings:access',
  ],
  president: [
    'event:read',
    'event:create',
    'event:update',
    'event:delete',
    'event:approve',
    'gallery:read',
    'gallery:upload',
    'gallery:moderate',
    'gallery:delete',
    'contact:read',
    'contact:update',
    'contact:delete',
    'join-club:view',
    'join-club:manage',
    'join-club:delete',
    'user:read',
    'user:create',
    'user:update',
    'user:delete',
    'user:approve',
    'department:read',
    'department:create',
    'department:update',
    'admin:dashboard',
    'settings:access',
  ],
  admin: ALL_PERMISSIONS,
};

// Permission checking functions
export function hasPermission(
  userPermissions: string[],
  permission: Permission,
): boolean {
  return userPermissions.includes(permission) || userPermissions.includes('*');
}

export function hasAnyPermission(
  userPermissions: string[],
  permissions: Permission[],
): boolean {
  return permissions.some((permission) =>
    hasPermission(userPermissions, permission),
  );
}

export function hasAllPermissions(
  userPermissions: string[],
  permissions: Permission[],
): boolean {
  return permissions.every((permission) =>
    hasPermission(userPermissions, permission),
  );
}

// Role assignment restrictions
export function canAssignRole(creatorRole: Role, targetRole: Role): boolean {
  const creatorLevel = ROLE_HIERARCHY[creatorRole];
  const targetLevel = ROLE_HIERARCHY[targetRole];
  return creatorLevel > targetLevel;
}

export function getAssignableRoles(creatorRole: Role): Role[] {
  // Business rules:
  // - Only admin can assign admin
  // - President can assign all roles except admin
  // - Vice President can assign Member, Coordinator, or Vice President (not President/Admin)
  // - Others can only assign their own role
  if (creatorRole === 'admin') {
    return Object.values(Role);
  }

  if (creatorRole === 'president') {
    return ['member', 'coordinator', 'vice_president', 'president'] as Role[];
  }

  if (creatorRole === 'vice_president') {
    return ['member', 'coordinator', 'vice_president'] as Role[];
  }

  return [creatorRole];
}

// Available permissions based on creator's role and target role
export function getAvailablePermissions(
  creatorRole: Role,
  targetRole: Role,
): Permission[] {
  // Admin can assign any permission
  if (creatorRole === 'admin') {
    return ALL_PERMISSIONS;
  }

  // President can set permissions for all roles except admin
  if (creatorRole === 'president') {
    if (['admin'].includes(targetRole)) {
      return [];
    }
    // Default to target role defaults for safety
    return DEFAULT_ROLE_PERMISSIONS[targetRole];
  }

  // Vice President can set permissions only for Member/Coordinator/Vice President
  if (creatorRole === 'vice_president') {
    if (['admin', 'president'].includes(targetRole)) {
      return [];
    }
    // Default to target role defaults for safety
    return DEFAULT_ROLE_PERMISSIONS[targetRole];
  }

  // Others: only for their own role, and only defaults
  if (targetRole !== creatorRole) {
    return [];
  }
  return DEFAULT_ROLE_PERMISSIONS[targetRole];
}

// Get default permissions for a role
export function getDefaultPermissions(role: Role): Permission[] {
  return DEFAULT_ROLE_PERMISSIONS[role];
}

// Validate permission assignment
export function validatePermissionAssignment(
  creatorRole: Role,
  targetRole: Role,
  permissions: Permission[],
): { valid: boolean; error?: string } {
  try {
    const availablePermissions = getAvailablePermissions(
      creatorRole,
      targetRole,
    );
    const invalidPermissions = permissions.filter(
      (p) => !availablePermissions.includes(p),
    );

    if (invalidPermissions.length > 0) {
      return {
        valid: false,
        error: `Cannot assign permissions: ${invalidPermissions.join(', ')}`,
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error:
        error instanceof Error
          ? error.message
          : 'Invalid permission assignment',
    };
  }
}

// Permission descriptions for UI
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  // User Management
  'user:read': 'View user profiles and information',
  'user:create': 'Create new user accounts',
  'user:update': 'Update user information',
  'user:delete': 'Delete user accounts',
  'user:approve': 'Approve or reject user registrations',

  // Department Management
  'department:read': 'View department information',
  'department:create': 'Create new departments',
  'department:update': 'Update department information',
  'department:delete': 'Delete departments',

  // Event Management
  'event:read': 'View event details and listings',
  'event:create': 'Create new events',
  'event:update': 'Update event information',
  'event:delete': 'Delete events',
  'event:approve': 'Approve or reject event submissions',

  // Announcement Management (removed)

  // Gallery Management
  'gallery:read': 'View gallery images',
  'gallery:upload': 'Upload images to gallery',
  'gallery:moderate': 'Moderate gallery content',
  'gallery:delete': 'Delete gallery images',

  // Contact Management
  'contact:submit': 'Submit contact forms',
  'contact:read': 'Read contact submissions',
  'contact:update': 'Update contact submission status',
  'contact:delete': 'Delete contact submissions',

  // Join Club Management
  'join-club:submit': 'Submit join club applications',
  'join-club:view': 'View join club applications',
  'join-club:manage': 'Manage join club applications',
  'join-club:delete': 'Delete join club applications',

  // Settings Management
  'settings:access': 'Access settings page and change password',

  // Website Management (removed)

  // Admin Features
  'admin:dashboard': 'Access admin dashboard',
};

// Interface for accessible features (for sidebar)
export interface AccessibleFeatures {
  adminDashboard: boolean;
  userManagement: boolean;
  eventManagement: boolean;
  galleryManagement: boolean;
  contactManagement: boolean;
  joinClubManagement: boolean;
  websiteSettings: boolean;
  reports: boolean;
}

// Convenience functions for common permission checks
export function canCreateEvents(userPermissions: string[]): boolean {
  return hasPermission(userPermissions, 'event:create');
}

export function canManageEvents(userPermissions: string[]): boolean {
  return hasAnyPermission(userPermissions, [
    'event:create',
    'event:update',
    'event:delete',
    'event:approve',
  ]);
}

export function canManageUsers(userPermissions: string[]): boolean {
  return hasAnyPermission(userPermissions, [
    'user:create',
    'user:update',
    'user:delete',
    'user:approve',
  ]);
}

export function canViewUsers(userPermissions: string[]): boolean {
  return hasPermission(userPermissions, 'user:read');
}

export function canManageGallery(userPermissions: string[]): boolean {
  return hasAnyPermission(userPermissions, [
    'gallery:upload',
    'gallery:moderate',
    'gallery:delete',
  ]);
}

export function canManageContact(userPermissions: string[]): boolean {
  return hasAnyPermission(userPermissions, [
    'contact:read',
    'contact:update',
    'contact:delete',
  ]);
}

export function canReadContactMessages(userPermissions: string[]): boolean {
  return hasPermission(userPermissions, 'contact:read');
}

export function canManageJoinClub(userPermissions: string[]): boolean {
  return hasAnyPermission(userPermissions, [
    'join-club:view',
    'join-club:manage',
    'join-club:delete',
  ]);
}

export function canViewJoinClubApplications(
  userPermissions: string[],
): boolean {
  return hasPermission(userPermissions, 'join-club:view');
}

export function canUploadPhotos(userPermissions: string[]): boolean {
  return hasPermission(userPermissions, 'gallery:upload');
}

export function canReadGallery(userPermissions: string[]): boolean {
  return hasPermission(userPermissions, 'gallery:read');
}

export function canAccessSettings(userPermissions: string[]): boolean {
  return hasPermission(userPermissions, 'settings:access');
}

// Website settings permission removed; gate via role or feature flags

// Get accessible features for sidebar based on user permissions
export function getAccessibleFeatures(user: {
  role: Role;
  permissions?: string[];
}): AccessibleFeatures {
  const permissions = user.permissions || [];

  return {
    adminDashboard:
      hasPermission(permissions, 'admin:dashboard') || user.role === 'admin',
    userManagement: canViewUsers(permissions),
    eventManagement: hasAnyPermission(permissions, [
      'event:read',
      'event:create',
      'event:update',
      'event:delete',
      'event:approve',
    ]),
    galleryManagement: hasAnyPermission(permissions, [
      'gallery:read',
      'gallery:upload',
      'gallery:moderate',
      'gallery:delete',
    ]),
    contactManagement: hasAnyPermission(permissions, [
      'contact:read',
      'contact:update',
      'contact:delete',
    ]),
    joinClubManagement:
      hasAnyPermission(permissions, [
        'join-club:view',
        'join-club:manage',
        'join-club:delete',
      ]) || user.role === 'admin',
    websiteSettings: hasPermission(permissions, 'settings:access'),
    reports: user.role === 'admin',
  };
}
