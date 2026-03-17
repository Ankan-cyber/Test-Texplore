'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  name: string;
  status: string;
  role: Role;
  permissions: string[];
  createdAt: string;
}

interface EditUserRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess: () => void;
}

export default function EditUserRoleModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: EditUserRoleModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | ''>('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Get current user on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const userResponse = await fetch('/api/auth/me');
        if (userResponse.ok) {
          const data = await userResponse.json();
          setCurrentUser(data.user);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    if (isOpen) {
      fetchCurrentUser();
    }
  }, [isOpen]);

  // Initialize form when user data is available
  useEffect(() => {
    if (user && currentUser) {
      setSelectedRole(user.role);
      setSelectedPermissions(user.permissions || []);
    }
  }, [user, currentUser]);

  // Update available permissions when role changes
  useEffect(() => {
    if (selectedRole && currentUser) {
      try {
        const creatorRole = currentUser?.role || 'admin';
        let permissions = getAvailablePermissions(
          creatorRole as Role,
          selectedRole as Role,
        );

        // Remove unused permissions from UI
        permissions = permissions.filter(
          (p) =>
            p !== 'contact:submit' &&
            p !== 'join-club:submit' &&
            p !== 'gallery:moderate',
        );

        setAvailablePermissions(permissions);
      } catch (error) {
        console.error('Error getting available permissions:', error);
        const safePermissions: Permission[] = ['event:read', 'gallery:read'];
        setAvailablePermissions(safePermissions);
      }
    }
  }, [selectedRole, currentUser]);

  // Get assignable roles for current user
  const assignableRoles = currentUser?.role
    ? getAssignableRoles(currentUser.role as Role)
    : [Role.member, Role.coordinator, Role.vice_president, Role.president];

  const handleRoleChange = (role: string) => {
    setSelectedRole(role as Role);
    
    // Set default permissions for the new role
    const defaultPerms = getDefaultPermissions(role as Role).filter(
      (p) =>
        p !== 'contact:submit' &&
        p !== 'join-club:submit' &&
        p !== 'gallery:moderate',
    );
    setSelectedPermissions(defaultPerms);
  };

  const handlePermissionToggle = (permission: string) => {
    const newPermissions = selectedPermissions.includes(permission)
      ? selectedPermissions.filter((p) => p !== permission)
      : [...selectedPermissions, permission];

    setSelectedPermissions(newPermissions);
  };

  const handleSelectAllPermissions = () => {
    setSelectedPermissions(availablePermissions);
  };

  const handleClearAllPermissions = () => {
    setSelectedPermissions([]);
  };

  const handleSubmit = async () => {
    if (!user || !selectedRole) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          role: selectedRole,
          permissions: selectedPermissions 
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update role');
      
      toast.success('User role updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedRole('');
    setSelectedPermissions([]);
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Edit User Role</h2>
          <p className="text-gray-600 text-sm mt-1">
            Update role and permissions for {user.name}
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full max-h-[calc(90vh-140px)]">
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* User Info */}
              <Card>
                <CardHeader>
                  <CardTitle>User Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Name</Label>
                      <p className="text-sm text-gray-600">{user.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Current Role</Label>
                      <Badge variant="outline" className="capitalize">
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <Badge variant={user.status === 'APPROVED' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Role Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Role Assignment</CardTitle>
                  <CardDescription>
                    Select the new role for this user. This determines their base permissions and access level.
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
                                {role === 'vice_president' && 'Department oversight'}
                                {role === 'president' && 'Full management'}
                                {role === 'admin' && 'System administration'}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Permission Selection */}
              {selectedRole && (
                <Card>
                  <CardHeader>
                    <CardTitle>Permission Assignment</CardTitle>
                    <CardDescription>
                      Select specific permissions for this user. Default permissions for the selected role are pre-selected.
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
                        {selectedPermissions.length} of {availablePermissions.length} selected
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {Object.entries(PERMISSION_GROUPS).map(([groupName, permissions]) => {
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
                              <h4 className="font-medium text-sm">{groupName}</h4>
                              <Badge variant="outline" className="text-xs">
                                {groupPermissions.length} permissions
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pl-4">
                              {groupPermissions.map((permission: string) => (
                                <div
                                  key={permission}
                                  className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                                >
                                  <Checkbox
                                    id={permission}
                                    checked={selectedPermissions.includes(permission)}
                                    onCheckedChange={() => handlePermissionToggle(permission)}
                                    className="mt-1"
                                  />
                                  <div className="flex-1">
                                    <Label
                                      htmlFor={permission}
                                      className="text-sm font-medium cursor-pointer"
                                    >
                                      {permission
                                        .split(':')[1]
                                        ?.replace(/([A-Z])/g, ' $1')
                                        .trim() || permission}
                                    </Label>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {PERMISSION_DESCRIPTIONS[permission as Permission] || 'No description available'}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <Separator />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

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
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || !selectedRole}
            >
              {isLoading ? 'Updating...' : 'Update Role'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
