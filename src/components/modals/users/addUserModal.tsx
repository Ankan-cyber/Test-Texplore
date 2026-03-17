'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import {
  PERMISSION_GROUPS,
  PERMISSION_DESCRIPTIONS,
  getDefaultPermissions,
  getAvailablePermissions,
  getAssignableRoles,
  type Permission,
} from '@/lib/permissions';
import { Role } from '@prisma/client';

// Role-based permission restrictions
const ROLE_PERMISSION_RESTRICTIONS: Record<Role, Permission[]> = {
  member: [
    // User Management - No access
    'user:create',
    'user:update',
    'user:delete',
    'user:approve',
    // Department Management - No access
    'department:create',
    'department:update',
    'department:delete',
    // Event Management - Read only
    'event:create',
    'event:update',
    'event:delete',
    'event:approve',
    // Announcement Management - removed
    // Gallery Management - Read only
    'gallery:upload',
    'gallery:moderate',
    'gallery:delete',
    // Contact Management - Submit only
    'contact:read',
    'contact:update',
    'contact:delete',
    // Join Club Management - Submit only
    'join-club:view',
    'join-club:manage',
    'join-club:delete',
    // Website Management - removed
    // Admin Features - No access (dashboard only exists)
    'admin:dashboard',
  ],
  coordinator: [
    // User Management - No access
    'user:create',
    'user:update',
    'user:delete',
    'user:approve',
    // Department Management - No access
    'department:create',
    'department:update',
    'department:delete',
    // Event Management - Limited (no delete/approve)
    'event:delete',
    'event:approve',
    // Gallery Management - Limited (no moderate/delete)
    'gallery:moderate',
    'gallery:delete',
    // Contact Management - Limited (no delete)
    'contact:delete',
    // Join Club Management - Limited (no delete)
    'join-club:delete',
    // Website Management - removed
    // Admin Features - No access (dashboard only exists)
    'admin:dashboard',
  ],
  vice_president: [
    // User Management - Limited
    // Department Management - Read only
    'department:create',
    'department:update',
    'department:delete',
    // Website Management - removed
    // Admin Features - no analytics
  ],
  president: [
    // No restrictions - President has full access
  ],
  admin: [
    // No restrictions - Admin has full access
  ],
};

// Role descriptions for UI
const ROLE_RESTRICTION_DESCRIPTIONS: Record<Role, string> = {
  member: 'Basic access - can view content and submit forms only',
  coordinator:
    'Event management - can create/update events and manage basic content',
  vice_president: 'Department oversight - can manage users and departments',
  president: 'Full management - complete access to all features',
  admin: 'System administration - complete access to all features',
};

// Helper function to get restricted permissions for a role
const getRestrictedPermissions = (role: Role): Permission[] => {
  return ROLE_PERMISSION_RESTRICTIONS[role] || [];
};

// Helper function to check if a permission is restricted for a role
const isPermissionRestricted = (
  permission: Permission,
  role: Role,
): boolean => {
  return getRestrictedPermissions(role).includes(permission);
};

// Form validation schema
const addUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().min(1, 'Name is required'),
  role: z.nativeEnum(Role),
  departmentId: z.string().optional().or(z.literal('none')),
  // Profile fields
  fullName: z.string().optional(),
  year: z.string().optional(),
  phone: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

type AddUserFormData = z.infer<typeof addUserSchema>;

interface Department {
  id: string;
  name: string;
  displayName: string;
  description?: string;
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddUserFormData) => Promise<void>;
}

export default function AddUserModal({
  isOpen,
  onClose,
  onSubmit,
}: AddUserModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | ''>('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<
    Permission[]
  >([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      email: '',
      name: '',
      role: Role.member,
      departmentId: 'none',
      fullName: '',
      year: '',
      phone: '',
      permissions: [],
    },
  });

  // Get current user and departments on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current user
        const userResponse = await fetch('/api/auth/me');
        if (userResponse.ok) {
          const data = await userResponse.json();
          setCurrentUser(data.user); // Access the user property from the response
        }

        // Fetch departments
        const deptResponse = await fetch('/api/departments');
        if (deptResponse.ok) {
          const deptData = await deptResponse.json();
          setDepartments(deptData.departments);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Update available permissions when role changes
  useEffect(() => {
    console.log('Permission effect triggered:', { currentUser, selectedRole });

    if (selectedRole) {
      try {
        // Use current user role if available, otherwise use admin role for testing
        const creatorRole = currentUser?.role || 'admin';

        // Get available permissions based on role hierarchy
        let permissions = getAvailablePermissions(
          creatorRole as Role,
          selectedRole as Role,
        );

        // Apply role-based permission restrictions
        const restrictedPermissions = getRestrictedPermissions(
          selectedRole as Role,
        );
        if (restrictedPermissions.length > 0) {
          permissions = permissions.filter(
            (p) => !restrictedPermissions.includes(p),
          );
        }

        // Remove unused permissions from UI
        permissions = permissions.filter(
          (p) =>
            p !== 'contact:submit' &&
            p !== 'join-club:submit' &&
            p !== 'gallery:moderate',
        );

        console.log('Available permissions:', permissions);
        setAvailablePermissions(permissions);

        // Set default permissions for the selected role
        const defaultPerms = getDefaultPermissions(selectedRole as Role).filter(
          (p) =>
            p !== 'contact:submit' &&
            p !== 'join-club:submit' &&
            p !== 'gallery:moderate',
        );
        console.log('Default permissions:', defaultPerms);
        setSelectedPermissions(defaultPerms);
        setValue('permissions', defaultPerms);
      } catch (error) {
        console.error('Error getting available permissions:', error);
        // Fallback to safe permissions if there's an error
        const safePermissions: Permission[] = ['event:read', 'gallery:read'];
        setAvailablePermissions(safePermissions);
        setSelectedPermissions(safePermissions);
        setValue('permissions', safePermissions);
      }
    } else {
      console.log('Missing selectedRole:', {
        currentUserRole: currentUser?.role,
        selectedRole,
      });
    }
  }, [selectedRole, currentUser, setValue]);

  // Get assignable roles for current user
  const assignableRoles = currentUser?.role
    ? getAssignableRoles(currentUser.role as Role)
    : [Role.member, Role.coordinator, Role.vice_president, Role.president];

  const handleRoleChange = (role: string) => {
    setSelectedRole(role as Role);
    setValue('role', role as Role);
  };

  const handlePermissionToggle = (permission: string) => {
    const newPermissions = selectedPermissions.includes(permission)
      ? selectedPermissions.filter((p) => p !== permission)
      : [...selectedPermissions, permission];

    setSelectedPermissions(newPermissions);
    setValue('permissions', newPermissions);
  };

  const handleSelectAllPermissions = () => {
    // Only select permissions that are not restricted for the current role
    const restrictedPermissions = getRestrictedPermissions(
      selectedRole as Role,
    );
    const selectablePermissions = availablePermissions.filter(
      (p) => !restrictedPermissions.includes(p),
    );

    setSelectedPermissions(selectablePermissions);
    setValue('permissions', selectablePermissions);
  };

  const handleClearAllPermissions = () => {
    setSelectedPermissions([]);
    setValue('permissions', []);
  };

  const handleFormSubmit = async (data: AddUserFormData) => {
    setIsLoading(true);
    try {
      await onSubmit({
        ...data,
        permissions: selectedPermissions,
      });
      reset();
      setSelectedRole('');
      setSelectedPermissions([]);
      onClose();
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedRole('');
    setSelectedPermissions([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Add New User</h2>
          <p className="text-gray-600 text-sm mt-1">
            Create a new user account with comprehensive role, department, and
            permission assignments
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full max-h-[calc(90vh-140px)]">
          <form
            onSubmit={handleSubmit(handleFormSubmit)}
            className="flex-1 overflow-y-auto"
          >
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Enter the user&apos;s basic account details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Display Name</Label>
                      <Input
                        id="name"
                        {...register('name')}
                        placeholder="Enter display name"
                        className={errors.name ? 'border-red-500' : ''}
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm">
                          {errors.name.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        placeholder="Enter email address"
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm">
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Additional profile details (optional)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        {...register('fullName')}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        {...register('phone')}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="year">Year of Study</Label>
                      <Select
                        onValueChange={(value) => setValue('year', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1st Year</SelectItem>
                          <SelectItem value="2">2nd Year</SelectItem>
                          <SelectItem value="3">3rd Year</SelectItem>
                          <SelectItem value="4">4th Year</SelectItem>
                          <SelectItem value="5">5th Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="departmentId">Department</Label>
                      <Select
                        onValueChange={(value) =>
                          setValue('departmentId', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Department</SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Role Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Role Assignment</CardTitle>
                  <CardDescription>
                    Select the user&apos;s role. This determines their base
                    permissions and access level.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={selectedRole}
                      onValueChange={handleRoleChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignableRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            <div className="flex items-center gap-2">
                              <span className="capitalize">
                                {role.replace('_', ' ')}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {role === 'member' && 'Basic access'}
                                {role === 'coordinator' && 'Event management'}
                                {role === 'vice_president' &&
                                  'Department oversight'}
                                {role === 'president' && 'Full management'}
                                {role === 'admin' && 'System administration'}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.role && (
                      <p className="text-red-500 text-sm">
                        {errors.role.message}
                      </p>
                    )}
                    {selectedRole &&
                      selectedRole !== 'admin' &&
                      selectedRole !== 'president' && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <strong>Note:</strong>{' '}
                            {
                              ROLE_RESTRICTION_DESCRIPTIONS[
                                selectedRole as Role
                              ]
                            }
                          </p>
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>

              {/* Permission Selection */}
              {selectedRole && (
                <Card>
                  <CardHeader>
                    <CardTitle>Permission Assignment</CardTitle>
                    <CardDescription>
                      Select specific permissions for this user. Default
                      permissions for the selected role are pre-selected.
                    </CardDescription>
                    <div className="flex gap-2 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllPermissions}
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleClearAllPermissions}
                      >
                        Clear All
                      </Button>
                      <Badge variant="secondary">
                        {selectedPermissions.length} of{' '}
                        {availablePermissions.length} selected
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {Object.entries(PERMISSION_GROUPS).map(
                        ([groupName, permissions]) => {
                          // Skip the permission groups we want to remove
                          if (
                            groupName === 'Announcement Management' ||
                            groupName === 'Department Management' ||
                            groupName === 'Website Management'
                          ) {
                            return null;
                          }

                          const groupPermissions = permissions.filter((p) =>
                            availablePermissions.includes(p as Permission),
                          );

                          if (groupPermissions.length === 0) return null;

                          return (
                            <div key={groupName} className="space-y-4">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm">
                                  {groupName}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                  {groupPermissions.length} permissions
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pl-4">
                                {groupPermissions.map((permission: string) => {
                                  const isDisabled = isPermissionRestricted(
                                    permission as Permission,
                                    selectedRole as Role,
                                  );

                                  return (
                                    <div
                                      key={permission}
                                      className={`flex items-start space-x-3 p-3 border rounded-lg ${
                                        isDisabled
                                          ? 'bg-gray-100 opacity-60 cursor-not-allowed'
                                          : 'hover:bg-gray-50'
                                      }`}
                                    >
                                      <Checkbox
                                        id={permission}
                                        checked={selectedPermissions.includes(
                                          permission,
                                        )}
                                        onCheckedChange={() =>
                                          !isDisabled &&
                                          handlePermissionToggle(permission)
                                        }
                                        disabled={isDisabled}
                                        className="mt-1"
                                      />
                                      <div className="flex-1">
                                        <Label
                                          htmlFor={permission}
                                          className={`text-sm font-medium ${
                                            isDisabled
                                              ? 'cursor-not-allowed text-gray-500'
                                              : 'cursor-pointer'
                                          }`}
                                        >
                                          {permission
                                            .split(':')[1]
                                            ?.replace(/([A-Z])/g, ' $1')
                                            .trim() || permission}
                                          {isDisabled && (
                                            <Badge
                                              variant="destructive"
                                              className="ml-2 text-xs"
                                            >
                                              Not available for{' '}
                                              {selectedRole.replace('_', ' ')}s
                                            </Badge>
                                          )}
                                        </Label>
                                        <p className="text-xs text-gray-500 mt-1">
                                          {PERMISSION_DESCRIPTIONS[
                                            permission as Permission
                                          ] || 'No description available'}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <Separator />
                            </div>
                          );
                        },
                      )}

                      {/* Fallback if no permission groups are shown */}
                      {availablePermissions.length > 0 &&
                        Object.entries(PERMISSION_GROUPS).every(
                          ([_, permissions]) =>
                            permissions.filter((p) =>
                              availablePermissions.includes(p as Permission),
                            ).length === 0,
                        ) && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm">
                                All Permissions
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {availablePermissions.length} permissions
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pl-4">
                              {availablePermissions.map(
                                (permission: Permission) => {
                                  const isDisabled = isPermissionRestricted(
                                    permission,
                                    selectedRole as Role,
                                  );

                                  return (
                                    <div
                                      key={permission}
                                      className={`flex items-start space-x-3 p-3 border rounded-lg ${
                                        isDisabled
                                          ? 'bg-gray-100 opacity-60 cursor-not-allowed'
                                          : 'hover:bg-gray-50'
                                      }`}
                                    >
                                      <Checkbox
                                        id={permission}
                                        checked={selectedPermissions.includes(
                                          permission,
                                        )}
                                        onCheckedChange={() =>
                                          !isDisabled &&
                                          handlePermissionToggle(permission)
                                        }
                                        disabled={isDisabled}
                                        className="mt-1"
                                      />
                                      <div className="flex-1">
                                        <Label
                                          htmlFor={permission}
                                          className={`text-sm font-medium ${
                                            isDisabled
                                              ? 'cursor-not-allowed text-gray-500'
                                              : 'cursor-pointer'
                                          }`}
                                        >
                                          {permission
                                            .split(':')[1]
                                            ?.replace(/([A-Z])/g, ' $1')
                                            .trim() || permission}
                                          {isDisabled && (
                                            <Badge
                                              variant="destructive"
                                              className="ml-2 text-xs"
                                            >
                                              Not available for{' '}
                                              {selectedRole.replace('_', ' ')}s
                                            </Badge>
                                          )}
                                        </Label>
                                        <p className="text-xs text-gray-500 mt-1">
                                          {PERMISSION_DESCRIPTIONS[
                                            permission as Permission
                                          ] || 'No description available'}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                },
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Summary */}
              {selectedRole && (
                <Card>
                  <CardHeader>
                    <CardTitle>Summary</CardTitle>
                    <CardDescription>
                      Review the user&apos;s role and permissions before
                      creating
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Role:</span>
                          <Badge variant="default" className="capitalize">
                            {selectedRole.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            Permissions:
                          </span>
                          <Badge variant="secondary">
                            {selectedPermissions.length} selected
                          </Badge>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          • User will receive an email with temporary login
                          credentials
                        </p>
                        <p>
                          • They can change their password after first login
                        </p>
                        <p>
                          • Permissions can be modified later by administrators
                        </p>
                        <p>• Profile information can be updated by the user</p>
                        {selectedRole &&
                          selectedRole !== 'admin' &&
                          selectedRole !== 'president' && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                              <p className="text-blue-800 font-medium">
                                {selectedRole.charAt(0).toUpperCase() +
                                  selectedRole.slice(1).replace('_', ' ')}{' '}
                                Permissions:
                              </p>
                              <ul className="text-blue-700 text-xs mt-1 space-y-1">
                                {selectedRole === 'member' && (
                                  <>
                                    <li>• View events and gallery content</li>
                                    <li>
                                      • Submit contact forms and join club
                                      applications
                                    </li>
                                    <li>
                                      • Cannot access user management or admin
                                      features
                                    </li>
                                    <li>
                                      • Cannot create, update, or delete
                                      sensitive content
                                    </li>
                                  </>
                                )}
                                {selectedRole === 'coordinator' && (
                                  <>
                                    <li>• Create and update events</li>
                                    <li>• Upload gallery content</li>
                                    <li>• Manage contact submissions</li>
                                    <li>
                                      • Cannot delete events or access admin
                                      features
                                    </li>
                                  </>
                                )}
                                {selectedRole === 'vice_president' && (
                                  <>
                                    <li>
                                      • Full user and department management
                                    </li>
                                    <li>
                                      • Complete event and content management
                                    </li>
                                    <li>
                                      • Cannot assign roles or access website
                                      settings
                                    </li>
                                  </>
                                )}
                              </ul>
                            </div>
                          )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit(handleFormSubmit)}
              disabled={isLoading || !selectedRole}
            >
              {isLoading ? 'Creating User...' : 'Create User'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
